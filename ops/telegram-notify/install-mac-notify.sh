#!/bin/bash
# install-mac-notify.sh — set up the Mac-side Telegram notifier watcher.
# Posts new notes from the synced repo's ops/telegram-notify/outbox/ to your
# Telegram chat every 60s via a LaunchAgent. Safe to re-run (idempotent).
#
# Usage:
#   bash install-mac-notify.sh [REPO_DIR]
#
# REPO_DIR defaults to your Obsidian vault clone (~/Documents/Obsidian/JaurxOps),
# which is the repo your existing sync already keeps up to date.
#
# PREREQS (one-time):
#   1) Create a bot: open Telegram, message @BotFather -> /newbot -> copy the token.
#   2) Get your chat id: add the bot to your chat, send it a message, then visit
#      https://api.telegram.org/bot<TOKEN>/getUpdates and copy "chat":{"id": ... }.
#      (Or DM @userinfobot for your personal id.)
#   3) Save creds OUTSIDE the repo:
#        echo '{"token":"YOUR_TOKEN","chatId":"YOUR_CHAT_ID"}' > ~/.jaurx-telegram.json
#        chmod 600 ~/.jaurx-telegram.json

set -e

REPO_DIR="${1:-$HOME/Documents/Obsidian/JaurxOps}"
WATCHER="$REPO_DIR/ops/telegram-notify/watch.js"
LABEL="com.jjr.telegram-notify"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
LOG_FILE="$HOME/Library/Logs/jjr-telegram-notify.log"

echo "[install] repo dir:  $REPO_DIR"
echo "[install] watcher:   $WATCHER"

# ----- checks -----
if [ ! -f "$WATCHER" ]; then
  echo "❌ Can't find $WATCHER — point REPO_DIR at your repo clone."
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js not found. Install it (e.g. 'brew install node') and re-run."
  exit 1
fi
if [ ! -f "$HOME/.jaurx-telegram.json" ] && [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "⚠️  No creds found. Create ~/.jaurx-telegram.json first (see PREREQS above)."
  echo "    Continuing — the watcher will error until creds exist."
fi

NODE_BIN="$(command -v node)"
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$(dirname "$PLIST")"

# ----- write the LaunchAgent -----
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$WATCHER</string>
  </array>
  <key>WorkingDirectory</key>
  <string>$REPO_DIR/ops/telegram-notify</string>
  <key>StartInterval</key>
  <integer>60</integer>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$LOG_FILE</string>
  <key>StandardErrorPath</key>
  <string>$LOG_FILE</string>
</dict>
</plist>
EOF
echo "[install] wrote $PLIST"

# ----- (re)load -----
if launchctl list | grep -q "$LABEL"; then
  launchctl unload "$PLIST" 2>/dev/null || true
fi
launchctl load "$PLIST"

sleep 2
if launchctl list | grep -q "$LABEL"; then
  echo ""
  echo "✅ Telegram notifier installed and running (checks every 60s)"
  echo "   Watching: $REPO_DIR/ops/telegram-notify/outbox/"
  echo "   Log:      $LOG_FILE"
  echo ""
  echo "Test it now:"
  echo "   node \"$REPO_DIR/ops/telegram-notify/notify.js\" \"✅ Notifier is live\""
  echo ""
  echo "To stop:    launchctl unload \"$PLIST\""
else
  echo "❌ LaunchAgent failed to register. Check $LOG_FILE"
  exit 1
fi
