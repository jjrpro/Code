#!/bin/bash
# CLAURX — install the daily Shopify briefing as a macOS LaunchAgent.
# Run once: bash install-launchagent.sh

set -e
PLIST="com.claurx.shopify-briefing.plist"
SRC="$(cd "$(dirname "$0")" && pwd)/$PLIST"
DEST="$HOME/Library/LaunchAgents/$PLIST"

mkdir -p "$HOME/Library/LaunchAgents"
cp "$SRC" "$DEST"

# reload cleanly if already loaded
launchctl unload "$DEST" 2>/dev/null || true
launchctl load "$DEST"

echo "Installed: runs daily at 8:45 AM."
echo "Test it right now with:  launchctl start com.claurx.shopify-briefing"
echo "Then read:               briefings/latest-shopify.md"
echo "Remove later with:       launchctl unload \"$DEST\" && rm \"$DEST\""
