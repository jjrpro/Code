"""
JAURX Position Sizer — futures-specific sizing for MGC/MNQ.

Calculates position size based on:
- Account equity
- Risk percentage per trade (default 1%)
- Entry price and stop loss distance
- Contract point value (MGC = $10/point, MNQ = $2/point)
- Scaled exits across TP1/TP2/TP3
"""

import json
from pathlib import Path


CONTRACTS = {
    "MGC": {
        "name": "Micro Gold",
        "point_value": 10.00,
        "tick_size": 0.10,
        "tick_value": 1.00,
    },
    "MNQ": {
        "name": "Micro Nasdaq",
        "point_value": 2.00,
        "tick_size": 0.25,
        "tick_value": 0.50,
    },
    "MES": {
        "name": "Micro S&P 500",
        "point_value": 5.00,
        "tick_size": 0.25,
        "tick_value": 1.25,
    },
    "MCL": {
        "name": "Micro Crude Oil",
        "point_value": 100.00,
        "tick_size": 0.01,
        "tick_value": 1.00,
    },
}


def size_trade(
    instrument: str,
    account_equity: float,
    entry_price: float,
    stop_price: float,
    risk_pct: float = 1.0,
    tp_prices: list = None,
    tp_split: list = None,
) -> dict:
    """
    Calculate full position sizing for a futures trade.

    Args:
        instrument: "MGC" or "MNQ"
        account_equity: Total account value in USD
        entry_price: Planned entry price
        stop_price: Stop loss price
        risk_pct: Risk percentage of equity (default 1%)
        tp_prices: Optional list of take profit prices [tp1, tp2, tp3]
        tp_split: Optional split fractions [0.50, 0.30, 0.20]

    Returns:
        Full sizing breakdown with contracts, risk, and R:R per target.
    """
    spec = CONTRACTS.get(instrument.upper())
    if not spec:
        return {"error": f"Unknown instrument: {instrument}. Available: {list(CONTRACTS.keys())}"}

    point_value = spec["point_value"]
    risk_amount = account_equity * (risk_pct / 100)
    stop_distance = abs(entry_price - stop_price)
    risk_per_contract = stop_distance * point_value

    if risk_per_contract <= 0:
        return {"error": "Stop distance is zero — cannot size position"}

    contracts = int(risk_amount / risk_per_contract)
    actual_risk = contracts * risk_per_contract
    actual_risk_pct = (actual_risk / account_equity) * 100

    direction = "LONG" if entry_price < stop_price else "SHORT"
    if entry_price > stop_price:
        direction = "LONG"
    else:
        direction = "SHORT"

    result = {
        "instrument": instrument.upper(),
        "instrument_name": spec["name"],
        "direction": direction,
        "account_equity": account_equity,
        "entry_price": entry_price,
        "stop_price": stop_price,
        "stop_distance_points": round(stop_distance, 2),
        "risk_per_contract": round(risk_per_contract, 2),
        "target_risk_pct": risk_pct,
        "target_risk_usd": round(risk_amount, 2),
        "contracts": contracts,
        "actual_risk_usd": round(actual_risk, 2),
        "actual_risk_pct": round(actual_risk_pct, 2),
        "point_value": point_value,
    }

    if contracts == 0:
        result["warning"] = (
            f"Stop too wide for {risk_pct}% risk. "
            f"Need ${round(risk_per_contract, 2)} per contract but only ${round(risk_amount, 2)} budgeted. "
            f"Either tighten stop, increase account, or accept higher risk."
        )

    if tp_prices and contracts > 0:
        if tp_split is None:
            tp_split = [0.50, 0.30, 0.20]

        targets = []
        remaining = contracts

        for i, (tp, split) in enumerate(zip(tp_prices, tp_split)):
            if i == len(tp_prices) - 1:
                qty = remaining
            else:
                qty = max(1, int(contracts * split))
                remaining -= qty

            if qty <= 0:
                continue

            tp_distance = abs(tp - entry_price)
            reward_per_contract = tp_distance * point_value
            rr_ratio = tp_distance / stop_distance if stop_distance > 0 else 0

            targets.append({
                "level": f"TP{i+1}",
                "price": tp,
                "distance_points": round(tp_distance, 2),
                "contracts": qty,
                "reward_usd": round(qty * reward_per_contract, 2),
                "rr_ratio": round(rr_ratio, 1),
            })

        result["targets"] = targets
        result["total_reward_if_all_hit"] = round(sum(t["reward_usd"] for t in targets), 2)
        result["blended_rr"] = round(
            result["total_reward_if_all_hit"] / actual_risk if actual_risk > 0 else 0, 1
        )

    return result


def format_sizing(sizing: dict) -> str:
    """Format sizing result as a readable string for JR or VIP alerts."""
    if "error" in sizing:
        return f"SIZING ERROR: {sizing['error']}"

    lines = []
    lines.append(f"JAURX POSITION SIZING — {sizing['instrument_name']} ({sizing['instrument']})")
    lines.append(f"Direction: {sizing['direction']}")
    lines.append(f"Account: ${sizing['account_equity']:,.0f}")
    lines.append(f"Entry: ${sizing['entry_price']:,.2f}")
    lines.append(f"Stop:  ${sizing['stop_price']:,.2f}  ({sizing['stop_distance_points']} pts)")
    lines.append(f"Risk:  ${sizing['actual_risk_usd']:,.2f}  ({sizing['actual_risk_pct']:.1f}%)")
    lines.append(f"Size:  {sizing['contracts']} contracts")

    if "warning" in sizing:
        lines.append(f"WARNING: {sizing['warning']}")

    if "targets" in sizing:
        lines.append("")
        for t in sizing["targets"]:
            lines.append(
                f"  {t['level']}: ${t['price']:,.2f}  "
                f"({t['contracts']} ct, ${t['reward_usd']:,.0f} reward, {t['rr_ratio']}:1 R:R)"
            )
        lines.append(f"  Total reward: ${sizing['total_reward_if_all_hit']:,.0f}  (blended {sizing['blended_rr']}:1)")

    return "\n".join(lines)


if __name__ == "__main__":
    # MGC example: JR's gold short from the XAUUSD analysis
    gold = size_trade(
        instrument="MGC",
        account_equity=25000,
        entry_price=4580,
        stop_price=4610,
        tp_prices=[4500, 4466, 4423],
        tp_split=[0.50, 0.30, 0.20],
    )
    print(format_sizing(gold))
    print()

    # MNQ example
    nq = size_trade(
        instrument="MNQ",
        account_equity=25000,
        entry_price=30400,
        stop_price=30500,
        tp_prices=[30200, 30000, 29800],
        tp_split=[0.50, 0.30, 0.20],
    )
    print(format_sizing(nq))
