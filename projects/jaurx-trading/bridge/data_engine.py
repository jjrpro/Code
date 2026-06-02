"""
JAURX Data Engine — Layer 1 bridge.

Wraps tradingview-mcp functions for JR's instruments.
Pulls macro data, runs screeners, multi-TF analysis, sentiment, and news.
"""

import sys
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

log = logging.getLogger("jaurx.data")

TV_MCP_PATH = "/tmp/tradingview-mcp/src"
if TV_MCP_PATH not in sys.path:
    sys.path.insert(0, TV_MCP_PATH)

try:
    from tradingview_mcp.core.services.yahoo_finance_service import get_price, get_market_snapshot
    from tradingview_mcp.core.services.screener_service import analyze_coin, run_multi_timeframe_analysis
    from tradingview_mcp.core.services.news_service import fetch_news_summary
    from tradingview_mcp.core.services.backtest_service import run_backtest, compare_strategies as _compare_strategies
    AVAILABLE = True
except ImportError as e:
    AVAILABLE = False
    log.warning(f"tradingview-mcp not available: {e}")


def check_available():
    if not AVAILABLE:
        raise RuntimeError(
            "Data engine unavailable. Install: pip install tradingview_ta yfinance pandas\n"
            "And clone: git clone https://github.com/atilaahmettaner/tradingview-mcp.git /tmp/tradingview-mcp"
        )


def pull_macro(config: dict) -> dict:
    """
    Pull full macro context for JR's morning bias.

    Returns gold, NQ, VIX, DXY, 10Y yield, S&P, and global snapshot.
    """
    check_available()
    symbols = config.get("data_engine", {}).get("yahoo_symbols", ["GC=F", "NQ=F", "^VIX"])
    results = {}

    for sym in symbols:
        try:
            results[sym] = get_price(sym)
        except Exception as e:
            results[sym] = {"error": str(e)}
            log.warning(f"Failed to pull {sym}: {e}")

    try:
        results["_snapshot"] = get_market_snapshot()
    except Exception as e:
        results["_snapshot"] = {"error": str(e)}

    return results


def pull_instrument(yahoo_symbol: str) -> dict:
    """Pull real-time price for a single instrument."""
    check_available()
    return get_price(yahoo_symbol)


def analyze_instrument(tv_symbol: str, exchange: str, timeframe: str = "1D") -> dict:
    """Run full technical analysis on an instrument."""
    check_available()
    return analyze_coin(tv_symbol, exchange, timeframe)


def multi_timeframe(tv_symbol: str, exchange: str) -> dict:
    """Multi-timeframe alignment: Weekly → Daily → 4H → 1H → 15m."""
    check_available()
    return run_multi_timeframe_analysis(tv_symbol, exchange)


def get_news(symbol: str = None, category: str = "all", limit: int = 10) -> dict:
    """Pull financial news headlines."""
    check_available()
    return fetch_news_summary(symbol, category, limit)


def backtest(yahoo_symbol: str, strategy: str, period: str = "1y", capital: float = 25000) -> dict:
    """Backtest a strategy on historical data."""
    check_available()
    return run_backtest(yahoo_symbol, strategy, period, capital)


def compare_all_strategies(yahoo_symbol: str, period: str = "1y", capital: float = 25000) -> dict:
    """Compare all 9 strategies on a symbol."""
    check_available()
    return _compare_strategies(yahoo_symbol, period, capital)


def morning_macro_brief(config: dict) -> str:
    """
    Generate a formatted morning macro brief for JR.

    Pulls all macro data and formats it as a readable brief.
    """
    macro = pull_macro(config)
    lines = []
    lines.append(f"JAURX MORNING MACRO BRIEF — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    lines.append("=" * 60)

    label_map = {
        "GC=F": "GOLD (MGC proxy)",
        "NQ=F": "NASDAQ (MNQ proxy)",
        "^VIX": "VIX",
        "DX-Y.NYB": "DXY (Dollar)",
        "^TNX": "10Y YIELD",
        "SPY": "S&P 500 ETF",
        "QQQ": "NASDAQ ETF",
    }

    for sym, label in label_map.items():
        data = macro.get(sym, {})
        if "error" in data:
            lines.append(f"  {label}: ERROR — {data['error']}")
        elif data:
            price = data.get("price", "?")
            change = data.get("change_pct", 0)
            arrow = "+" if change >= 0 else ""
            lines.append(f"  {label}: ${price}  ({arrow}{change}%)")

    lines.append("")
    lines.append("BIAS INPUTS:")

    gold = macro.get("GC=F", {})
    vix = macro.get("^VIX", {})
    dxy = macro.get("DX-Y.NYB", {})
    tnx = macro.get("^TNX", {})

    if vix.get("price"):
        vix_val = vix["price"]
        if vix_val > 30:
            lines.append(f"  VIX {vix_val} — ELEVATED. Defensive only.")
        elif vix_val > 25:
            lines.append(f"  VIX {vix_val} — Caution. Reduce size.")
        else:
            lines.append(f"  VIX {vix_val} — Normal. Full risk allowed.")

    if dxy.get("change_pct"):
        dxy_chg = dxy["change_pct"]
        if dxy_chg > 0.3:
            lines.append(f"  DXY rising ({dxy_chg:+.2f}%) — bearish gold bias")
        elif dxy_chg < -0.3:
            lines.append(f"  DXY falling ({dxy_chg:+.2f}%) — bullish gold bias")
        else:
            lines.append(f"  DXY flat ({dxy_chg:+.2f}%) — neutral")

    if tnx.get("change_pct"):
        tnx_chg = tnx["change_pct"]
        if tnx_chg > 1:
            lines.append(f"  10Y yield rising ({tnx_chg:+.2f}%) — headwind for gold")
        elif tnx_chg < -1:
            lines.append(f"  10Y yield falling ({tnx_chg:+.2f}%) — tailwind for gold")

    return "\n".join(lines)
