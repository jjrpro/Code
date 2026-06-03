#!/bin/bash
# CLAURX — run the Shopify read-only pull and save a dated briefing.
# Forgiving by design: a briefing should never hard-crash the scheduler.

cd "$(dirname "$0")" || exit 1
mkdir -p briefings logs

DATE="$(date +%Y-%m-%d)"
STAMP="$(date '+%Y-%m-%d %H:%M %Z')"
OUT="briefings/${DATE}-shopify.md"

if [ ! -f shopify.env ]; then
  echo "[$STAMP] no shopify.env — skipping" >> logs/briefing.log
  exit 0
fi

set -a; . ./shopify.env; set +a

{
  echo "# CLAURX Shopify briefing — ${DATE}"
  echo
  echo "_Generated ${STAMP}_"
  echo
  echo '```'
  node claurx-shopify.mjs 2>&1 || echo "(pull failed — see message above)"
  echo '```'
} > "$OUT"

cp "$OUT" briefings/latest-shopify.md
echo "[$STAMP] wrote $OUT" >> logs/briefing.log
