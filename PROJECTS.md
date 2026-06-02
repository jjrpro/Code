# Projects Index

Top-level map of what's in this repo. Each directory under `projects/` is a
distinct workstream; `ops/` is shared infrastructure that supports all of them.

---

## Active projects

### `projects/jaurx-vip/` — Telegram trade-alerts monetization
$49/mo private Telegram channel for live MGC + MNQ trade alerts.
- **`launch/`** — VIP launch playbook, Whop launch pack, copy templates
- **`bot/`** — bot.js patches for `/vip` command + bracket auto-broadcast
- **`stripe-diy/`** — Stripe + Telegram alternative to Whop (DIY infra)

### `projects/shopify-dropship/` — JaurxShops magnetic phone wallet
Dropship store + ad scale-up.
- `SHOPIFY-ADS.md` — TikTok Spark + Meta Advantage+ playbook
- `shopify-audit.md` — 18-point conversion self-diagnostic
- `shopify-playbook.md` — blind playbook for the magnetic wallet niche

### `projects/jjrpro-site/` — JJR Pro / Jaurx flagship site
Animated multi-service site for JR's own business (signals, TradingView/MCP
automation, Telegram bots, web design + maintenance, AI support, managed ads,
JaurxShops). Live CTAs: Whop VIP checkout, @JaurxBot, Shopify store, email.

### `projects/local-638/` — Steamfitters website
Static template for Local 638 Steamfitters.

### `projects/si-web-design/` — Local business websites (SI side business)
Kit for selling websites to Staten Island small businesses (10312 + 5-mi radius).
- **`template/`** — reusable, self-contained 1-page site template
- **`demos/`** — 4 fictional demos (pizzeria, contractor, salon, auto shop)
- **`mockups/`** — 3 real 10312 prospects with no website (barber, deli, nails)
- **`sales/`** — prospect-list method, lead tracker CSV, outreach, pricing, deploy guide

### `projects/real-estate-flip/` — NY/NJ wholesale & flip deal-sourcing
Middleman (contract-assignment) and flip deal screening for the NY/NJ metro.
- `2026-06-02-nynj-flip-deal-screening-worksheet.md` — search filters, deal
  math, county distressed-property sources, 12-point screen, NY/NJ legal
  guardrails (HETPA / NJ Foreclosure Rescue Fraud Prevention Act)

### `projects/trade-analysis/` — Research & setups
Bearish/bullish thesis files with entry/SL/TP. Archive of trade ideas with
the supporting macro + technical evidence.

---

## Shared infrastructure

### `ops/` — Cross-project plumbing
- `MEMORY.md` — single source of truth for session state across all projects
- `WEEKEND-CHECKLIST.md` — multi-project sprint plan
- `obsidian-sync/` — Mac + Windows installers for bi-directional Obsidian ↔ repo sync
  - `install-mac-sync.sh` (LaunchAgent, every 60s)
  - `install-windows-sync.ps1` (Scheduled Task, every 1 min)
- `telegram-notify/` — pushes finished work + pitches to Telegram (Mac watcher
  posts `outbox/` notes via Bot API; runs on Mac, not the cloud)
- `diagnostics/` — Mac environment check + fix scripts

### `.claude/` — Claude Code config
- `settings.json` — hooks config
- `hooks/session-start.sh` — installs `projects/jaurx-vip/stripe-diy` deps in web sessions
- `hooks/sync-memory.sh` — auto-commits + pushes on every Stop event

---

## How to find things fast

| Looking for… | Path |
|---|---|
| Current state across all projects | `ops/MEMORY.md` |
| What to do this weekend | `ops/WEEKEND-CHECKLIST.md` |
| Whop launch screens, paste-ready | `projects/jaurx-vip/launch/whop-launch-pack.md` |
| Bot patches to apply on Mac | `projects/jaurx-vip/bot/` |
| Latest trade analysis | `projects/trade-analysis/` |
