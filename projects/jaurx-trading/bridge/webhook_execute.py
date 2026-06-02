"""
JAURX Webhook Execution Bridge

Places REAL orders on Tradovate prop firm accounts (Lucid Trading, etc.)
by firing webhooks to TradersPost or PickMyTrade — authorized Tradovate
vendor platforms that bypass the prop firm API restriction.

Tradovate blocks direct API access on ALL prop firm accounts. These platforms
have vendor-level credentials that can execute on prop sub-accounts.

Flow: JAURX analysis → webhook → TradersPost/PickMyTrade → Tradovate → exchange

Setup (one time):
  1. Sign up at traderspost.io (free tier works) or pickmytrade.trade ($50/mo)
  2. Connect your Lucid/Tradovate account in the platform
  3. Create a webhook strategy → get your webhook URL
  4. Put the URL in config/credentials.json under "webhook_url"
  5. Done — JAURX can now fire orders

Usage:
  python3 -m bridge.webhook_execute buy MGC 4507 4485 4540,4575,4610
  python3 -m bridge.webhook_execute sell MGC 4580 4602 4545,4515,4480
"""

import json
import sys
import logging
from pathlib import Path
from datetime import datetime, timezone

log = logging.getLogger("jaurx.execute")

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    try:
        from urllib.request import urlopen, Request
        from urllib.error import HTTPError
    except ImportError:
        pass

CONFIG_DIR = Path(__file__).parent.parent / "config"


def load_webhook_url() -> str:
    creds_path = CONFIG_DIR / "credentials.json"
    if not creds_path.exists():
        return ""
    with open(creds_path) as f:
        creds = json.load(f)
    return creds.get("webhook_url", "") or creds.get("traderspost_url", "") or creds.get("pickmytrade_url", "")


def load_config() -> dict:
    with open(CONFIG_DIR / "jaurx-config.json") as f:
        return json.load(f)


def fire_webhook(url: str, payload: dict) -> dict:
    """Send the trade signal to the webhook platform."""
    body = json.dumps(payload).encode("utf-8")

    if HAS_REQUESTS:
        resp = requests.post(url, json=payload, timeout=15)
        return {"status": resp.status_code, "body": resp.text[:500]}
    else:
        req = Request(url, data=body, headers={"Content-Type": "application/json"})
        try:
            with urlopen(req, timeout=15) as resp:
                return {"status": resp.status, "body": resp.read().decode()[:500]}
        except HTTPError as e:
            return {"status": e.code, "body": e.read().decode()[:500]}


def build_traderspost_payload(action: str, symbol: str, qty: int,
                               entry: float, stop: float, tps: list) -> dict:
    """
    Build TradersPost webhook payload.
    Docs: https://docs.traderspost.io/docs/webhooks
    """
    side = "buy" if action.lower() in ("buy", "long") else "sell"
    payload = {
        "ticker": symbol,
        "action": side,
        "orderType": "limit",
        "limitPrice": entry,
        "quantity": qty,
        "stopLoss": {
            "type": "stop",
            "stopPrice": stop,
        },
    }
    if tps:
        payload["takeProfit"] = {
            "type": "limit",
            "limitPrice": tps[0],
        }
    return payload


def build_pickmytrade_payload(action: str, symbol: str, qty: int,
                               entry: float, stop: float, tps: list) -> dict:
    """
    Build PickMyTrade webhook payload.
    Docs: https://docs.pickmytrade.trade
    """
    side = "buy" if action.lower() in ("buy", "long") else "sell"
    payload = {
        "symbol": symbol,
        "action": side,
        "orderType": "limit",
        "price": entry,
        "quantity": qty,
        "sl": stop,
    }
    if tps:
        payload["tp1"] = tps[0]
    if len(tps) > 1:
        payload["tp2"] = tps[1]
    if len(tps) > 2:
        payload["tp3"] = tps[2]
    return payload


def execute(action: str, symbol: str, entry: float, stop: float,
            tps: list = None, qty: int = 1) -> dict:
    """
    Execute a trade via webhook.

    Returns the webhook response, or an error with clear instructions.
    """
    webhook_url = load_webhook_url()

    if not webhook_url:
        return {
            "success": False,
            "error": "No webhook URL configured",
            "fix": [
                "Tradovate blocks API access on ALL prop firm accounts.",
                "The workaround: use an authorized Tradovate vendor platform.",
                "",
                "Option A — TradersPost (free tier to test):",
                "  1. Sign up at traderspost.io",
                "  2. Connect your Lucid/Tradovate account",
                "  3. Create a webhook strategy → copy the URL",
                "",
                "Option B — PickMyTrade ($50/mo flat, sub-200ms execution):",
                "  1. Sign up at pickmytrade.trade",
                "  2. Connect your Lucid/Tradovate account",
                "  3. Create a strategy → copy the webhook URL",
                "",
                "Then paste the URL into config/credentials.json:",
                '  {"webhook_url": "https://traderspost.io/trading/webhook/..."}',
                "",
                "The moment that URL is in place, this command fires real orders.",
            ],
        }

    tps = tps or []

    # Detect platform from URL
    if "traderspost" in webhook_url:
        payload = build_traderspost_payload(action, symbol, qty, entry, stop, tps)
        platform = "TradersPost"
    elif "pickmytrade" in webhook_url:
        payload = build_pickmytrade_payload(action, symbol, qty, entry, stop, tps)
        platform = "PickMyTrade"
    else:
        payload = build_traderspost_payload(action, symbol, qty, entry, stop, tps)
        platform = "generic webhook"

    print(f"Firing {action.upper()} {qty}x {symbol} to {platform}...")
    print(f"  Entry: {entry}  Stop: {stop}  TPs: {tps}")
    print(f"  Webhook: {webhook_url[:60]}...")
    print()

    result = fire_webhook(webhook_url, payload)

    success = 200 <= result["status"] < 300
    print(f"Response: HTTP {result['status']}")
    print(f"Body: {result['body']}")

    return {
        "success": success,
        "platform": platform,
        "status": result["status"],
        "response": result["body"],
        "payload_sent": payload,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def main():
    if len(sys.argv) < 2:
        print("JAURX Webhook Execution")
        print("")
        print("Place real orders on prop firm accounts via webhook platforms.")
        print("Bypasses Tradovate's prop firm API block entirely.")
        print("")
        print("Usage:")
        print("  webhook_execute.py buy <symbol> <entry> <stop> <tp1,tp2,tp3> [qty]")
        print("  webhook_execute.py sell <symbol> <entry> <stop> <tp1,tp2,tp3> [qty]")
        print("")
        print("Examples:")
        print("  python3 -m bridge.webhook_execute buy MGC 4507 4485 4540,4575,4610")
        print("  python3 -m bridge.webhook_execute sell MGC 4580 4602 4545,4515,4480")
        return

    action = sys.argv[1].lower()
    if action not in ("buy", "sell"):
        print(f"Unknown action: {action}. Use 'buy' or 'sell'.")
        return

    if len(sys.argv) < 5:
        print(f"Usage: webhook_execute.py {action} <symbol> <entry> <stop> <tp1,tp2,tp3> [qty]")
        return

    symbol = sys.argv[2].upper()
    entry = float(sys.argv[3])
    stop = float(sys.argv[4])
    tps = [float(x) for x in sys.argv[5].split(",")] if len(sys.argv) > 5 else []
    qty = int(sys.argv[6]) if len(sys.argv) > 6 else 1

    from bridge.position_sizer import size_trade, format_sizing
    config = load_config()
    risk_pct = config.get("risk", {}).get("max_risk_per_trade_pct", 1.0)
    tp_split = config.get("risk", {}).get("tp_split", [0.50, 0.30, 0.20])

    sizing = size_trade(symbol, 25000, entry, stop, risk_pct, tps, tp_split)
    print(format_sizing(sizing))
    print()

    sized_qty = sizing.get("contracts", 0) or qty

    result = execute(action, symbol, entry, stop, tps, sized_qty)

    if not result["success"] and "fix" in result:
        print("=" * 60)
        print("CANNOT EXECUTE — webhook not configured yet")
        print("=" * 60)
        for line in result["fix"]:
            print(f"  {line}")
    elif result["success"]:
        print()
        print("ORDER SENT SUCCESSFULLY")
        print(f"Platform: {result['platform']}")
        print(f"Check your Tradovate/TradingView for the fill.")


if __name__ == "__main__":
    main()
