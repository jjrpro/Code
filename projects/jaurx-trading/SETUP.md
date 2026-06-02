# JAURX Super Trader — Setup Guide

Step-by-step setup for JR's Mac. Each section is independent —
do them in order but you can stop after any step and pick up later.

---

## Step 1: Clone the repo (if not already done)

```bash
git clone -b claude/epic-maxwell-KhURK https://github.com/jjrpro/code ~/jjr-ops
cd ~/jjr-ops/projects/jaurx-trading
```

---

## Step 2: Install Python dependencies

```bash
pip install tradingview_ta yfinance pandas aiohttp websockets
```

---

## Step 3: Test the bridge (no API keys needed)

```bash
cd ~/jjr-ops/projects/jaurx-trading

# Pull live macro data
python3 -m bridge.pipeline macro

# Full morning brief with bias
python3 -m bridge.pipeline morning

# Size a trade
python3 -m bridge.pipeline size MGC 4580 4610 4500,4466,4423

# Generate a VIP alert
python3 -m bridge.pipeline alert MGC SHORT 4580 4610 4500,4466,4423 "Gold at supply zone"
```

---

## Step 4: Set up TradingView Desktop (chart control)

### 4a. Install tradingview-mcp-jackson

```bash
cd ~
git clone https://github.com/LewisWJackson/tradingview-mcp-jackson.git
cd tradingview-mcp-jackson
npm install
```

### 4b. Launch TradingView with debug port

```bash
bash scripts/launch_tv_debug_mac.sh
```

### 4c. Copy JAURX rules to Jackson

```bash
cp ~/jjr-ops/projects/jaurx-trading/config/rules.json ~/tradingview-mcp-jackson/rules.json
```

### 4d. Test chart bridge

```bash
export JACKSON_MCP_PATH=~/tradingview-mcp-jackson
node ~/jjr-ops/projects/jaurx-trading/bridge/tv_bridge.js state
```

---

## Step 5: Connect Tradovate (when ready to trade)

### 5a. Get Tradovate API credentials

1. Log into Tradovate → Settings → API Access
2. Create an API application (get appId, cid, sec)
3. Note your username and password

### 5b. Add credentials to config

Edit `config/jaurx-config.json` and fill in:

```json
"credentials": {
  "username": "YOUR_TRADOVATE_USERNAME",
  "password": "YOUR_TRADOVATE_PASSWORD",
  "appId": "YOUR_APP_ID",
  "appVersion": "1.0.0",
  "cid": "YOUR_CID",
  "sec": "YOUR_SEC"
}
```

### 5c. Test on DEMO first

Make sure `"use_demo": true` is set in the config. Test with:

```python
python3 -c "
import asyncio
from bridge.tradovate_client import TradovateClient, load_config
async def test():
    client = TradovateClient(load_config())
    await client.connect()
    print('Connected!')
    accounts = await client.get_accounts()
    print(f'Accounts: {accounts}')
    await client.close()
asyncio.run(test())
"
```

### 5d. Switch to LIVE (only when confident)

Change `"use_demo": false` in config. Triple-check everything works
on demo first.

---

## Step 6: Add Claude Code MCP servers (optional, for Claude Desktop)

Add to `~/.claude/.mcp.json`:

```json
{
  "mcpServers": {
    "tradingview-data": {
      "command": "uvx",
      "args": ["--from", "tradingview-mcp-server", "tradingview-mcp"]
    },
    "tradingview-chart": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/tradingview-mcp-jackson/src/server.js"]
    }
  }
}
```

This gives Claude Desktop direct access to all 110+ trading tools.

---

## What works right now (no setup needed)

From any Claude Code session on this repo:

```bash
cd projects/jaurx-trading

# Live macro data (Gold, NQ, VIX, DXY, yields)
python3 -m bridge.pipeline macro

# Full morning brief with bias determination
python3 -m bridge.pipeline morning

# ML signal engine (trains LightGBM on 2y of 1h bars)
python3 -m bridge.pipeline ml GC=F
python3 -m bridge.pipeline ml NQ=F

# Full pipeline: macro → ML signals → bias → ready
python3 -m bridge.pipeline full

# Position sizing
python3 -m bridge.pipeline size MGC 4580 4610 4500,4466,4423

# Generate VIP Telegram alert
python3 -m bridge.pipeline alert MGC SHORT 4580 4610 4500,4466,4423 "Gold at supply zone"

# Compare all 9 backtest strategies
python3 -m bridge.pipeline backtest GC=F

# Multi-agent decision brain (needs ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY="sk-ant-..."
python3 -m bridge.pipeline brain GC=F
```

---

## What needs JR's Mac

- TradingView chart control (Jackson MCP)
- Tradovate order execution
- Telegram VIP alerts (bot API)
- ML model training (intelligent-trading-bot)
