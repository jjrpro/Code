#!/bin/bash
# Auto-sync session changes to the remote so Obsidian Git (and the Mac/Windows
# pull-loops) can fetch them. Fires on the Stop hook. Skips if nothing changed.
#
# PERMANENT VAULT MIRROR
# ----------------------
# Each web session works on its own throwaway branch (claude/<random>), but JR's
# Mac + Windows Obsidian sync only ever pull ONE fixed branch ($VAULT_BRANCH).
# To stop new work from landing where the vault can't see it, this hook mirrors
# the current session branch into $VAULT_BRANCH on every sync — fast-forward when
# possible, merge if the vault moved (Obsidian-side edits) so nothing is lost.
# Result: no matter which branch a session runs on, the vault stays current and
# no per-machine reconfiguration is ever needed.
#
# Receives Claude Code Stop event JSON on stdin (ignored — we act on tree state).
# Output (on sync): one-line JSON `systemMessage` status. Output (no change): none.

set -u
REPO_ROOT="/home/user/Code"
VAULT_BRANCH="claude/jjr-ops-handoff-QHQJj"   # the branch JR's Mac/Windows pull
cd "$REPO_ROOT" || exit 0

# Bail if not a git repo (defensive)
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Drain stdin so the hook framework doesn't block
cat >/dev/null 2>&1 || true

# Check for ANY uncommitted change anywhere in the tree
if git diff --quiet && git diff --cached --quiet && [ -z "$(git status --porcelain)" ]; then
  exit 0
fi

# Refresh the "modified" timestamp in ops/MEMORY.md if it exists
if [ -f ops/MEMORY.md ]; then
  today=$(date +%Y-%m-%d)
  if sed --version >/dev/null 2>&1; then
    sed -i "s/^modified: .*/modified: ${today}/" ops/MEMORY.md 2>/dev/null || true
  else
    sed -i '' "s/^modified: .*/modified: ${today}/" ops/MEMORY.md 2>/dev/null || true
  fi
fi

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -z "$branch" ] || [ "$branch" = "HEAD" ]; then
  exit 0
fi

# Stage everything (intentional — we want all session changes synced)
git add -A 2>/dev/null

# If after staging there's still nothing new, bail
if git diff --cached --quiet; then
  exit 0
fi

# Build a commit message listing what changed
changed_count=$(git diff --cached --name-only | wc -l | tr -d ' ')
msg="auto-sync: ${changed_count} file(s) updated [stop-hook]"

git -c commit.gpgsign=false commit -m "$msg" --quiet 2>&1 >/dev/null || exit 0

# Fetch + rebase before push so concurrent commits on the SAME branch don't
# cause a non-fast-forward rejection.
git fetch origin "$branch" --quiet 2>/dev/null || true
if ! git pull --rebase --autostash origin "$branch" --quiet 2>/dev/null; then
  git rebase --abort 2>/dev/null || true
  printf '{"systemMessage":"⚠️ auto-sync: rebase conflict on %s — resolve manually"}\n' "$branch"
  exit 0
fi

# Push the session branch, with one retry on transient failure
if ! git push -u origin "$branch" --quiet 2>/dev/null; then
  sleep 2
  git push -u origin "$branch" --quiet 2>/dev/null || {
    printf '{"systemMessage":"⚠️ auto-sync: commit ok, push failed (check network)"}\n'
    exit 0
  }
fi

# --- Permanent vault mirror -------------------------------------------------
vault_status=""
if [ "$branch" = "$VAULT_BRANCH" ]; then
  vault_status=" (is vault branch)"
else
  git fetch origin "$VAULT_BRANCH" --quiet 2>/dev/null || true
  # Fast-forward path: vault is behind us -> push our HEAD straight onto it.
  if git push origin "HEAD:$VAULT_BRANCH" --quiet 2>/dev/null; then
    vault_status=" + vault"
  else
    # Vault moved (e.g. Obsidian-side edits) -> merge it in, then push both.
    if git merge "origin/$VAULT_BRANCH" --no-edit -m "auto-sync: merge vault branch" --quiet 2>/dev/null; then
      if git push origin "HEAD:$VAULT_BRANCH" --quiet 2>/dev/null \
         && git push -u origin "$branch" --quiet 2>/dev/null; then
        vault_status=" + vault (merged)"
      else
        vault_status=" ⚠️ vault push failed (check network)"
      fi
    else
      git merge --abort 2>/dev/null || true
      vault_status=" ⚠️ vault mirror conflict — resolve manually"
    fi
  fi
fi

printf '{"systemMessage":"📝 auto-synced %s file(s) → %s%s"}\n' "$changed_count" "$branch" "$vault_status"
