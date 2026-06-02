"""
JAURX Decision Brain — Layer 3 bridge.

Wraps TradingAgents for multi-agent trade analysis on MGC/MNQ.
Runs analyst team → bull/bear debate → risk management → trade decision.

Requires ANTHROPIC_API_KEY environment variable.
"""

import os
import json
import logging
from datetime import datetime, timezone

log = logging.getLogger("jaurx.brain")

try:
    from tradingagents.graph.trading_graph import TradingAgentsGraph
    from tradingagents.default_config import DEFAULT_CONFIG
    AVAILABLE = True
except ImportError as e:
    AVAILABLE = False
    log.warning(f"TradingAgents not available: {e}")


def check_available():
    if not AVAILABLE:
        raise RuntimeError(
            "TradingAgents not installed. Run: pip install /tmp/TradingAgents"
        )


def check_api_key():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise RuntimeError(
            "ANTHROPIC_API_KEY not set. Export it before running the decision brain:\n"
            "  export ANTHROPIC_API_KEY='sk-ant-...'"
        )


def build_config(jaurx_config: dict) -> dict:
    """Build TradingAgents config from JAURX config."""
    brain = jaurx_config.get("decision_brain", {})
    config = DEFAULT_CONFIG.copy()

    config["llm_provider"] = brain.get("llm_provider", "anthropic")
    config["deep_think_llm"] = brain.get("deep_think_llm", "claude-sonnet-4-6")
    config["quick_think_llm"] = brain.get("quick_think_llm", "claude-haiku-4-5-20251001")
    config["max_debate_rounds"] = brain.get("max_debate_rounds", 1)
    config["max_risk_discuss_rounds"] = brain.get("max_risk_discuss_rounds", 1)
    config["analyst_concurrency_limit"] = 2
    config["data_vendors"] = {
        "core_stock_apis": "yfinance",
        "technical_indicators": "yfinance",
        "fundamental_data": "yfinance",
        "news_data": "yfinance",
    }

    return config


def analyze_instrument(
    yahoo_symbol: str,
    date: str = None,
    jaurx_config: dict = None,
    debug: bool = False,
) -> dict:
    """
    Run full multi-agent analysis on an instrument.

    Args:
        yahoo_symbol: Yahoo Finance symbol (e.g., "GC=F" for gold, "NQ=F" for nasdaq)
        date: Analysis date in YYYY-MM-DD format (default: today)
        jaurx_config: JAURX config dict
        debug: Print agent deliberation

    Returns:
        {
            "symbol": str,
            "date": str,
            "decision": "BUY" | "SELL" | "HOLD",
            "confidence": float,
            "reasoning": str,
            "analyst_reports": dict,
            "debate_summary": str,
            "risk_assessment": str,
        }
    """
    check_available()
    check_api_key()

    if jaurx_config is None:
        from bridge.tradovate_client import load_config
        jaurx_config = load_config()

    if date is None:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    config = build_config(jaurx_config)
    graph = TradingAgentsGraph(debug=debug, config=config)

    log.info(f"Running multi-agent analysis: {yahoo_symbol} @ {date}")
    log.info(f"LLM: {config['llm_provider']} / {config['deep_think_llm']}")

    state, decision = graph.propagate(yahoo_symbol, date)

    return {
        "symbol": yahoo_symbol,
        "date": date,
        "decision": decision,
        "state": _extract_state_summary(state),
        "config": {
            "provider": config["llm_provider"],
            "model": config["deep_think_llm"],
            "debate_rounds": config["max_debate_rounds"],
        },
    }


def _extract_state_summary(state: dict) -> dict:
    """Extract readable summary from TradingAgents state."""
    summary = {}
    for key in ["market_report", "sentiment_report", "news_report",
                 "fundamentals_report", "bull_report", "bear_report",
                 "trader_decision", "risk_report"]:
        if key in state:
            val = state[key]
            if isinstance(val, str) and len(val) > 500:
                summary[key] = val[:500] + "..."
            else:
                summary[key] = val
    return summary


def quick_sentiment(yahoo_symbol: str, jaurx_config: dict = None) -> str:
    """
    Run a quick sentiment-only check (no full debate).
    Cheaper and faster — good for pre-screening.
    """
    check_available()
    check_api_key()

    if jaurx_config is None:
        from bridge.tradovate_client import load_config
        jaurx_config = load_config()

    config = build_config(jaurx_config)
    config["max_debate_rounds"] = 0
    config["max_risk_discuss_rounds"] = 0

    graph = TradingAgentsGraph(debug=False, config=config)
    _, decision = graph.propagate(yahoo_symbol, datetime.now(timezone.utc).strftime("%Y-%m-%d"))

    return decision


def format_decision(result: dict) -> str:
    """Format a decision result for display or Telegram."""
    lines = []
    lines.append(f"JAURX DECISION BRAIN — {result['symbol']} @ {result['date']}")
    lines.append(f"Provider: {result['config']['provider']} / {result['config']['model']}")
    lines.append(f"Debate rounds: {result['config']['debate_rounds']}")
    lines.append("")

    decision = result.get("decision", "UNKNOWN")
    lines.append(f"DECISION: {decision}")
    lines.append("")

    state = result.get("state", {})
    for key, val in state.items():
        label = key.replace("_", " ").title()
        lines.append(f"--- {label} ---")
        lines.append(str(val)[:300])
        lines.append("")

    return "\n".join(lines)
