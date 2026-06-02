---
title: JAURX HUB — Everything in one place
created: 2026-06-02
tags:
  - jaurx
  - trading
  - hub
  - index
pinned: true
---

# ⭐ JAURX HUB — the one note to find everything

> **This is the bubble.** Everything JAURX — the AI trading system — lives here or
> links from here. Date built: **2026-06-02**. Branch: `claude/epic-maxwell-KhURK`.
> Repo path: `projects/jaurx-trading/`.

---

## 30-second status

- **What it is:** a unified AI futures-trading system for **MGC (Micro Gold)** and **MNQ (Micro Nasdaq)** on Tradovate (Lucid Trading funded prop account), feeding the **JAURX VIP** Telegram channel.
- **What works now:** live data, multi-timeframe TA, ML signals, position sizing, VIP alerts, backtests, and a Telegram `/ai` assistant.
- **Execution:** three paths built; for the Lucid prop account the route is the **webhook bridge (TradersPost / PickMyTrade)** or **TradingView Desktop** — Tradovate's direct API is blocked on prop accounts.
- **Honest record:** **no trade has ever been auto-executed.** See [[2026-06-02-jaurx-execution-status-and-truth]].
- **Trade rule locked in:** JR requires **≥65% win probability or NO TRADE.**

---

## Companion notes (click through)

| Note | What's in it |
|---|---|
| [[2026-06-02-jaurx-super-trader-inventory]] | Master inventory of the 7 source repos + architecture |
| [[2026-06-02-jaurx-execution-status-and-truth]] | The honest record: no trades placed, why, and the unlock |
| [[2026-06-02-lucid-trading-prop-firm-api-research]] | Prop-firm API findings (TradersPost / PickMyTrade / Rithmic) |
| [[2026-06-02-tradovate-api-reference]] | Full Tradovate REST/WS API reference |
| [[SETUP]] | Paste-ready Mac setup guide |

---

## The system (7 layers)

1. **Data Engine** — TradingView + Yahoo Finance (live macro, prices) — `bridge/data_engine.py`
2. **Chart Control** — TradingView Desktop via Jackson MCP — `bridge/tv_bridge.js`
3. **Decision Brain** — TradingAgents multi-agent debate — `bridge/decision_brain.py`
4. **Execution** — Tradovate / webhook / TV Desktop — `bridge/tradovate_client.py`, `bridge/webhook_execute.py`, `bridge/tv_execute.js`
5. **ML Signals** — LightGBM on 1h bars — `bridge/ml_signals.py`
6. **Trading Skills** — 11 copied skills — `skills/`
7. **Sizing + Alerts + Rules** — `bridge/position_sizer.py`, `bridge/alert_formatter.py`, `config/rules.json`

Orchestrated by `bridge/pipeline.py`.

---

## Complete file map

**Bridge (`bridge/`)**
- `pipeline.py` — main CLI: macro, morning, scan, ml, size, alert, backtest, full, **execute**, **trade**
- `data_engine.py` — live macro + multi-timeframe TA
- `ml_signals.py` — LightGBM signal engine
- `decision_brain.py` — TradingAgents wrapper (needs ANTHROPIC_API_KEY)
- `position_sizer.py` — futures risk-based sizing
- `alert_formatter.py` — paste-ready VIP Telegram alerts
- `tradovate_client.py` — Tradovate REST + WS (retail API path)
- `webhook_execute.py` — **prop-account execution** via TradersPost / PickMyTrade
- `tv_execute.js` — **TradingView Desktop execution** via Chrome DevTools
- `tv_bridge.js` — chart control / drawing (Jackson MCP)
- `package.json` — Node deps (`ws`)

**Config (`config/`)**
- `jaurx-config.json` — instruments, risk, sessions, Tradovate URLs, Telegram
- `rules.json` — JR's trading rules (placeholder — needs his real methodology)
- `credentials.json` — **gitignored**, never pushed (Tradovate login + webhook URL)
- `ml-gold-1h.json`, `ml-nasdaq-1h.json` — ML configs

**Scripts (`scripts/`)**
- `launch_tv_debug_mac.sh` — launch TradingView with debug port

**Skills / workflows** — `skills/` (11), `skillsets/` (4), `workflows/` (5)

**Telegram `/ai` bot** — `projects/jaurx-vip/bot/bot-ai-patch.js`
- Claude Opus 4.8 + tool use; runs the pipeline live and replies in Telegram.
- Authorized user: **5680523955 (@johnjreilly)**; channel: **-1003952631411**.

---

## Execution — which path for Lucid

Tradovate **blocks direct API access on all prop firm accounts.** So:

| Path | Command | Needs |
|---|---|---|
| **Webhook (recommended)** | `python3 -m bridge.pipeline trade buy MGC 4507 4485 4540,4575,4610` | TradersPost (free) or PickMyTrade ($50/mo) URL in `credentials.json` |
| **TradingView Desktop** | `node bridge/tv_execute.js buy MGC 4507 4485 4540,4575,4610` | TV Desktop open w/ debug port + Tradovate connected; run `recon` first |
| **Tradovate API** | `python3 -m bridge.pipeline execute ...` | $25/mo API add-on — **blocked on prop accounts** |

---

## Latest market read (2026-06-02) — NO TRADE

- Gold ~$4,548, **1H RSI ~81 (overbought)**, Daily RSI ~39 (pullback); ML bearish lean.
- ML out-of-sample best win rate ~**42%** — far below JR's **65%** floor → **NO TRADE.**
- **Watch zone (long):** pullback into **$4,510–4,528** demand confluence (1H SMA20/50/200 + stacked bull FVGs), stop < $4,504, targets $4,583 → $4,627. Major support $4,382 (daily SMA200).

---

## Key IDs & params

- **VIP channel:** `-1003952631411` · **Authorized user:** `5680523955` (@johnjreilly)
- **Instruments:** MGC ($10/pt, 0.10 tick) · MNQ ($2/pt, 0.25 tick)
- **Risk:** 1%/trade · 3% daily max · 3 positions · TP 50/30/20 · BE after TP1
- **Tradovate login:** stored in gitignored `credentials.json` (not in repo)

---

## Run it (from `projects/jaurx-trading/`)

```bash
python3 -m bridge.pipeline macro       # live macro
python3 -m bridge.pipeline full        # macro -> ML -> bias
python3 -m bridge.pipeline ml GC=F     # gold ML signal
python3 -m bridge.pipeline size MGC 4507 4485 4540,4575,4610
python3 -m bridge.pipeline trade buy MGC 4507 4485 4540,4575,4610   # webhook execute
```

---

## Blocked on JR (next steps)

1. **Pick execution path:** sign up for TradersPost (free) → paste webhook URL into `credentials.json`; OR run the TV Desktop `recon` and paste output back.
2. **Teach real rules:** replace placeholder `config/rules.json` with actual FVG/zone/entry criteria.
3. **Telegram /ai:** `npm install @anthropic-ai/sdk`, set `ANTHROPIC_API_KEY`, wire `registerAiCommand(bot)` into bot.js.
4. **(Optional)** ANTHROPIC_API_KEY for the multi-agent decision brain.

---

*This hub is the durable index for JAURX. If you only keep one note, keep this one.*
