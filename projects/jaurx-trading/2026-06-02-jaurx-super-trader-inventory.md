# JAURX Super Trader — Combined Tooling Inventory

**Date**: 2026-06-02
**Purpose**: Master inventory of the five repos being merged into the JAURX AI trading system.

---

## The Five Source Repos

| Repo | Language | Role | Tools |
|---|---|---|---|
| `tradingview-mcp` (atilaahmettaner) | Python | **Data Layer** — screeners, backtesting, sentiment, news | 30+ |
| `tradingview-mcp-jackson` (LewisWJackson) | Node.js | **Chart Layer** — TradingView Desktop control, Pine Script, replay | 81 |
| `TradingAgents` (TauricResearch) | Python | **Decision Layer** — multi-agent firm simulation, risk mgmt, memory | Full pipeline |
| `bitget-trading-bot` (jerome78b) | Python | **Execution Layer** — live order execution, TP/SL/TPP, Telegram alerts | Single bot |
| `intelligent-trading-bot` (asavinov) | Python | **ML Signal Layer** — trained ML models, feature engineering, MT5 execution | Full pipeline |
| `claude-trading-skills` (tradermonty) | Python | **Skills Layer** — 56 Claude skills, workflows, journaling, regime detection | 56 skills |
| `council-review` (ngmeyer) | Markdown | **Council Layer** — 5-advisor AI deliberation for high-stakes trade decisions | 6 modes |

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

## Layer 5: ML SIGNAL ENGINE (intelligent-trading-bot)

Machine learning pipeline that trains models on historical data, generates predictive signals (-1 to +1), and executes trades via MetaTrader 5 or Binance. Offline training + online real-time prediction.

### ML Models (4 classifiers)
- **Neural Network** — TensorFlow/Keras, configurable layers/dropout
- **Gradient Boosting** — LightGBM, fast + accurate on tabular data
- **SVC** — Support Vector Classifier (scikit-learn)
- **Linear Classifier** — lightweight baseline

### Feature Engineering Pipeline
- **talib** — TA-Lib: SMA, EMA, RSI, MACD, Bollinger, LINEARREG_SLOPE, STDDEV
- **itbstats** — statistical: skew, kurtosis, slope over rolling windows
- **tsfresh** — automated time-series feature extraction
- Custom Python functions supported
- Configurable rolling windows (e.g., 1, 3, 6, 12, 24, 168, 672 bars)

### Label Generation
- **highlow2** — predicts if price will hit a high/low threshold within N bars
- Configurable thresholds (e.g., 3% move) and tolerance
- Generates supervised learning targets from future price action

### Signal Generation
- Score from -1 (strong sell) to +1 (strong buy)
- Combines high-probability and low-probability scores
- Configurable buy/sell thresholds with band system:
  - `> 0.08` = BUY ZONE
  - `> 0.04` = strong
  - `> 0.02` = weak
  - `< -0.08` = SELL ZONE

### Walk-Forward Backtesting
- Rolling train/predict splits with configurable steps
- Grid search for optimal signal thresholds
- Multiprocessing support for speed
- Stores top N parameter combinations

### Data Sources
- **Binance** — crypto OHLCV (primary)
- **Yahoo Finance** — stocks, futures, ETFs
- **MetaTrader 5** — futures, forex, stocks via broker

### Trade Execution
- **MetaTrader 5** — direct order placement via MT5 Python API
  - Account login, order management, position tracking
  - Relevant for futures (MGC/MNQ if JR's broker supports MT5)
- **Binance** — crypto spot/futures
- **Telegram** — signal notifications with score diagrams

### Pipeline (8 steps)
```
download → merge → features → labels → train → predict → signals → output
```

### Configuration (JSON)
```json
{
  "symbol": "BTCUSDT",
  "freq": "1h",
  "feature_sets": [talib SMA/SLOPE/STDDEV across windows],
  "algorithms": [{"algo": "svc", "params": {"length": 26280}}],
  "signal_sets": [combine scores → threshold rules],
  "output_sets": [telegram notifications + trade simulation]
}
```

### Adaptation for JR
- Train on GC=F (gold) and NQ=F (Nasdaq) historical data via Yahoo Finance
- Add JR's custom features: FVG detection, supply/demand zone proximity, session time
- Use MT5 execution if JR's futures broker supports it (many do)
- Feed ML scores into TradingAgents as an additional analyst input
- Walk-forward validate JR's methodology quantitatively

---

## Layer 6: CLAUDE TRADING SKILLS (claude-trading-skills)

56 purpose-built Claude skills with structured YAML workflows. The discipline layer — journaling, regime detection, position sizing, trade review. Designed for Claude Code and Claude web.

### Market Regime Skills (11)
- `market-breadth-analyzer` — breadth analysis from public CSV data
- `uptrend-analyzer` — uptrend participation scoring
- `ibd-distribution-day-monitor` — IBD-style distribution day tracking
- `ftd-detector` — follow-through day detection
- `market-top-detector` — market topping pattern recognition
- `macro-regime-detector` — macro regime transitions
- `sector-analyst` — sector rotation analysis
- `exposure-coach` — daily exposure posture (allow/restrict/cash-priority)
- `us-market-bubble-detector` — bubble risk scoring
- `downtrend-duration-analyzer` — how long downtrends typically last
- `market-news-analyst` — news impact assessment

### Core Portfolio Skills (6)
- `portfolio-manager` — portfolio analysis via Alpaca API
- `value-dividend-screener` — value + dividend screening
- `dividend-growth-pullback-screener` — dividend growth on pullback
- `kanchi-dividend-review-monitor` — dividend monitoring rules
- `kanchi-dividend-sop` — dividend SOP framework
- `kanchi-dividend-us-tax-accounting` — tax accounting for dividends

### Swing Opportunity Skills (5)
- `vcp-screener` — Volatility Contraction Pattern screener (Minervini)
- `canslim-screener` — O'Neil CANSLIM screening
- `breakout-trade-planner` — breakout trade setup planning
- `theme-detector` — emerging market theme detection
- `finviz-screener` — FinViz integration for screening

### Trade Planning Skills (3)
- `position-sizer` — risk-based sizing (Fixed Fractional, ATR, Kelly)
- `technical-analyst` — technical analysis framework
- `us-stock-analysis` — comprehensive stock analysis

### Trade Memory Skills (3)
- `trader-memory-core` — trade journaling in YAML
- `signal-postmortem` — post-trade review framework
- `trade-hypothesis-ideator` — hypothesis-driven trade ideas

### Strategy Research Skills (9)
- `backtest-expert` — backtesting framework
- `edge-pipeline-orchestrator` — full edge research pipeline
- `edge-candidate-agent` / `edge-concept-synthesizer` / `edge-strategy-designer` / `edge-strategy-reviewer` — edge discovery chain
- `scenario-analyzer` — what-if scenario analysis
- `stanley-druckenmiller-investment` — Druckenmiller-style synthesis
- `strategy-pivot-designer` — strategy adaptation

### Advanced Skills (6)
- `earnings-trade-analyzer` — earnings play analysis
- `institutional-flow-tracker` — smart money flow tracking
- `options-strategy-advisor` — options strategy selection
- `pair-trade-screener` — pairs trading opportunities
- `parabolic-short-trade-planner` — parabolic short setups
- `pead-screener` — post-earnings announcement drift

### Structured Workflows (5 daily/weekly/monthly)
```yaml
market-regime-daily:     breadth → uptrend → top risk → exposure decision (15 min)
core-portfolio-weekly:   portfolio review → dividend monitor → rebalance
swing-opportunity-daily: VCP screen → breakout plan → position size
trade-memory-loop:       journal → postmortem → hypothesis → coaching
monthly-performance:     full month review → strategy adjustment
```

### Adaptation for JR
- Replace stock-focused screeners with futures equivalents (MGC/MNQ)
- Use `position-sizer` directly — already supports 1% risk, ATR stops
- `trader-memory-core` → JAURX trade journal (syncs to Obsidian vault)
- `market-regime-daily` workflow → JR's morning bias framework
- `exposure-coach` → daily "am I trading today?" gate
- Build custom JAURX skills: `fvg-scanner`, `supply-demand-zone-validator`, `session-timing-gate`

---

## Layer 7: COUNCIL REVIEW (council-review)

5-advisor AI deliberation system for vetting high-stakes decisions. Routes trade setups, plans, and strategies through structured multi-agent debate before execution.

### The Five Advisors
| Advisor | Method | Trading Application |
|---|---|---|
| **Contrarian** | Inversion logic | "What kills this trade?" — finds failure points |
| **First Principles** | Decomposition | Breaks thesis into testable claims |
| **Expansionist** | Analogy-drawing | "What similar setup worked/failed before?" |
| **Outsider** | Naive questioning | Challenges assumptions JR takes for granted |
| **Executor** | Dependency graphing | "What has to happen first for this to work?" |

### Operating Modes
- **Full** (11 calls) — high-stakes trade decisions
- **Quick** (4 calls) — routine daily setups
- **Adaptive** — convergence-aware, stops when advisors agree
- **Confidence** — self-rated confidence weighting
- **Jury** — 3 independent judges synthesize verdicts

### Output Format
- Where the council agrees (high-confidence signals)
- Where the council clashes (value tensions vs error catches)
- Blind spots revealed
- Clear recommendation (not "it depends")
- What you lose if you follow the recommendation
- One concrete next step

### Adaptation for JR
- Route every JAURX VIP trade alert through Quick Council before posting
- Use Full Council for position sizing decisions above 2% risk
- Feed council output into trade journal for postmortem comparison
- "Should I take this gold short at $4,580?" → 5 advisors debate it

---

## Layer 8: JR'S RULES (to be taught)

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

## Combined JAURX Architecture (6 repos + JR's rules)

```
                    ┌─────────────────────────────────┐
                    │      JR's Rules (Layer 7)        │
                    │   FVG · S/D zones · Timing       │
                    │   The custom edge that makes     │
                    │   this JAURX, not generic         │
                    └───────────────┬─────────────────┘
                                    │ configures all layers
      ┌──────────┬──────────┬───────┼───────┬──────────┬──────────┐
      │          │          │       │       │          │          │
      ▼          ▼          ▼       │       ▼          ▼          │
 ┌─────────┐┌─────────┐┌─────────┐ │ ┌─────────┐┌─────────┐┌─────────┐
 │  DATA   ││ CHART   ││DECISION │ │ │EXECUTION││   ML    ││ SKILLS  │
 │ ENGINE  ││CONTROL  ││  BRAIN  │ │ │ ENGINE  ││ SIGNALS ││  (56)   │
 │ Lyr 1   ││ Lyr 2   ││ Lyr 3   │ │ │ Lyr 4   ││ Lyr 5   ││ Lyr 6   │
 │         ││         ││         │ │ │         ││         ││         │
 │Screeners││TV Dsktp ││Analysts │ │ │Orders   ││NeuralNet││Regime   │
 │Backtest ││Pine Sct ││Bull/Bear│ │ │TP/SL    ││LightGBM ││Pos Size │
 │Sentiment││Morning  ││Risk Mgt │ │ │Telegram ││SVC      ││Journal  │
 │News     ││Replay   ││Memory   │ │ │Dashboard││Features ││Exposure │
 │Options  ││Drawings ││Portfolio│ │ │Bitget   ││Walk-Fwd ││Workflow │
 │Multi-TF ││Screensht││BUY/SELL │ │ │MT5      ││MT5 Exec ││Postmrtm│
 └────┬────┘└────┬────┘└────┬────┘ │ └────┬────┘└────┬────┘└────┬────┘
      │          │          │      │      │          │          │
      └──────────┴──────┬───┴──────┘──────┴──────────┴──────────┘
                        │
         ┌──────────────▼──────────────────┐
         │     JAURX Daily Pipeline         │
         │                                  │
         │  1. Regime check (skills L6)     │
         │  2. ML models score (L5)         │
         │  3. Morning scan + bias (L1+L2)  │
         │  4. Multi-agent debate (L3)      │
         │  5. Chart verification (L2)      │
         │  6. Position sizing (L6)         │
         │  7. Execute or alert (L4)        │
         │  8. Journal + memory (L6+L3)     │
         │  9. → JAURX VIP Telegram         │
         └─────────────────────────────────┘
```

---

## What Runs Where

| Component | Runs On | Why |
|---|---|---|
| Data Engine (screeners, backtest) | Cloud (Claude Code web) or Mac | No API keys, works anywhere |
| Chart Controller (Jackson MCP) | Mac only | Needs TradingView Desktop + CDP |
| Decision Brain (TradingAgents) | Mac (preferred) or Cloud | Needs Anthropic API key |
| Execution Engine (Bitget bot) | Mac or VPS | Needs exchange API keys + always-on |
| ML Signal Engine (intelligent-trading-bot) | Mac or VPS | Needs training data + compute for ML |
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
