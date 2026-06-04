#!/usr/bin/env bash
# CLAURX — always-on host bootstrap. Run ONCE on a fresh Ubuntu box (the $6/mo
# VM). Idempotent: safe to re-run. Installs Node, clones the repo, creates the
# git-ignored .env stubs, and installs the briefing cron (11:00 + 21:30 EST).
# It does NOT put any secret in git — keys go into local .env files only.
#
# Usage (paste on the box):
#   curl -fsSL <raw-url>/setup-host.sh | bash
# or after cloning:
#   bash projects/claurx/host/setup-host.sh

set -euo pipefail

REPO_URL="${CLAURX_REPO_URL:-https://github.com/jjrpro/code}"
BRANCH="${CLAURX_BRANCH:-claude/ecstatic-allen-5Z9Ay}"
DEST="${CLAURX_DIR:-$HOME/claurx-host}"
TZ_WANT="America/New_York"

say() { printf '\n\033[1;36m▍ %s\033[0m\n' "$*"; }

say "1/6 · System packages (node, git, tzdata)"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs git
else
  echo "node $(node -v) already present"
fi
sudo timedatectl set-timezone "$TZ_WANT" 2>/dev/null || true

say "2/6 · Clone / update repo at $DEST"
if [ -d "$DEST/.git" ]; then
  git -C "$DEST" fetch origin "$BRANCH" && git -C "$DEST" checkout "$BRANCH" && git -C "$DEST" pull origin "$BRANCH"
else
  git clone -b "$BRANCH" "$REPO_URL" "$DEST"
fi

say "3/6 · Create git-ignored .env stubs (fill these with your keys)"
mk() { [ -f "$1" ] || { cp "$2" "$1" 2>/dev/null || touch "$1"; echo "created $1"; }; }
mk "$DEST/projects/claurx/shopify/shopify.env"   "$DEST/projects/claurx/shopify/shopify.env.example"
mk "$DEST/projects/claurx/tradovate/tradovate.env" "$DEST/projects/claurx/tradovate/tradovate.env.example"
cat > "$DEST/projects/claurx/host/host.env.template" <<'ENV'
# Fill these on the host only. NEVER commit. Delivery + data-source keys.
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
OPENWEATHER_API_KEY=
WEATHER_LOCATION=Staten Island,US
# Google Calendar: paste refresh token after the one-time OAuth grant
GOOGLE_CALENDAR_REFRESH_TOKEN=
ENV
mk "$DEST/projects/claurx/host/host.env" "$DEST/projects/claurx/host/host.env.template"

say "4/6 · Smoke test the briefing (offline sections must render)"
node "$DEST/projects/claurx/briefing/briefing.mjs" | head -n 12 || true

say "5/6 · Install cron (11:00 briefing, 21:30 recap)"
CRON_B="0 11 * * * cd $DEST && /usr/bin/node projects/claurx/briefing/briefing.mjs >> $DEST/briefing.log 2>&1"
CRON_E="30 21 * * * cd $DEST && /usr/bin/node projects/claurx/briefing/briefing.mjs --evening >> $DEST/briefing.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'briefing/briefing.mjs' ; echo "$CRON_B" ; echo "$CRON_E" ) | crontab -
echo "cron installed:"; crontab -l | grep briefing.mjs

say "6/6 · Done"
cat <<DONE

CLAURX host is bootstrapped at: $DEST
Timezone: $(cat /etc/timezone 2>/dev/null || echo unknown)

NEXT (yours, ~10 min):
  1. Fill keys in:
       $DEST/projects/claurx/host/host.env
       $DEST/projects/claurx/shopify/shopify.env   (after approving the app)
  2. Flip sections true in:
       $DEST/projects/claurx/briefing/briefing.config.json
  3. Re-run a test:  node $DEST/projects/claurx/briefing/briefing.mjs

Delivery wiring (Telegram/email) is added once host.env has a token.
DONE
