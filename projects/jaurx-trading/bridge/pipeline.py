"""
JAURX Trading Pipeline — the main bridge.

Orchestrates all layers into a unified daily workflow:
  1. Regime check (kill switches)
  2. Macro scan (data engine)
  3. Morning bias generation
  4. Trade setup identification
  5. Position sizing
  6. Council review (optional)
  7. Alert formatting
  8. Execution (Tradovate) or manual alert (Telegram)
  9. Journal entry

Run:
    python -m bridge.pipeline morning   # Morning brief only
    python -m bridge.pipeline scan      # Full scan + setups
    python -m bridge.pipeline size MGC 4580 4610 4500,4466,4423  # Quick size
    python -m bridge.pipeline macro     # Macro data pull only
"""

import json
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(name)s | %(message)s")
log = logging.getLogger("jaurx")

BRIDGE_DIR = Path(__file__).parent
CONFIG_DIR = BRIDGE_DIR.parent / "config"


def load_config() -> dict:
    with open(CONFIG_DIR / "jaurx-config.json") as f:
        return json.load(f)

def load_rules() -> dict:
    with open(CONFIG_DIR / "rules.json") as f:
        return json.load(f)


def cmd_macro():
    """Pull and display macro data."""
    from bridge.data_engine import morning_macro_brief
    config = load_config()
    print(morning_macro_brief(config))


def cmd_morning():
    """Full morning brief: macro + bias + key levels."""
    from bridge.data_engine import morning_macro_brief, pull_macro
    from bridge.alert_formatter import format_bias_alert
    config = load_config()
    rules = load_rules()

    print("Pulling macro data...")
    macro = pull_macro(config)
    print(morning_macro_brief(config))
    print()

    gold = macro.get("GC=F", {})
    nq = macro.get("NQ=F", {})
    vix = macro.get("^VIX", {})
    dxy = macro.get("DX-Y.NYB", {})

    bias = determine_bias(gold, nq, vix, dxy, rules)
    print(f"\nDETERMINED BIAS: {bias}")
    print()

    alert = format_bias_alert(
        bias=bias,
        gold_price=gold.get("price", 0),
        gold_change=gold.get("change_pct", 0),
        nq_price=nq.get("price", 0),
        nq_change=nq.get("change_pct", 0),
        vix=vix.get("price", 0),
        dxy_change=dxy.get("change_pct", 0),
    )
    print("VIP ALERT (paste to Telegram):")
    print("-" * 40)
    print(alert)
    print("-" * 40)


def cmd_size(args: list):
    """Quick position sizing."""
    from bridge.position_sizer import size_trade, format_sizing

    if len(args) < 3:
        print("Usage: pipeline.py size <instrument> <entry> <stop> [tp1,tp2,tp3]")
        print("Example: pipeline.py size MGC 4580 4610 4500,4466,4423")
        return

    instrument = args[0].upper()
    entry = float(args[1])
    stop = float(args[2])
    tp_prices = None
    if len(args) > 3:
        tp_prices = [float(x) for x in args[3].split(",")]

    config = load_config()
    risk_pct = config.get("risk", {}).get("max_risk_per_trade_pct", 1.0)
    tp_split = config.get("risk", {}).get("tp_split", [0.50, 0.30, 0.20])
    account = 25000  # placeholder — will come from Tradovate account balance

    result = size_trade(
        instrument=instrument,
        account_equity=account,
        entry_price=entry,
        stop_price=stop,
        risk_pct=risk_pct,
        tp_prices=tp_prices,
        tp_split=tp_split,
    )
    print(format_sizing(result))


def cmd_alert(args: list):
    """Generate a VIP alert from a trade setup."""
    from bridge.position_sizer import size_trade
    from bridge.alert_formatter import format_vip_alert

    if len(args) < 4:
        print("Usage: pipeline.py alert <instrument> <direction> <entry> <stop> <tp1,tp2,tp3> [bias]")
        return

    instrument = args[0].upper()
    direction = args[1].upper()
    entry = float(args[2])
    stop = float(args[3])
    tp_prices = [float(x) for x in args[4].split(",")] if len(args) > 4 else []
    bias_summary = args[5] if len(args) > 5 else ""

    config = load_config()
    risk_pct = config.get("risk", {}).get("max_risk_per_trade_pct", 1.0)
    tp_split = config.get("risk", {}).get("tp_split", [0.50, 0.30, 0.20])

    sizing = size_trade(
        instrument=instrument,
        account_equity=25000,
        entry_price=entry,
        stop_price=stop,
        risk_pct=risk_pct,
        tp_prices=tp_prices,
        tp_split=tp_split,
    )

    targets = []
    for t in sizing.get("targets", []):
        targets.append({"level": t["level"], "price": t["price"], "rr": t["rr_ratio"]})

    alert = format_vip_alert(
        instrument=instrument,
        direction=direction,
        entry=entry,
        stop=stop,
        targets=targets,
        contracts=sizing.get("contracts", 0),
        risk_usd=sizing.get("actual_risk_usd", 0),
        risk_pct=sizing.get("actual_risk_pct", 0),
        bias_summary=bias_summary,
    )
    print(alert)


def cmd_backtest(args: list):
    """Backtest strategies on JR's instruments."""
    from bridge.data_engine import compare_all_strategies

    symbol = args[0] if args else "GC=F"
    period = args[1] if len(args) > 1 else "1y"

    print(f"Comparing all 9 strategies on {symbol} ({period})...")
    results = compare_all_strategies(symbol, period)
    print(json.dumps(results, indent=2, default=str))


def cmd_scan():
    """Full scan: macro + multi-TF + identify setups."""
    from bridge.data_engine import pull_macro, multi_timeframe, morning_macro_brief

    config = load_config()

    print("=" * 60)
    print(morning_macro_brief(config))
    print("=" * 60)

    instruments = config.get("instruments", {})
    for key, inst in instruments.items():
        if not inst.get("active"):
            continue

        tv_sym = inst.get("tradingview_symbol", "")
        exchange = inst.get("exchange", "")
        name = inst.get("name", key)

        if tv_sym and exchange:
            print(f"\n--- Multi-Timeframe: {name} ---")
            try:
                mtf = multi_timeframe(tv_sym.split(":")[1] if ":" in tv_sym else tv_sym, exchange)
                print(json.dumps(mtf, indent=2, default=str)[:2000])
            except Exception as e:
                print(f"  Error: {e}")


def determine_bias(gold: dict, nq: dict, vix: dict, dxy: dict, rules: dict) -> str:
    """
    Apply rules.json bias criteria to macro data.

    Returns "BULLISH", "BEARISH", or "NEUTRAL".
    """
    kill_switches = rules.get("kill_switches", [])
    vix_price = vix.get("price", 0)

    for ks in kill_switches:
        if "VIX above 35" in ks and vix_price > 35:
            return "NEUTRAL"

    neutral_criteria = rules.get("bias_criteria", {}).get("neutral", [])
    for criterion in neutral_criteria:
        if "VIX above 30" in criterion and vix_price > 30:
            return "NEUTRAL"

    bullish_score = 0
    bearish_score = 0

    dxy_change = dxy.get("change_pct", 0)
    if dxy_change < -0.2:
        bullish_score += 1
    elif dxy_change > 0.2:
        bearish_score += 1

    gold_change = gold.get("change_pct", 0)
    if gold_change > 0.3:
        bullish_score += 1
    elif gold_change < -0.3:
        bearish_score += 1

    if vix_price < 18:
        bullish_score += 1
    elif vix_price > 25:
        bearish_score += 1

    if bullish_score > bearish_score:
        return "BULLISH"
    elif bearish_score > bullish_score:
        return "BEARISH"
    return "NEUTRAL"


def cmd_ml(args: list):
    """Run ML signal engine on an instrument."""
    from bridge.ml_signals import run_pipeline, format_signal

    symbol = args[0] if args else "GC=F"
    period = args[1] if len(args) > 1 else "2y"

    print(f"Running ML pipeline on {symbol} ({period})...")
    result = run_pipeline(symbol, period=period)
    print(format_signal(result))


def cmd_brain(args: list):
    """Run multi-agent decision brain on an instrument."""
    from bridge.decision_brain import analyze_instrument, format_decision

    symbol = args[0] if args else "GC=F"
    print(f"Running decision brain on {symbol}...")
    print("(Requires ANTHROPIC_API_KEY environment variable)")

    try:
        result = analyze_instrument(symbol, debug=True)
        print(format_decision(result))
    except RuntimeError as e:
        print(f"Error: {e}")


def cmd_full(args: list):
    """Full JAURX pipeline: macro → ML → bias → sizing → alert."""
    from bridge.data_engine import pull_macro, morning_macro_brief
    from bridge.ml_signals import run_pipeline, format_signal
    from bridge.position_sizer import size_trade, format_sizing
    from bridge.alert_formatter import format_vip_alert

    config = load_config()
    rules = load_rules()

    print("=" * 60)
    print("STEP 1: MACRO SCAN")
    print("=" * 60)
    macro = pull_macro(config)
    print(morning_macro_brief(config))

    gold = macro.get("GC=F", {})
    nq = macro.get("NQ=F", {})
    vix = macro.get("^VIX", {})
    dxy = macro.get("DX-Y.NYB", {})
    bias = determine_bias(gold, nq, vix, dxy, rules)
    print(f"\nBIAS: {bias}")

    print()
    print("=" * 60)
    print("STEP 2: ML SIGNALS")
    print("=" * 60)
    for sym in ["GC=F", "NQ=F"]:
        try:
            result = run_pipeline(sym, period="1y")
            print(format_signal(result))
            print()
        except Exception as e:
            print(f"ML error on {sym}: {e}")

    print("=" * 60)
    print("STEP 3: READY FOR TRADE SETUP")
    print("=" * 60)
    print("Use 'size' or 'alert' commands with specific levels once you identify a setup.")
    print(f"Current gold: ${gold.get('price', '?')}  |  NQ: ${nq.get('price', '?')}")
    print(f"Bias: {bias}  |  VIX: {vix.get('price', '?')}")


def main():
    if len(sys.argv) < 2:
        print("JAURX Trading Pipeline")
        print()
        print("Commands:")
        print("  macro              Pull macro data (Gold, NQ, VIX, DXY, yields)")
        print("  morning            Full morning brief with bias determination")
        print("  scan               Full scan: macro + multi-TF analysis")
        print("  size <args>        Position sizing (e.g., size MGC 4580 4610 4500,4466,4423)")
        print("  alert <args>       Generate VIP alert (e.g., alert MGC SHORT 4580 4610 4500,4466,4423)")
        print("  backtest [sym]     Compare all 9 strategies (default: GC=F)")
        print("  ml [sym]           Run ML signal engine (default: GC=F)")
        print("  brain [sym]        Run multi-agent decision brain (needs API key)")
        print("  full               Full pipeline: macro → ML → bias → ready")
        return

    cmd = sys.argv[1]
    args = sys.argv[2:]

    commands = {
        "macro": lambda: cmd_macro(),
        "morning": lambda: cmd_morning(),
        "scan": lambda: cmd_scan(),
        "size": lambda: cmd_size(args),
        "alert": lambda: cmd_alert(args),
        "backtest": lambda: cmd_backtest(args),
        "ml": lambda: cmd_ml(args),
        "brain": lambda: cmd_brain(args),
        "full": lambda: cmd_full(args),
    }

    handler = commands.get(cmd)
    if handler:
        handler()
    else:
        print(f"Unknown command: {cmd}")
        main()


if __name__ == "__main__":
    main()
