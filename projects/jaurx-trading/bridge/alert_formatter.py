"""
JAURX Alert Formatter — formats trade setups for JAURX VIP Telegram.

Generates paste-ready alert messages from trade analysis,
position sizing, and council review outputs.
"""

from datetime import datetime, timezone


def format_vip_alert(
    instrument: str,
    direction: str,
    entry: float,
    stop: float,
    targets: list,
    contracts: int,
    risk_usd: float,
    risk_pct: float,
    bias_summary: str = "",
    confidence: str = "MEDIUM",
    council_verdict: str = None,
) -> str:
    """
    Format a JAURX VIP trade alert for Telegram.

    Args:
        instrument: "MGC" or "MNQ"
        direction: "LONG" or "SHORT"
        entry: Entry price
        stop: Stop loss price
        targets: List of {"level": "TP1", "price": float, "rr": float}
        contracts: Position size
        risk_usd: Dollar risk
        risk_pct: Risk as % of account
        bias_summary: One-line macro bias
        confidence: "HIGH", "MEDIUM", "LOW"
        council_verdict: Optional council review summary
    """
    emoji_dir = "🟢" if direction == "LONG" else "🔴"
    name = "Micro Gold" if instrument == "MGC" else "Micro Nasdaq" if instrument == "MNQ" else instrument
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines = []
    lines.append(f"{emoji_dir} JAURX ALERT — {name} ({instrument}) {direction}")
    lines.append(f"📅 {now}")
    lines.append("")
    lines.append(f"▶️ Entry: ${entry:,.2f}")
    lines.append(f"🛑 Stop:  ${stop:,.2f}")

    for t in targets:
        lines.append(f"🎯 {t['level']}: ${t['price']:,.2f}  ({t.get('rr', '?')}:1 R:R)")

    lines.append("")
    lines.append(f"📊 Size: {contracts} contract{'s' if contracts != 1 else ''}")
    lines.append(f"⚠️ Risk: ${risk_usd:,.0f} ({risk_pct:.1f}%)")
    lines.append(f"🔒 Confidence: {confidence}")

    if bias_summary:
        lines.append("")
        lines.append(f"📋 Bias: {bias_summary}")

    if council_verdict:
        lines.append("")
        lines.append(f"🏛️ Council: {council_verdict}")

    lines.append("")
    lines.append("Manage: TP1 hit → SL to BE. Let runners ride.")
    lines.append("")
    lines.append("Educational only. NFA.")
    lines.append("— JAURX")

    return "\n".join(lines)


def format_bias_alert(
    bias: str,
    gold_price: float,
    gold_change: float,
    nq_price: float,
    nq_change: float,
    vix: float,
    dxy_change: float,
    key_levels: dict = None,
) -> str:
    """
    Format the daily morning bias post for JAURX VIP.

    Posted before NY open.
    """
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    emoji_bias = "🟢" if bias == "BULLISH" else "🔴" if bias == "BEARISH" else "⚪"

    lines = []
    lines.append(f"📊 JAURX DAILY BIAS — {now}")
    lines.append(f"{emoji_bias} Overall: {bias}")
    lines.append("")
    lines.append(f"🥇 Gold: ${gold_price:,.2f} ({gold_change:+.2f}%)")
    lines.append(f"💻 NQ:   ${nq_price:,.0f} ({nq_change:+.2f}%)")
    lines.append(f"📉 VIX:  {vix:.1f}")
    lines.append(f"💵 DXY:  {dxy_change:+.2f}%")

    if key_levels:
        lines.append("")
        lines.append("📌 Key Levels:")
        for instrument, levels in key_levels.items():
            for level in levels:
                lines.append(f"  {instrument} {level['type']}: ${level['price']:,.2f}")

    lines.append("")
    lines.append("NFA. Watch for confirmation before entering.")
    lines.append("— JAURX")

    return "\n".join(lines)


def format_close_alert(
    instrument: str,
    direction: str,
    entry: float,
    exit_price: float,
    pnl: float,
    pnl_r: float,
    reason: str = "target hit",
) -> str:
    """Format a trade close notification."""
    emoji = "✅" if pnl >= 0 else "❌"
    name = "Micro Gold" if instrument == "MGC" else "Micro Nasdaq" if instrument == "MNQ" else instrument

    lines = []
    lines.append(f"{emoji} JAURX CLOSED — {name} {direction}")
    lines.append(f"Entry: ${entry:,.2f} → Exit: ${exit_price:,.2f}")
    lines.append(f"P&L: ${pnl:,.2f} ({pnl_r:+.1f}R)")
    lines.append(f"Reason: {reason}")
    lines.append("— JAURX")

    return "\n".join(lines)
