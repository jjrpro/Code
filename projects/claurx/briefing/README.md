# CLAURX · Daily Briefing

The 11AM morning briefing + evening recap, in CLAURX's voice. Composes a
briefing from sources that are **actually connected** — anything not wired
renders "not connected" rather than inventing a number.

## Run it
```bash
node briefing.mjs            # morning briefing
node briefing.mjs --evening  # evening recap
node briefing.mjs --date 2026-06-03
```

## What's live vs. pluggable
| Section | Source | Status |
|---|---|---|
| Trading | `../journal/equity.mjs` | ✅ live, offline |
| Open loops | `open-loops.md` | ✅ live, offline |
| Store | `../shopify/claurx-shopify.mjs` | ⏳ wire once app approved |
| Weather / Market news / Calendar | host API keys | ⏳ stubs until keys land |

Toggle a section on in `briefing.config.json` once its source is wired. Keep
`open-loops.md` current (one line per item, `TODO:`/`WAIT:`/`IDEA:`/`DONE:`).

## Making it self-driving (the always-on host)
This script is the *content*; it needs a body that's on 24/7 to fire it on a
schedule. On the always-on box (see `../2026-06-03-claurx-always-on-box-plan.md`):
```cron
0 11 * * *  node /path/to/briefing/briefing.mjs           >> /path/briefing.log
30 21 * * * node /path/to/briefing/briefing.mjs --evening >> /path/briefing.log
```
Pipe the output wherever you want it delivered (Telegram, email, a note that
syncs to Obsidian). Delivery wiring is host-side and added when the box exists.
