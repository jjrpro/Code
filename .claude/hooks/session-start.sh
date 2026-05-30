#!/bin/bash
# SessionStart hook — installs dependencies so future Claude Code on the web
# sessions in this repo can run scripts and tests without a manual npm install.
#
# Only fires in remote (web) sessions; local sessions already have whatever
# the user has installed.
#
# Idempotent — `npm install` is a no-op if everything is already present.

set -euo pipefail

# Only run in Claude Code on the web (remote env). Local sessions skip.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_ROOT="${CLAUDE_PROJECT_DIR:-/home/user/Code}"

# ----- projects/jaurx-vip/stripe-diy (express + stripe webhook server) -----
if [ -f "$REPO_ROOT/projects/jaurx-vip/stripe-diy/package.json" ]; then
  echo "[session-start] installing projects/jaurx-vip/stripe-diy deps"
  cd "$REPO_ROOT/projects/jaurx-vip/stripe-diy"
  npm install --no-audit --no-fund --loglevel=error
fi

echo "[session-start] done"
