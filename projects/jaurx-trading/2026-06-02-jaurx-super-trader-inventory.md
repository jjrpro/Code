# JAURX Super Trader — Combined Tooling Inventory

**Date**: 2026-06-02
**Purpose**: Master inventory of the four repos being merged into the JAURX AI trading system.

---

## The Four Source Repos

| Repo | Language | Role | Tools |
|---|---|---|---|
| `tradingview-mcp` (atilaahmettaner) | Python | **Data Layer** — screeners, backtesting, sentiment, news | 30+ |
| `tradingview-mcp-jackson` (LewisWJackson) | Node.js | **Chart Layer** — TradingView Desktop control, Pine Script, replay | 81 |
| `TradingAgents` (TauricResearch) | Python | **Decision Layer** — multi-agent firm simulation, risk mgmt, memory | Full pipeline |
| `bitget-trading-bot` (jerome78b) | Python | **Execution Layer** — live order execution, TP/SL/TPP, Telegram alerts | Single bot |

---

## Layer 1: DATA ENGINE (tradingview-mcp)

No API keys required. Pulls from TradingView screener + Yahoo Finance + Reddit + RSS.

### Screeners & Scanners
- `top_gainers` / `top_losers` — by exchange + timeframe
- `bollinger_scan` — squeeze detection (low BBW)
- `rating_filter` — filter by Bollinger Band rating (-3 to +3)
- `volume_breakout_scanner` — volume spike + price breakout
- `smart_volume_scanner` — volume + RSI combo filter
- `consecutive_candles_scan` — growing/shrinking candle patterns
- `advanced_candle_pattern` — multi-timeframe pattern detection

### Single-Asset Analysis
- `coin_analysis` — 23+ indicators with BUY/SELL/HOLD on any exchange
- `multi_timeframe_analysis` — Weekly → Daily → 4H → 1H → 15m alignment
- `multi_agent_analysis` — 3-agent debate (Technical, Sentiment, Risk) → final rating
- `combined_analysis` — technicals + sentiment + news in one call

### Backtesting
- `backtest_strategy` — 9 strategies: RSI, Bollinger, MACD, EMA Cross, Supertrend, Donchian, RSI Pullback, Keltner Breakout, Triple EMA
- `compare_strategies` — ranks all 9 on same symbol with Sharpe, Calmar, Expectancy
- `walk_forward_backtest_strategy` — train/test validation, overfitting detection

### Market Data
- `yahoo_price` — real-time quote (52-week data)
- `market_snapshot` — global overview (S&P, crypto, FX, ETFs)
- `bitcoin_market_pulse` — BTC dominance + risk assessment
- `stock_extended_hours` — pre-market / after-hours prices
- `stock_options_chain` — full options chain
- `stock_options_unusual_activity` — institutional positioning (V/OI screener)

### Sentiment & News
- `market_sentiment` — Reddit bullish/bearish scoring
- `financial_news` — RSS from Yahoo Finance, MarketWatch, CNBC, CoinDesk

### JR-Relevant Symbols
- `GC=F` / `MGC=F` — Gold futures (his MGC)
- `NQ=F` / `MNQ=F` — Nasdaq futures (his MNQ)
- `SPY`, `QQQ`, `GLD` — ETF proxies
- `^VIX` — volatility index
- DXY, 10Y yield via Yahoo Finance

---

## Layer 2: CHART CONTROLLER (tradingview-mcp-jackson)

Connects to TradingView Desktop via Chrome DevTools Protocol. Runs locally on JR's Mac.

### Chart Reading
- `chart_get_state` — current symbol, timeframe, all indicator names + entity IDs
- `data_get_study_values` — numeric values from ALL visible indicators
- `quote_get` — real-time price snapshot
- `data_get_ohlcv` — price bars with summary mode
- `data_get_pine_lines` — custom indicator price levels
- `data_get_pine_labels` — text annotations with prices
- `data_get_pine_tables` — table data from Pine indicators
- `data_get_pine_boxes` — price zones as {high, low} pairs

### Chart Control
- `chart_set_symbol` / `chart_set_timeframe` / `chart_set_type`
- `chart_manage_indicator` — add/remove studies
- `chart_scroll_to_date` — jump to specific date
- `indicator_set_inputs` — change indicator settings

### Pine Script Development
- `pine_set_source` — inject code
- `pine_smart_compile` — compile + check errors
- `pine_get_errors` / `pine_get_console` — debug output
- Static analysis tools

### Replay & Practice
- `replay_start` — enter replay mode at any historical date
- `replay_step` — step through bars
- `replay_trade` — simulated buy/sell/close
- `replay_status` — track position + P&L

### Drawing & Visualization
- `draw_shape` — horizontal lines, trend lines, rectangles, text
- `capture_screenshot` — full chart or specific regions
- Multi-pane layouts (2x2, 3x1, etc.)

### Morning Brief System
- `morning_brief` — scans watchlist, reads indicators, applies rules.json bias criteria
- `session_save` / `session_get` — daily brief persistence + comparison
- `rules.json` — configurable watchlist, bias criteria, entry/exit rules, risk rules

### Automation
- `alert_create` / `alert_list` / `alert_delete` — manage price alerts
- `batch_run` — run actions across multiple symbols/timeframes
- Live data streaming (JSONL)

---

## Layer 3: DECISION BRAIN (TradingAgents)

Full trading firm simulation with multi-agent debate. Supports Claude as the LLM provider.

### Analyst Team
- **Fundamentals Analyst** — company financials, intrinsic value
- **Sentiment Analyst** — news + StockTwits + Reddit aggregation
- **News Analyst** — macroeconomic indicators, global events
- **Technical Analyst** — MACD, RSI pattern detection
- **Social Media Analyst** — broader social signals

### Researcher Team
- **Bull Researcher** — argues the long case
- **Bear Researcher** — argues the short case
- Structured debate with configurable rounds

### Risk Management
- **Aggressive Debater** — pushes for higher risk tolerance
- **Conservative Debater** — argues for caution
- **Neutral Debater** — balances both sides
- Portfolio manager approves/rejects proposals

### Trader Agent
- Synthesizes all reports → determines timing + magnitude
- Outputs: BUY / SELL / HOLD with confidence + reasoning

### Decision Memory
- Persistent trading memory at `~/.tradingagents/memory/trading_memory.md`
- Reflects on realized returns and alpha performance
- Injects historical lessons into future decisions

### Data Sources
- Yahoo Finance (price, fundamentals)
- Alpha Vantage (alternative data)
- Reddit sentiment
- StockTwits
- News headlines
- Technical indicators

### Configuration for JR
```python
config = {
    "llm_provider": "anthropic",
    "deep_think_llm": "claude-opus-4-6",
    "quick_think_llm": "claude-sonnet-4-6",
    "max_debate_rounds": 2,
    "max_risk_discuss_rounds": 2,
}
```

---

## Layer 4: EXECUTION ENGINE (bitget-trading-bot)

Live order execution on Bitget futures. The piece that actually places trades.

### Order Execution
- Market order placement with automatic position sizing
- Long and short entries on USDT futures pairs
- Configurable leverage (e.g., 3x) and margin mode (crossed/isolated)
- Capital engagement percentage per trade (default 10%)

### Risk Management
- Automated Take Profit + Stop Loss placement per trade
- Partial Take Profit (TPP) — trailing trigger + partial exit fraction
- Separate TP/SL percentages for longs vs shorts
- Position protection mechanisms

### Strategy Engine
- Bollinger Bands (configurable period + multiplier)
- RSI filter (configurable period + thresholds)
- Volatility filter (bandwidth measurement)
- Combined signal logic: BB + RSI + volatility → LONG/SHORT

### Monitoring & Alerts
- Live dashboard: mark price, capital, unrealized P&L, margin
- Telegram notifications for trade events
- Signal diagnostics in console
- Structured logging to file

### Configuration Highlights
```python
USE_DEMO = True           # Demo vs live (safety switch)
SYMBOL = "ETHUSDT"        # Trading pair
TIMEFRAME = "15m"         # Candle interval
LEVERAGE = 3              # Position leverage
CAPITAL_ENGAGEMENT = 0.10 # 10% of capital per trade
TP_PERCENT_LONG = 4.1     # Take profit for longs
SL_PERCENT_LONG = 1.5     # Stop loss for longs
BOLL_PERIOD = 34          # Bollinger Bands period
RSI_PERIOD = 14           # RSI period
```

### Adaptation for JR
- Swap Bitget API for Tradovate API (MGC/MNQ futures)
- Or keep Bitget for crypto side-trades alongside futures
- Wire TradingAgents decision output → bot execution
- Replace BB+RSI strategy with JR's supply/demand + FVG logic

---

## Layer 5: JR'S RULES (to be taught)

The custom edge that makes this JAURX, not generic. JR needs to teach:

- [ ] FVG (Fair Value Gap) identification rules — timeframe, filters, ranking
- [ ] Supply/demand zone criteria — what makes a zone valid
- [ ] Entry triggers — candle close, wick rejection, confirmation type
- [ ] Scaling rules — TP1/TP2/TP3 split percentages, SL-to-BE rules
- [ ] Session timing — which sessions, which hours
- [ ] Kill switches — when to sit out entirely
- [ ] MNQ-specific playbook — Nasdaq has different behavior than Gold
- [ ] Daily bias framework — pre-market checklist in order

These get encoded into:
1. `rules.json` (for Jackson morning briefs)
2. TradingAgents custom prompts (for multi-agent decisions)
3. Pine Script indicators (for on-chart automation)

---

## Combined JAURX Architecture

```
                    ┌─────────────────────────────┐
                    │     JR's Rules (Layer 5)     │
                    │  FVG · S/D zones · Timing    │
                    └──────────────┬──────────────┘
                                   │
       ┌───────────────┬───────────┼───────────┬───────────────┐
       │               │           │           │               │
       ▼               ▼           ▼           ▼               │
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│   Data     │ │   Chart    │ │  Decision  │ │ Execution  │   │
│  Engine    │ │  Control   │ │   Brain    │ │  Engine    │   │
│ (Python)   │ │ (Node.js)  │ │ (Python)   │ │ (Python)   │   │
│            │ │            │ │            │ │            │   │
│ Screeners  │ │ TV Desktop │ │ Analysts   │ │ Orders     │   │
│ Backtest   │ │ Pine Script│ │ Bull/Bear  │ │ TP/SL/TPP  │   │
│ Sentiment  │ │ Morning    │ │ Risk Mgmt  │ │ Telegram   │   │
│ News       │ │ Replay     │ │ Memory     │ │ Dashboard  │   │
│ Options    │ │ Drawings   │ │ Portfolio  │ │ Bitget API │   │
│ Multi-TF   │ │ Screenshots│ │ BUY/SELL   │ │ Demo mode  │   │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘   │
      │               │             │               │           │
      └───────────────┴──────┬──────┴───────────────┘           │
                             │                                  │
              ┌──────────────▼──────────────┐                   │
              │    JAURX Unified Pipeline   │                   │
              │                             │                   │
              │  1. Morning scan + bias     │                   │
              │  2. Multi-agent debate      │◄──────────────────┘
              │  3. Trade decision          │
              │  4. Auto-execute or alert   │
              │  5. → JAURX VIP Telegram    │
              └─────────────────────────────┘
```

---

## What Runs Where

| Component | Runs On | Why |
|---|---|---|
| Data Engine (screeners, backtest) | Cloud (Claude Code web) or Mac | No API keys, works anywhere |
| Chart Controller (Jackson MCP) | Mac only | Needs TradingView Desktop + CDP |
| Decision Brain (TradingAgents) | Mac (preferred) or Cloud | Needs Anthropic API key |
| Execution Engine (Bitget bot) | Mac or VPS | Needs exchange API keys + always-on |
| JR's Rules | Everywhere | JSON config files |
| JAURX VIP alerts | Mac → Telegram Bot API | Egress-blocked from cloud |

---

## Next Steps

1. **JR teaches his rules** — FVG, S/D zones, entries, scaling, timing
2. **Build `rules.json`** for MGC + MNQ with JR's actual methodology
3. **Wire TradingAgents config** for Anthropic/Claude as the LLM provider
4. **Create unified morning workflow**: Data Engine pulls macro → Decision Brain debates → Chart Controller draws levels → output goes to Telegram
5. **Backtest JR's methodology** using the 9-strategy engine on GC=F and NQ=F historical data
6. **Pine Script JR's indicators** for on-chart execution via Jackson MCP
