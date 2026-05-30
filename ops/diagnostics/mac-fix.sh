#!/bin/bash
# mac-fix.sh — Auto-correct the fixable issues found by mac-check.sh
#
# What it tries to fix (each step asks confirmation unless --yes is passed):
#   - Disable Mac sleep so bot.js stays alive
#   - Restart TradingView Desktop with CDP port 9222
#   - Restart bot.js if not running
#   - Patch bot.js with VIP integration if missing
#   - Install/reload Obsidian sync LaunchAgent
#   - Start Remote Control daemon
#   - Kill stale node processes (interactive)
#
# Usage:
#   bash mac-fix.sh          # interactive, asks before each fix
#   bash mac-fix.sh --yes    # apply all fixes without prompting (use carefully)

set +e

AUTO_YES=0
[ "${1:-}" = "--yes" ] && AUTO_YES=1

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'

BOT_DIR="/Users/johnreilly/trading-bot"
BOT_FILE="$BOT_DIR/bot.js"

confirm() {
  if [ "$AUTO_YES" = "1" ]; then return 0; fi
  printf "${YELLOW}? %s [y/N] ${RESET}" "$1"
  read -r ans
  [[ "$ans" =~ ^[Yy]$ ]]
}
say() { printf "${CYAN}▸ %s${RESET}\n" "$1"; }
ok()  { printf "  ${GREEN}✅ %s${RESET}\n" "$1"; }
skip(){ printf "  ${YELLOW}↪ skipped: %s${RESET}\n" "$1"; }
err() { printf "  ${RED}❌ %s${RESET}\n" "$1"; }

printf "${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${CYAN}║  JJR Mac Auto-Fix — $(date '+%Y-%m-%d %H:%M:%S')                 ║${RESET}\n"
printf "${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}\n"

# ----- Fix 1: Disable Mac sleep -----
say "Fix 1 — disable Mac sleep so bot.js doesn't pause overnight"
sleep_now=$(pmset -g | grep -E "^\s*sleep\s" | awk '{print $2}')
if [ "$sleep_now" = "0" ]; then
  ok "Sleep already disabled"
elif confirm "Disable system sleep? (requires sudo)"; then
  sudo pmset -a sleep 0 && ok "Sleep disabled" || err "pmset failed"
else
  skip "sleep stays at ${sleep_now}min"
fi

# ----- Fix 2: TradingView Desktop with CDP -----
say "Fix 2 — TradingView running with CDP port 9222"
if pgrep -f "TradingView.app" >/dev/null && lsof -nP -iTCP:9222 -sTCP:LISTEN >/dev/null 2>&1; then
  ok "TradingView already running with CDP open"
elif confirm "Restart TradingView with --remote-debugging-port=9222?"; then
  pkill -9 -f "TradingView.app" 2>/dev/null
  sleep 3
  nohup /Applications/TradingView.app/Contents/MacOS/TradingView \
    --remote-debugging-port=9222 > /tmp/tv.log 2>&1 &
  disown
  sleep 8
  if lsof -nP -iTCP:9222 -sTCP:LISTEN >/dev/null 2>&1; then
    ok "TradingView relaunched with CDP open"
  else
    err "CDP port still not listening — check /tmp/tv.log"
  fi
else
  skip "TradingView state unchanged"
fi

# ----- Fix 3: bot.js running -----
say "Fix 3 — bot.js process up"
if [ ! -f "$BOT_FILE" ]; then
  err "bot.js not found at $BOT_FILE — cannot start"
elif pgrep -f "node.*bot\.js" >/dev/null; then
  ok "bot.js already running"
elif confirm "Start bot.js?"; then
  cd "$BOT_DIR"
  node -c "$BOT_FILE" 2>&1 | grep -v "^$"
  if node -c "$BOT_FILE" 2>/dev/null; then
    nohup node bot.js > /tmp/bot.log 2>&1 &
    disown
    sleep 2
    pgrep -f "node.*bot\.js" >/dev/null && ok "bot.js started" || err "bot.js failed to start — check /tmp/bot.log"
  else
    err "bot.js has syntax errors — fix before starting"
  fi
  cd - >/dev/null
else
  skip "bot.js stays down"
fi

# ----- Fix 4: Patch bot.js with VIP integration -----
say "Fix 4 — bot.js VIP patch"
if [ -f "$BOT_FILE" ] && grep -q "async function sendVIP" "$BOT_FILE"; then
  ok "VIP patch already applied"
elif [ -f "$BOT_FILE" ] && confirm "Apply VIP patch (sendVIP + /vip command)?"; then
  if command -v gh >/dev/null 2>&1; then
    gh api repos/jjrpro/code/contents/projects/jaurx-vip/bot/patch-bot.js?ref=claude/jjr-ops-handoff-QHQJj \
      -H "Accept: application/vnd.github.raw" > /tmp/patch-bot.js && \
    node /tmp/patch-bot.js "$BOT_FILE" && ok "VIP patch applied" || err "Patch failed"
    # Restart bot to pick up changes
    if pgrep -f "node.*bot\.js" >/dev/null; then
      pkill -f "node.*bot\.js"
      sleep 1
      cd "$BOT_DIR" && nohup node bot.js > /tmp/bot.log 2>&1 & disown
      cd - >/dev/null
      ok "bot.js restarted with new patch"
    fi
  else
    err "gh CLI not installed — run patch manually"
  fi
else
  skip "no patch applied"
fi

# ----- Fix 5: Obsidian sync LaunchAgent -----
say "Fix 5 — Obsidian sync LaunchAgent"
LABEL="com.jjr.obsidian-jaurx-sync"
if launchctl list 2>/dev/null | grep -q "$LABEL"; then
  ok "Obsidian sync already running"
elif confirm "Install Obsidian sync LaunchAgent?"; then
  if command -v gh >/dev/null 2>&1; then
    gh api repos/jjrpro/code/contents/ops/obsidian-sync/install-mac-sync.sh?ref=claude/jjr-ops-handoff-QHQJj \
      -H "Accept: application/vnd.github.raw" > /tmp/install-mac-sync.sh && \
    bash /tmp/install-mac-sync.sh && ok "Obsidian sync installed" || err "Install failed"
  else
    err "gh CLI not installed — manual install required"
  fi
else
  skip "no Obsidian sync installed"
fi

# ----- Fix 6: Remote Control daemon -----
say "Fix 6 — Claude Remote Control daemon"
if command -v claude >/dev/null 2>&1; then
  rc_running=$(claude remote-control status 2>&1 | grep -ci "running\|active")
  if [ "$rc_running" -gt 0 ]; then
    ok "Remote Control already active"
  elif confirm "Start Remote Control daemon?"; then
    claude remote-control start && ok "Remote Control started" || err "remote-control start failed"
  else
    skip "Remote Control stays off"
  fi
else
  err "claude CLI not in PATH"
fi

# ----- Fix 7: Kill stale node processes -----
say "Fix 7 — clean up stale node processes"
node_pids=$(pgrep -f "node" | wc -l | tr -d ' ')
if [ "$node_pids" -lt 5 ]; then
  ok "Node process count healthy ($node_pids)"
else
  printf "  Node processes (${node_pids} total):\n"
  ps -o pid,etime,command -p $(pgrep -f node | head -20 | tr '\n' ',' | sed 's/,$//') 2>/dev/null | head -15 | sed 's/^/     /'
  if confirm "Kill all node processes EXCEPT bot.js?"; then
    bot_pid=$(pgrep -f "node.*bot\.js" | head -1)
    for pid in $(pgrep -f node); do
      if [ "$pid" != "$bot_pid" ]; then kill -9 "$pid" 2>/dev/null; fi
    done
    ok "Stale node processes killed (bot.js preserved)"
  else
    skip "no node processes killed"
  fi
fi

echo ""
printf "${CYAN}━━━ FIX-UP COMPLETE ━━━${RESET}\n"
printf "Re-run ${CYAN}bash mac-check.sh${RESET} to verify the changes stuck.\n"
echo ""
