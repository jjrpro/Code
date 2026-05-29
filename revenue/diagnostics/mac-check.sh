#!/bin/bash
# mac-check.sh — Full system diagnostic for JJR's Mac
#
# What it checks (each section reports PASS / WARN / FAIL with details):
#   1. System state — uptime, disk, memory, sleep config
#   2. TradingView Desktop + CDP port 9222
#   3. bot.js process + log
#   4. Tradovate API auth + account state
#   5. Telegram bot health + JAURX channel admin status
#   6. Shopify Admin API + store config
#   7. Obsidian sync LaunchAgent (the one we just installed)
#   8. Git state of /Users/johnreilly/trading-bot
#   9. Claude Code CLI + remote control
#  10. Stale node processes
#
# Safe to run — read-only, no mutations.
# Usage:
#   bash mac-check.sh
# Or pipe to a log:
#   bash mac-check.sh 2>&1 | tee ~/mac-diagnostic-$(date +%Y%m%d-%H%M%S).log

set +e  # don't bail on first failure — we want full report

# ----- Color helpers -----
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
RESET='\033[0m'
PASS_CT=0; WARN_CT=0; FAIL_CT=0

section() { printf "\n${CYAN}━━━ %s ━━━${RESET}\n" "$1"; }
pass()    { printf "  ${GREEN}✅ %s${RESET}\n" "$1"; PASS_CT=$((PASS_CT+1)); }
warn()    { printf "  ${YELLOW}⚠️  %s${RESET}\n" "$1"; WARN_CT=$((WARN_CT+1)); }
fail()    { printf "  ${RED}❌ %s${RESET}\n" "$1"; FAIL_CT=$((FAIL_CT+1)); }
info()    { printf "     %s\n" "$1"; }

BOT_DIR="/Users/johnreilly/trading-bot"
BOT_FILE="$BOT_DIR/bot.js"

# Helper — pull a constant value from bot.js
get_bot_const() {
  local name="$1"
  grep -E "^\s*const\s+${name}\s*=" "$BOT_FILE" 2>/dev/null | \
    head -1 | sed -E "s/.*=\s*['\"]?([^'\";]+)['\"]?\s*;?.*/\1/"
}

printf "${CYAN}╔══════════════════════════════════════════════════════════╗${RESET}\n"
printf "${CYAN}║  JJR System Diagnostic — $(date '+%Y-%m-%d %H:%M:%S %Z')         ║${RESET}\n"
printf "${CYAN}╚══════════════════════════════════════════════════════════╝${RESET}\n"

# ============================================================
section "1) SYSTEM STATE"
# ============================================================
uptime_str=$(uptime)
info "Uptime: $uptime_str"
disk_pct=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$disk_pct" -lt 80 ]; then pass "Disk: ${disk_pct}% used (root)"; \
elif [ "$disk_pct" -lt 90 ]; then warn "Disk: ${disk_pct}% used — getting tight"; \
else fail "Disk: ${disk_pct}% used — clean up before bot crashes"; fi

mem_pressure=$(memory_pressure 2>/dev/null | grep -E "System-wide memory free percentage" | awk -F: '{print $2}' | tr -d ' %')
if [ -n "$mem_pressure" ] && [ "$mem_pressure" -gt 20 ]; then pass "Memory: ${mem_pressure}% free"; \
elif [ -n "$mem_pressure" ]; then warn "Memory: ${mem_pressure}% free — close apps"; \
else info "Memory: could not read"; fi

sleep_setting=$(pmset -g | grep -E "^\s*sleep\s" | awk '{print $2}')
if [ "$sleep_setting" = "0" ]; then pass "Sleep disabled — bot stays alive"; \
else warn "Sleep timeout: ${sleep_setting}min — Mac sleep kills bot.js. Run: sudo pmset -a sleep 0"; fi

# ============================================================
section "2) TRADINGVIEW DESKTOP + CDP"
# ============================================================
tv_pid=$(pgrep -f "TradingView.app" | head -1)
if [ -n "$tv_pid" ]; then pass "TradingView running (PID $tv_pid)"; \
else fail "TradingView not running"; fi

cdp_port=$(lsof -nP -iTCP:9222 -sTCP:LISTEN 2>/dev/null | tail -1)
if [ -n "$cdp_port" ]; then
  pass "CDP port 9222 listening"
  cdp_resp=$(curl -s --max-time 3 http://127.0.0.1:9222/json/version 2>/dev/null)
  if echo "$cdp_resp" | grep -q "Browser"; then
    info "CDP responding: $(echo "$cdp_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("Browser","?"))' 2>/dev/null)"
  fi
else
  fail "CDP port 9222 not listening"
  info "Fix: pkill -9 -f TradingView && sleep 3 && nohup /Applications/TradingView.app/Contents/MacOS/TradingView --remote-debugging-port=9222 > /tmp/tv.log 2>&1 & disown"
fi

# ============================================================
section "3) bot.js PROCESS & STATE"
# ============================================================
if [ ! -f "$BOT_FILE" ]; then
  fail "bot.js not found at $BOT_FILE"
else
  pass "bot.js exists ($(wc -l <"$BOT_FILE" | tr -d ' ') lines)"

  node -c "$BOT_FILE" 2>/dev/null && pass "bot.js syntax OK" || fail "bot.js has syntax errors"

  bot_pid=$(pgrep -f "node.*bot\.js" | head -1)
  if [ -n "$bot_pid" ]; then
    bot_age=$(ps -o etime= -p "$bot_pid" | tr -d ' ')
    pass "bot.js running (PID $bot_pid, uptime $bot_age)"
  else
    fail "bot.js NOT running"
    info "Fix: cd $BOT_DIR && nohup node bot.js > /tmp/bot.log 2>&1 & disown"
  fi

  if [ -f /tmp/bot.log ]; then
    last_log=$(tail -1 /tmp/bot.log)
    info "Last log line: $last_log"
    err_ct=$(grep -ci "error\|fail\|exception" /tmp/bot.log | tail -1)
    if [ "$err_ct" -gt 5 ]; then warn "/tmp/bot.log has $err_ct error mentions"; fi
  else
    warn "/tmp/bot.log not found — bot may not be logging"
  fi

  # VIP_CHANNEL_ID present?
  if grep -q "VIP_CHANNEL_ID" "$BOT_FILE"; then
    vip_id=$(get_bot_const VIP_CHANNEL_ID)
    if [ -n "$vip_id" ] && [ "$vip_id" != "-1001234567890" ]; then
      pass "VIP_CHANNEL_ID set to $vip_id"
    else
      warn "VIP_CHANNEL_ID still placeholder — patch needed"
    fi
  else
    warn "VIP_CHANNEL_ID not in bot.js — run patch-bot.js"
  fi

  grep -q "async function sendVIP" "$BOT_FILE" && pass "sendVIP() helper present" || warn "sendVIP() missing — run patch-bot.js"
  grep -q "cmd === 'vip'" "$BOT_FILE" && pass "/vip command handler present" || warn "/vip command missing — run patch-bot.js"
fi

# ============================================================
section "4) TRADOVATE API"
# ============================================================
# We can't pull the live access token (it's runtime-fetched by bot via TV).
# Best we can do: confirm tv-demo.tradovateapi.com is reachable.
trado_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://tv-demo.tradovateapi.com 2>&1)
if [ "$trado_code" = "200" ] || [ "$trado_code" = "404" ] || [ "$trado_code" = "401" ]; then
  pass "Tradovate API reachable (HTTP $trado_code)"
else
  fail "Tradovate API unreachable (HTTP $trado_code)"
fi

# ============================================================
section "5) TELEGRAM BOT HEALTH"
# ============================================================
TELEGRAM_TOKEN=$(get_bot_const TELEGRAM_TOKEN)
if [ -z "$TELEGRAM_TOKEN" ]; then
  fail "TELEGRAM_TOKEN not found in bot.js"
else
  pass "TELEGRAM_TOKEN found ($(echo $TELEGRAM_TOKEN | cut -c1-15)…)"

  me_resp=$(curl -s --max-time 5 "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getMe" 2>/dev/null)
  bot_username=$(echo "$me_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["result"]["username"]) if d.get("ok") else print("")' 2>/dev/null)
  if [ -n "$bot_username" ]; then
    pass "Telegram bot reachable: @$bot_username"
  else
    fail "Telegram getMe failed: $(echo $me_resp | head -c 100)"
  fi

  # Check VIP channel admin status
  VIP_ID=$(get_bot_const VIP_CHANNEL_ID)
  if [ -n "$VIP_ID" ] && [ "$VIP_ID" != "-1001234567890" ]; then
    admin_resp=$(curl -s --max-time 5 "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChatAdministrators?chat_id=${VIP_ID}" 2>/dev/null)
    if echo "$admin_resp" | grep -q "\"ok\":true"; then
      pass "Bot can see JAURX channel ($VIP_ID)"
      mem_resp=$(curl -s --max-time 5 "https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChatMemberCount?chat_id=${VIP_ID}" 2>/dev/null)
      ct=$(echo "$mem_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("result","?"))' 2>/dev/null)
      info "JAURX member count: $ct"
    else
      fail "Bot NOT admin in JAURX channel"
      info "Fix: in Telegram, JAURX → Admins → Add Admin → @$bot_username, give Post + Invite perms"
    fi
  fi
fi

# ============================================================
section "6) SHOPIFY ADMIN API"
# ============================================================
SHOPIFY_TOKEN=$(get_bot_const SHOPIFY_TOKEN)
SHOPIFY_SHOP=$(get_bot_const SHOPIFY_SHOP)
if [ -z "$SHOPIFY_TOKEN" ] || [ -z "$SHOPIFY_SHOP" ]; then
  warn "Shopify creds not found in bot.js"
else
  pass "Shopify creds found ($SHOPIFY_SHOP)"
  shop_resp=$(curl -s --max-time 5 -H "X-Shopify-Access-Token: $SHOPIFY_TOKEN" \
    "https://${SHOPIFY_SHOP}/admin/api/2024-01/shop.json" 2>/dev/null)
  shop_name=$(echo "$shop_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["shop"]["name"])' 2>/dev/null)
  if [ -n "$shop_name" ]; then
    pass "Shopify auth OK — store name: \"$shop_name\""
    if [ "$shop_name" = "JaurxShops" ]; then info "Brand renamed ✅"; else warn "Store name is \"$shop_name\" — rename to JaurxShops"; fi

    # Domain check
    domain=$(echo "$shop_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["shop"]["domain"])' 2>/dev/null)
    primary=$(echo "$shop_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["shop"]["primary_locale"])' 2>/dev/null)
    info "Domain: $domain"
    if [[ "$domain" == *.myshopify.com ]]; then warn "Still on .myshopify.com — buy custom domain"; \
    else pass "Custom domain configured"; fi

    # Product count
    prod_resp=$(curl -s --max-time 5 -H "X-Shopify-Access-Token: $SHOPIFY_TOKEN" \
      "https://${SHOPIFY_SHOP}/admin/api/2024-01/products/count.json" 2>/dev/null)
    prod_ct=$(echo "$prod_resp" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("count","?"))' 2>/dev/null)
    info "Product count: $prod_ct"
  else
    fail "Shopify auth failed: $(echo $shop_resp | head -c 100)"
  fi
fi

# ============================================================
section "7) OBSIDIAN SYNC LAUNCHAGENT"
# ============================================================
LABEL="com.jjr.obsidian-jaurx-sync"
if launchctl list 2>/dev/null | grep -q "$LABEL"; then
  pass "LaunchAgent loaded: $LABEL"
  agent_state=$(launchctl list | grep "$LABEL" | awk '{print $1, $2}')
  info "PID/exit: $agent_state"
  LOG_FILE="$HOME/Library/Logs/jjr-obsidian-sync.log"
  if [ -f "$LOG_FILE" ]; then
    info "Last log entry: $(tail -1 "$LOG_FILE")"
  else
    info "Log not yet written (no pulls have run)"
  fi
else
  warn "Obsidian sync LaunchAgent not loaded — run install-mac-sync.sh"
fi

# ============================================================
section "8) bot.js REPO GIT STATE"
# ============================================================
if [ -d "$BOT_DIR/.git" ]; then
  pass "bot.js directory is a git repo"
  cd "$BOT_DIR"
  if [ -z "$(git status --porcelain)" ]; then
    pass "Working tree clean"
  else
    warn "Uncommitted changes in $BOT_DIR:"
    git status --short | head -10 | sed 's/^/     /'
  fi
  cd - >/dev/null
else
  info "bot.js dir not a git repo (that's OK, it may be standalone)"
fi

# ============================================================
section "9) CLAUDE CODE CLI"
# ============================================================
if command -v claude >/dev/null 2>&1; then
  ver=$(claude --version 2>/dev/null | head -1)
  pass "claude CLI installed: $ver"

  auth=$(claude auth status 2>&1 | head -3)
  if echo "$auth" | grep -qi "logged in\|signed in\|email"; then
    pass "claude auth OK"
    info "$auth" | head -2
  else
    warn "claude auth unclear — run: claude auth status"
  fi

  rc_status=$(claude remote-control status 2>&1 | head -3)
  if echo "$rc_status" | grep -qi "running\|active\|enabled"; then
    pass "Remote Control daemon active"
  else
    warn "Remote Control not active — run: claude remote-control start"
    info "$(echo $rc_status | head -c 200)"
  fi
else
  warn "claude CLI not in PATH"
fi

# ============================================================
section "10) STALE NODE PROCESSES"
# ============================================================
node_procs=$(pgrep -f "node" | wc -l | tr -d ' ')
if [ "$node_procs" -lt 5 ]; then pass "Node processes: $node_procs (healthy)"; \
elif [ "$node_procs" -lt 15 ]; then warn "Node processes: $node_procs (some accumulation)"; \
else fail "Node processes: $node_procs — kill stale ones with: pkill -f 'node.*old-script'"; fi

# ============================================================
echo ""
printf "${CYAN}━━━ SUMMARY ━━━${RESET}\n"
printf "  ${GREEN}PASS: %d${RESET}   ${YELLOW}WARN: %d${RESET}   ${RED}FAIL: %d${RESET}\n" "$PASS_CT" "$WARN_CT" "$FAIL_CT"
echo ""
if [ "$FAIL_CT" -gt 0 ]; then
  printf "${RED}Critical issues found.${RESET} Run mac-fix.sh to auto-correct fixable ones,\n"
  printf "or read the FAIL/WARN lines above and address manually.\n"
elif [ "$WARN_CT" -gt 0 ]; then
  printf "${YELLOW}System usable, some warnings.${RESET} Consider running mac-fix.sh.\n"
else
  printf "${GREEN}All systems green.${RESET}\n"
fi
echo ""
