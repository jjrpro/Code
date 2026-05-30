#!/bin/bash
# Auto-sync revenue/ notes to the remote branch so Obsidian Git can pull them.
# Fires on the Stop hook. Skips silently if nothing changed.
#
# Receives Claude Code Stop event JSON on stdin (ignored — we only act on tree state).
# Output (when sync happens): one-line JSON with `systemMessage` so the user sees a status.
# Output (no changes): nothing — silent success.

set -u
REPO_ROOT="/home/user/Code"
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
  # macOS/Linux compatible sed in-place edit
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

# If after staging there's still nothing new (e.g. all changes already committed), bail
if git diff --cached --quiet; then
  exit 0
fi

# Build a commit message listing what changed
changed_count=$(git diff --cached --name-only | wc -l | tr -d ' ')
msg="auto-sync: ${changed_count} file(s) updated [stop-hook]"

git -c commit.gpgsign=false commit -m "$msg" --quiet 2>&1 >/dev/null || exit 0

# Push, with one retry on transient failure
if ! git push -u origin "$branch" --quiet 2>/dev/null; then
  sleep 2
  git push -u origin "$branch" --quiet 2>/dev/null || {
    printf '{"systemMessage":"⚠️ auto-sync: commit ok, push failed (check network)"}\n'
    exit 0
  }
fi

printf '{"systemMessage":"📝 auto-synced %s file(s) → %s"}\n' "$changed_count" "$branch"
