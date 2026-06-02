# Lucid Trading Prop Firm — API & Programmatic Execution Research

**Date:** 2026-06-02
**Summary:** Complete research on whether Lucid Trading (and prop firms on Tradovate generally) allow programmatic/API trading, and what workarounds exist.

---

## 1. Does Lucid Trading allow API access on funded accounts?

**Short answer: Not directly through Tradovate's API, but YES through authorized third-party platforms.**

Lucid Trading's marketing materials claim "custom API access for algorithmic trading in Python, Java, or C++." However, the reality on the Tradovate side is more nuanced:

- **Tradovate's own API Access add-on is disabled on all prop firm accounts.** This is confirmed by Tradovate community moderators and multiple forum threads. The $25/mo API Access subscription that gives you a `cid` + `sec` (client ID + secret) does NOT work on prop firm sub-accounts.
- **The restriction comes from Tradovate's prop firm account architecture**, not from Lucid specifically. Prop firm accounts are sub-accounts under the firm's master account, and Tradovate does not expose direct API credentials for them.
- **Lucid does allow automated/algorithmic trading** in their rules. Bots, algos, and trade copiers are permitted as long as you follow their trading rules (no latency arbitrage, no HFT exploits).

---

## 2. Is the Tradovate API Access add-on available on Lucid funded accounts?

**No. Locked by Tradovate's architecture.**

From the Tradovate community forums:
- "Prop accounts do not allow direct API access" — Tradovate moderator
- "A personal Tradovate API key won't access prop firm accounts. You'd need a separate key or permission from both Tradovate and the prop firm" — forum user
- "Unless prop account companies are asked for API access, they have no reason to offer it" — moderator advice

This means the `bridge/pipeline.py execute` flow built for JAURX (which uses Tradovate REST API with cid/sec credentials) will NOT work on a Lucid Trading funded account directly.

---

## 3. What DOES work — Authorized Vendor Workarounds

Two platforms have solved this problem by becoming **authorized Tradovate vendors**, which gives them API access that individual traders cannot get on prop accounts:

### TradersPost ($0-$299/mo)
- **Has a dedicated Lucid Trading integration page** (traderspost.io/connections/lucid-trading)
- Connects to Lucid accounts through Tradovate
- Works via webhooks: TradingView/TrendSpider alert → TradersPost webhook → Tradovate order execution
- **No separate Tradovate API Access add-on purchase required** — TradersPost's vendor status handles it
- 40,000+ traders, 20M+ trades executed, $200M+ in connected accounts
- Tiers: Free (basic testing), up to $299/mo (advanced multi-account)

### PickMyTrade ($50/mo)
- Supports "any prop firm that uses Tradovate as their trading platform"
- Also an authorized Tradovate vendor — API access included automatically
- Sub-200ms execution from TradingView alert to Tradovate order
- Supports Tradovate + Rithmic + ProjectX — all three major prop firm platforms
- 10,000+ traders, 5M+ automated trades
- Flat $50/mo, unlimited strategies and trades

**How these bypass the restriction:** Both are authorized Tradovate API partners/vendors. They have their own API credentials that can interact with prop firm sub-accounts. You connect your Tradovate login (the one Lucid gives you) to their platform, and they handle order routing through their vendor API access.

---

## 4. Lucid Trading's Technology Stack

Lucid Trading is NOT a single-platform firm. They support multiple execution pathways:

### Supported Platforms (as of 2026)
- **Tradovate** (browser + desktop)
- **Rithmic** (low-latency execution + data feed)
- **NinjaTrader** (via Rithmic or Tradovate data connection)
- **TradingView**
- **Quantower**
- **Sierra Chart**
- **MotiveWave**
- **Bookmap** (order flow, via Rithmic)
- **Jigsaw Daytradr** (order flow, via Rithmic)
- **R|Trader Pro**
- **MultiCharts**

### Account Type Differences
- **LucidFlex**: Tradovate only (no Rithmic). NinjaTrader connects through Tradovate data connection.
- **LucidBlack**: Supports Rithmic connectivity, enabling full NinjaTrader + Rithmic data/execution feeds.
- **LucidPro / LucidDirect**: Standard Tradovate + platform access.

---

## 5. The Rithmic Path — Most Promising for Custom Bots

**This is potentially the best path for running JAURX's custom Python bot on a Lucid funded account.**

If JR gets a **LucidBlack** account (which includes Rithmic):
- Rithmic provides its own API (separate from Tradovate)
- NinjaTrader 8 supports automated strategy execution through Rithmic
- Rithmic API is accessible via R|Trader Pro and NinjaTrader's ATM/strategy automation
- Multiple prop firms allow automated NinjaTrader strategies on Rithmic accounts

**However:** Rithmic's API is C++ native (with Python wrappers available through third parties). It's a different integration than the Tradovate REST API the bridge currently uses.

---

## 6. TradingView Alerts/Webhooks → Lucid Trading Account

**YES — this is the easiest path and it works today.**

Flow:
```
TradingView Alert (webhook)
    → TradersPost or PickMyTrade (receives webhook)
        → Tradovate order execution (on Lucid funded account)
```

Setup:
1. Connect Lucid Tradovate login to TradersPost or PickMyTrade
2. Set up TradingView alerts with webhook URL
3. Alerts fire → webhook received → order placed on funded account

This means JAURX could:
- Run analysis/signals in Claude
- Format as TradingView-compatible alert or direct webhook JSON
- Fire webhook to TradersPost/PickMyTrade
- Order executes on Lucid funded account

**Cost:** TradersPost free tier for testing, or PickMyTrade $50/mo for production.

---

## 7. Summary: All Execution Paths for Lucid Trading

| Method | Works? | Account Type | Cost | Latency | Notes |
|---|---|---|---|---|---|
| Tradovate REST API (direct) | NO | Any | $25/mo | ~ms | Blocked on prop accounts |
| TradersPost webhook | YES | Any (Tradovate) | $0-299/mo | sub-second | Authorized vendor bypass |
| PickMyTrade webhook | YES | Any (Tradovate) | $50/mo | sub-200ms | Authorized vendor bypass |
| NinjaTrader automated strategy | YES | LucidBlack (Rithmic) | NT8 license | ~ms | Requires Rithmic account type |
| Rithmic API (custom code) | MAYBE | LucidBlack | Rithmic fees | ~ms | C++ native, Python wrappers exist |
| TradingView manual alerts | YES | Any | TV subscription | seconds | Manual confirmation needed |

---

## 8. Recommended Path for JAURX on a Lucid Funded Account

**Option A (Fastest, cheapest):** TradersPost or PickMyTrade webhook integration
- JAURX generates signal → sends webhook → order executes on Lucid account
- Works with any Lucid account type on Tradovate
- $50/mo (PickMyTrade) or free tier (TradersPost)
- Sub-second execution

**Option B (Most control):** LucidBlack + NinjaTrader + Rithmic
- Run automated NinjaTrader strategies on Rithmic-connected LucidBlack account
- Full programmatic control via NinjaTrader's C#/NinjaScript
- Requires LucidBlack account tier specifically

**Option C (Custom but complex):** LucidBlack + Rithmic API
- Write custom Python bot using Rithmic API wrappers
- Most similar to current bridge/pipeline.py architecture
- Requires porting from Tradovate REST to Rithmic protocol

---

## Key Rules to Follow on Lucid Funded Accounts

- Algorithmic trading, bots, and trade copiers ARE allowed
- Latency arbitrage is PROHIBITED
- HFT exploits are PROHIBITED
- Must follow all standard Lucid rules (drawdown limits, position sizing, etc.)
- Confirm specific automation approach with Lucid support before going live

---

## Sources

- Tradovate Community Forums (API Access for PropFirm Accounts)
- TradersPost Lucid Trading integration page
- PickMyTrade supported prop firms
- TradersPost prop firm use cases
- Lucid Trading official website
- Multiple prop firm review sites (PropTradingVibes, DamnPropFirms, PropFirmShop)
- Tradovate Help Center
