#!/bin/bash
# Package a folder of generated assets into a sellable pack ZIP (with a license).
#
#   scripts/build-pack.sh <pack-id> <assets-dir>
#
# Example:
#   scripts/build-pack.sh lux-broll-01 ~/Downloads/lux-broll-assets
#
# Produces packs/<pack-id>.zip, which server.js serves to paying buyers.
set -euo pipefail

PACK_ID="${1:?usage: build-pack.sh <pack-id> <assets-dir>}"
SRC="${2:?usage: build-pack.sh <pack-id> <assets-dir>}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/packs/${PACK_ID}.zip"

[ -d "$SRC" ] || { echo "assets dir not found: $SRC"; exit 1; }
command -v zip >/dev/null || { echo "need the 'zip' command (preinstalled on macOS)"; exit 1; }

mkdir -p "$ROOT/packs"
TMP="$(mktemp -d)"
cp -R "$SRC"/. "$TMP"/

cat > "$TMP/LICENSE.txt" <<EOF
DropVault — Commercial Use License
Pack: ${PACK_ID}
Issued: $(date +%Y-%m-%d)

You may use these assets in your own content (social posts, videos, ads,
client work) including monetized channels. You may NOT resell or redistribute
the raw files as a pack. No attribution required.
EOF

( cd "$TMP" && zip -r -q "$OUT" . )
rm -rf "$TMP"
echo "built $OUT ($(du -h "$OUT" | cut -f1)), $(unzip -l "$OUT" | tail -1 | awk '{print $2}') files"
