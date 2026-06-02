"""
Tradovate REST + WebSocket client for JAURX.

Handles authentication, order placement, position management,
and market data for MGC/MNQ futures.

Usage:
    client = TradovateClient(config)
    await client.connect()
    positions = await client.get_positions()
    await client.place_order("MGC", "Buy", qty=1, price=4580.0)
"""

import json
import time
import asyncio
import logging
from pathlib import Path
from datetime import datetime, timezone

log = logging.getLogger("tradovate")

try:
    import aiohttp
except ImportError:
    aiohttp = None
    log.warning("aiohttp not installed — run: pip install aiohttp")

try:
    import websockets
except ImportError:
    websockets = None
    log.warning("websockets not installed — run: pip install websockets")


class TradovateClient:
    """Async Tradovate API client for futures trading."""

    def __init__(self, config: dict):
        creds = config.get("tradovate", {})
        self.use_demo = creds.get("use_demo", True)
        self.base_url = creds.get("demo_url") if self.use_demo else creds.get("live_url")
        self.ws_url = creds.get("ws_demo_url") if self.use_demo else creds.get("ws_live_url")
        self.md_url = creds.get("md_demo_url") if self.use_demo else creds.get("md_live_url")
        self.credentials = creds.get("credentials", {})

        self.access_token = None
        self.token_expiry = 0
        self.account_id = None
        self.session = None
        self._device_id = creds.get("credentials", {}).get("deviceId") or self._generate_device_id()

    @staticmethod
    def _generate_device_id() -> str:
        import uuid
        return str(uuid.uuid4())

    async def connect(self):
        """Authenticate and get access token."""
        if aiohttp is None:
            raise RuntimeError("aiohttp required: pip install aiohttp")

        self.session = aiohttp.ClientSession()
        await self._authenticate()
        return self

    async def close(self):
        """Close the HTTP session."""
        if self.session:
            await self.session.close()

    async def renew_token(self):
        """Renew access token before expiry (call at ~75 min)."""
        url = f"{self.base_url}/auth/renewaccesstoken"
        async with self.session.get(url, headers=self._headers()) as resp:
            data = await resp.json()
            if "accessToken" in data:
                self.access_token = data["accessToken"]
                self.token_expiry = data.get("expirationTime", 0)
                log.info("Token renewed successfully")
            return data

    async def _authenticate(self):
        """Get access token from Tradovate auth endpoint (90-min lifespan, max 2 sessions)."""
        url = f"{self.base_url}/auth/accesstokenrequest"
        payload = {
            "name": self.credentials.get("username"),
            "password": self.credentials.get("password"),
            "appId": self.credentials.get("appId"),
            "appVersion": self.credentials.get("appVersion", "1.0.0"),
            "cid": self.credentials.get("cid"),
            "deviceId": self._device_id,
            "sec": self.credentials.get("sec"),
        }

        async with self.session.post(url, json=payload) as resp:
            data = await resp.json()
            if resp.status != 200 or "accessToken" not in data:
                raise AuthError(f"Auth failed: {data}")

            self.access_token = data["accessToken"]
            self.token_expiry = data.get("expirationTime", 0)
            self.account_id = data.get("userId")
            log.info(f"Authenticated as user {self.account_id} ({'DEMO' if self.use_demo else 'LIVE'})")

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

    async def _get(self, path: str) -> dict:
        """Authenticated GET request."""
        async with self.session.get(f"{self.base_url}{path}", headers=self._headers()) as resp:
            return await resp.json()

    async def _post(self, path: str, payload: dict = None) -> dict:
        """Authenticated POST request."""
        async with self.session.post(
            f"{self.base_url}{path}", headers=self._headers(), json=payload or {}
        ) as resp:
            return await resp.json()

    # ── Account ──────────────────────────────────────────

    async def get_accounts(self) -> list:
        """List all trading accounts."""
        return await self._get("/account/list")

    async def get_account_balance(self, account_id: int = None) -> dict:
        """Get cash balance for an account."""
        aid = account_id or self.account_id
        return await self._get(f"/cashBalance/getCashBalanceSnapshot?accountId={aid}")

    # ── Positions ────────────────────────────────────────

    async def get_positions(self) -> list:
        """Get all open positions."""
        return await self._get("/position/list")

    async def get_position(self, position_id: int) -> dict:
        """Get a specific position."""
        return await self._get(f"/position/item?id={position_id}")

    # ── Contracts ────────────────────────────────────────

    async def find_contract(self, symbol: str) -> dict:
        """Find a contract by symbol name (e.g., 'MGCM6', 'MNQM6')."""
        return await self._get(f"/contract/find?name={symbol}")

    async def suggest_contracts(self, text: str) -> list:
        """Search contracts by partial name."""
        return await self._post("/contract/suggest", {"text": text, "nEntities": 10})

    async def get_contract_spec(self, contract_id: int) -> dict:
        """Get contract specification (tick size, value, margins)."""
        return await self._get(f"/contractMaturity/item?id={contract_id}")

    # ── Orders ───────────────────────────────────────────

    async def place_order(
        self,
        symbol: str,
        action: str,
        qty: int = 1,
        order_type: str = "Market",
        price: float = None,
        stop_price: float = None,
        account_id: int = None,
    ) -> dict:
        """
        Place an order on Tradovate.

        Args:
            symbol: Contract symbol (e.g., "MGCM6")
            action: "Buy" or "Sell"
            qty: Number of contracts
            order_type: "Market", "Limit", "Stop", "StopLimit"
            price: Limit price (required for Limit/StopLimit)
            stop_price: Stop price (required for Stop/StopLimit)
            account_id: Trading account ID
        """
        contract = await self.find_contract(symbol)
        if not contract or "id" not in contract:
            raise OrderError(f"Contract not found: {symbol}")

        payload = {
            "accountSpec": self.credentials.get("username"),
            "accountId": account_id or self.account_id,
            "action": action,
            "symbol": symbol,
            "orderQty": qty,
            "orderType": order_type,
            "isAutomated": True,
        }

        if price is not None:
            payload["price"] = price
        if stop_price is not None:
            payload["stopPrice"] = stop_price

        log.info(f"Placing {action} {qty}x {symbol} @ {order_type} {price or 'MKT'}")
        return await self._post("/order/placeorder", payload)

    async def place_bracket(
        self,
        symbol: str,
        action: str,
        qty: int,
        entry_price: float = None,
        tp_price: float = None,
        sl_price: float = None,
        account_id: int = None,
    ) -> dict:
        """
        Place a bracket order (entry + TP + SL).

        For JR's style: entry at zone, TP at next level, SL above/below zone.
        """
        contract = await self.find_contract(symbol)
        if not contract or "id" not in contract:
            raise OrderError(f"Contract not found: {symbol}")

        payload = {
            "accountSpec": self.credentials.get("username"),
            "accountId": account_id or self.account_id,
            "action": action,
            "symbol": symbol,
            "orderQty": qty,
            "orderType": "Limit" if entry_price else "Market",
            "isAutomated": True,
        }

        if entry_price is not None:
            payload["price"] = entry_price

        bracket = {}
        if tp_price is not None:
            tp_action = "Sell" if action == "Buy" else "Buy"
            bracket["profitTarget"] = tp_price
        if sl_price is not None:
            bracket["stopLoss"] = sl_price

        if bracket:
            payload["bracket1"] = bracket

        log.info(f"Placing bracket {action} {qty}x {symbol}: entry={entry_price} TP={tp_price} SL={sl_price}")
        return await self._post("/order/placeorder", payload)

    async def place_scaled_bracket(
        self,
        symbol: str,
        action: str,
        total_qty: int,
        entry_price: float,
        tp_prices: list,
        tp_split: list,
        sl_price: float,
        account_id: int = None,
    ) -> list:
        """
        Place JR-style scaled exit: split position across TP1/TP2/TP3.

        Args:
            symbol: Contract symbol
            action: "Buy" or "Sell"
            total_qty: Total contracts
            entry_price: Entry price (None for market)
            tp_prices: [tp1, tp2, tp3] price levels
            tp_split: [0.50, 0.30, 0.20] fraction per level
            sl_price: Stop loss price
        """
        orders = []
        remaining = total_qty

        for i, (tp, split) in enumerate(zip(tp_prices, tp_split)):
            if i == len(tp_prices) - 1:
                qty = remaining
            else:
                qty = max(1, int(total_qty * split))
                remaining -= qty

            if qty <= 0:
                continue

            result = await self.place_bracket(
                symbol=symbol,
                action=action,
                qty=qty,
                entry_price=entry_price,
                tp_price=tp,
                sl_price=sl_price,
                account_id=account_id,
            )
            orders.append({
                "level": f"TP{i+1}",
                "qty": qty,
                "tp": tp,
                "sl": sl_price,
                "result": result,
            })
            log.info(f"  TP{i+1}: {qty} contracts → {tp}")

        return orders

    async def cancel_order(self, order_id: int) -> dict:
        """Cancel an open order."""
        return await self._post("/order/cancelorder", {"orderId": order_id})

    async def modify_order(self, order_id: int, price: float = None, stop_price: float = None, qty: int = None) -> dict:
        """Modify an existing order (price, stop, or quantity)."""
        payload = {"orderId": order_id}
        if price is not None:
            payload["price"] = price
        if stop_price is not None:
            payload["stopPrice"] = stop_price
        if qty is not None:
            payload["orderQty"] = qty
        return await self._post("/order/modifyorder", payload)

    async def flatten_position(self, account_id: int = None) -> dict:
        """Flatten all positions (emergency exit)."""
        aid = account_id or self.account_id
        log.warning(f"FLATTENING all positions on account {aid}")
        return await self._post("/order/liquidateposition", {"accountId": aid})

    # ── Market Data (WebSocket) ──────────────────────────

    async def subscribe_quotes(self, symbol: str, callback):
        """
        Subscribe to real-time quotes via MD WebSocket.

        Tradovate MD WS protocol:
        1. Connect to md-demo/md URL
        2. Wait for 'o' open frame
        3. Send: authorize\n0\n\n{accessToken}
        4. Wait for a[{"i":0,"s":200}]
        5. Send: md/subscribeQuote\n1\n\n{"symbol":"MGCM6"}
        6. Receive quote events (Bid, Offer, Trade, Volume, etc.)
        7. Send heartbeat [] every 2.5s

        callback receives parsed quote dict.
        """
        if websockets is None:
            raise RuntimeError("websockets required: pip install websockets")

        async with websockets.connect(self.md_url) as ws:
            open_frame = await ws.recv()
            log.info(f"MD WebSocket open: {open_frame[:20]}")

            auth_msg = f"authorize\n0\n\n{self.access_token}"
            await ws.send(auth_msg)
            auth_resp = await ws.recv()
            log.info(f"MD WebSocket auth: {auth_resp[:80]}")

            sub_msg = f'md/subscribeQuote\n1\n\n{json.dumps({"symbol": symbol})}'
            await ws.send(sub_msg)

            heartbeat_task = asyncio.create_task(self._ws_heartbeat(ws))
            try:
                async for message in ws:
                    try:
                        if message.startswith("a"):
                            data = json.loads(message[1:])
                            for item in data:
                                if "d" in item:
                                    await callback(item["d"])
                        elif message == "h":
                            continue
                    except (json.JSONDecodeError, IndexError):
                        continue
            finally:
                heartbeat_task.cancel()

    async def _ws_heartbeat(self, ws):
        """Send heartbeat every 2.5s to keep WebSocket alive."""
        while True:
            await asyncio.sleep(2.5)
            try:
                await ws.send("[]")
            except Exception:
                break

    async def subscribe_user_sync(self, callback):
        """
        Subscribe to real-time order/position events via user sync WebSocket.

        Receives fills, order status changes, position updates in real time.
        """
        if websockets is None:
            raise RuntimeError("websockets required: pip install websockets")

        async with websockets.connect(self.ws_url) as ws:
            open_frame = await ws.recv()
            auth_msg = f"authorize\n0\n\n{self.access_token}"
            await ws.send(auth_msg)
            await ws.recv()

            sync_msg = f'user/syncrequest\n1\n\n{json.dumps({"users": [self.account_id]})}'
            await ws.send(sync_msg)

            heartbeat_task = asyncio.create_task(self._ws_heartbeat(ws))
            try:
                async for message in ws:
                    try:
                        if message.startswith("a"):
                            data = json.loads(message[1:])
                            for item in data:
                                if "d" in item:
                                    await callback(item["d"])
                    except (json.JSONDecodeError, IndexError):
                        continue
            finally:
                heartbeat_task.cancel()

    # ── Helpers ──────────────────────────────────────────

    def size_position(self, account_equity: float, risk_pct: float, entry: float, stop: float, point_value: float) -> int:
        """
        Calculate position size based on risk.

        Example: $25K account, 1% risk, MGC entry 4580, stop 4610, $10/point
        Risk = $250, distance = $30, risk per contract = $300 → 0 contracts (too tight)
        Risk = $250, distance = $26, risk per contract = $260 → 1 contract (valid)
        """
        risk_amount = account_equity * (risk_pct / 100)
        distance = abs(entry - stop)
        risk_per_contract = distance * point_value

        if risk_per_contract <= 0:
            return 0

        contracts = int(risk_amount / risk_per_contract)
        return max(0, contracts)


class AuthError(Exception):
    pass

class OrderError(Exception):
    pass


def load_config(path: str = None) -> dict:
    """
    Load JAURX config from JSON file, overlaying secret credentials.

    Public config lives in jaurx-config.json (committed to git).
    Secret credentials live in credentials.json (gitignored, never pushed).
    If credentials.json exists, its 'tradovate' block is merged into
    config['tradovate']['credentials'] so secrets never touch the repo.
    """
    config_dir = Path(__file__).parent.parent / "config"
    if path is None:
        path = str(config_dir / "jaurx-config.json")
    with open(path) as f:
        config = json.load(f)

    creds_path = config_dir / "credentials.json"
    if creds_path.exists():
        with open(creds_path) as f:
            secrets = json.load(f)
        tv_secrets = secrets.get("tradovate", {})
        if tv_secrets:
            config.setdefault("tradovate", {}).setdefault("credentials", {}).update(tv_secrets)
            log.info("Loaded credentials from credentials.json (gitignored)")

    return config


async def demo():
    """Quick demo — requires credentials in config."""
    config = load_config()
    client = TradovateClient(config)

    try:
        await client.connect()
        print(f"Connected to Tradovate ({'DEMO' if client.use_demo else 'LIVE'})")

        accounts = await client.get_accounts()
        print(f"Accounts: {json.dumps(accounts, indent=2)}")

        positions = await client.get_positions()
        print(f"Open positions: {len(positions)}")

        mgc_size = client.size_position(
            account_equity=25000,
            risk_pct=1.0,
            entry=4580,
            stop=4610,
            point_value=10.0,
        )
        print(f"MGC position size at 1% risk: {mgc_size} contracts")

    finally:
        await client.close()


if __name__ == "__main__":
    asyncio.run(demo())
