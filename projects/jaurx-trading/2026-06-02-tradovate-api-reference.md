# Tradovate REST API Reference

**Date:** 2026-06-02
**Purpose:** Complete API reference for building a Tradovate client for the JAURX automated trading system (MGC + MNQ futures).

---

## 1. Base URLs

| Environment | REST Base URL | WebSocket (Orders/User) | WebSocket (Market Data) |
|---|---|---|---|
| **Demo** | `https://demo.tradovateapi.com/v1` | `wss://demo.tradovateapi.com/v1/websocket` | `wss://md-demo.tradovateapi.com/v1/websocket` |
| **Live** | `https://live.tradovateapi.com/v1` | `wss://live.tradovateapi.com/v1/websocket` | `wss://md.tradovateapi.com/v1/websocket` |

All REST endpoints below are relative to the base URL (e.g., `POST https://demo.tradovateapi.com/v1/auth/accesstokenrequest`).

---

## 2. Authentication

### 2a. Access Token Request (Primary Method)

**`POST /auth/accesstokenrequest`**

Do NOT include an `Authorization` header on this request.

**Request Body:**
```json
{
  "name": "your_username",
  "password": "your_password",
  "appId": "JaurxTrader",
  "appVersion": "1.0.0",
  "cid": "8",
  "sec": "your_api_secret_key",
  "deviceId": "unique-device-uuid"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | Yes | Tradovate username |
| `password` | string | Yes | Tradovate password |
| `appId` | string | Yes | Your application name |
| `appVersion` | string | Yes | Your application version |
| `cid` | string | Yes | Client ID (from API key setup) |
| `sec` | string | Yes | API secret key (from API key setup) |
| `deviceId` | string | No | Unique device identifier (recommended; generate with `uuid` and cache) |

**Response Body (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIs...",
  "expirationTime": "2026-06-02T15:30:00.000Z",
  "userId": 12345,
  "userStatus": "Active",
  "name": "your_username",
  "hasLive": true,
  "passwordExpirationTime": "2027-01-01T00:00:00.000Z",
  "errorText": null
}
```

| Field | Type | Description |
|---|---|---|
| `accessToken` | string | Bearer token (90-minute lifespan) |
| `expirationTime` | datetime | When the token expires |
| `userId` | integer | Your user ID |
| `userStatus` | enum | `Active`, `Closed`, `Initiated`, `TemporaryLocked`, `UnconfirmedEmail` |
| `hasLive` | boolean | Whether user has a live account |
| `errorText` | string | Error message if auth failed |

**Using the token:** All subsequent requests must include:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

### 2b. Token Renewal

**`GET /auth/renewaccesstoken`**

Call this ~15 minutes before `expirationTime`. Returns a fresh `AccessTokenResponse` with a new 90-minute window.

### 2c. Session Limits

You are limited to **2 concurrent sessions**. Creating a 3rd session auto-closes the oldest.

### 2d. OAuth Flow (Alternative)

**`POST /auth/oauthtoken`**

For apps that use OAuth authorization delegation (redirect-based).

**Request Body:**
```json
{
  "grant_type": "authorization_code",
  "code": "oauth_code_from_redirect",
  "redirect_uri": "https://yourapp.com/callback",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret"
}
```

**Response Body:**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 5400,
  "refresh_token": "rt_...",
  "refresh_token_expires_in": 86400,
  "id_token": "..."
}
```

See: https://github.com/tradovate/example-api-oauth

### 2e. Rate Limiting & Time Penalties

When rate-limited, the API returns a Time Penalty object:
```json
{
  "p-ticket": "abc123",
  "p-time": 10,
  "p-captcha": false
}
```
- `p-ticket`: include this in retry requests
- `p-time`: wait this many seconds before retrying
- `p-captcha`: if true, requires human intervention

---

## 3. Common Entity Operations

All entities (account, order, position, contract, fill, etc.) support these standard operations:

| Operation | Method | Endpoint | Description |
|---|---|---|---|
| Get by ID | GET | `/{entity}/item?id={id}` | Single entity by numeric ID |
| Get multiple | GET | `/{entity}/items?ids={id1},{id2}` | Batch retrieval |
| List all | GET | `/{entity}/list` | All entities of this type |
| Find by name | GET | `/{entity}/find?name={name}` | Lookup by name/symbol |
| Suggest/search | GET | `/{entity}/suggest?t={query}&l={limit}` | Autocomplete search |
| Dependencies | GET | `/{entity}/deps?masterid={id}` | Child entities |
| Multi-deps | GET | `/{entity}/ldeps?masterids={id1},{id2}` | Children for multiple parents |

---

## 4. Account Endpoints

### List Accounts
**`GET /account/list`**
Returns array of account objects with `id`, `name`, `accountType`, etc.

### Get Account by ID
**`GET /account/item?id={id}`**

### Cash Balance Snapshot
**`GET /cashBalance/getCashBalanceSnapshot?accountId={id}`**
Returns current cash balance, margin info.

### Related Endpoints
- `GET /cashBalanceLog/deps?masterid={accountId}` -- cash balance history
- `POST /account/resetdemoaccountstate` -- reset demo account
- `POST /account/changedemobalance` -- modify demo balance

---

## 5. Contract Endpoints

### Find Contract by Symbol
**`GET /contract/find?name=MGCM6`**

Use this to look up a contract by its exact symbol name (e.g., `MGCM6` for Micro Gold June 2026).

### Suggest/Search Contracts
**`GET /contract/suggest?t=MGC&l=10`**

Autocomplete-style search. `t` = search text, `l` = max results.

### Get Contract by ID
**`GET /contract/item?id={contractId}`**

Returns contract details including symbol, exchange, tick size, etc.

### Batch Get Contracts
**`GET /contract/items?ids=840972,840944`**

### Find Product
**`GET /product/find?name=MGC`**

Products are the parent of contracts (e.g., product `MGC` has contracts `MGCM6`, `MGCQ6`, etc.).

---

## 6. Order Endpoints

### Place Order
**`POST /order/placeorder`**

**Request Body:**
```json
{
  "accountSpec": "DEMO12345",
  "accountId": 67890,
  "action": "Buy",
  "symbol": "MGCM6",
  "orderQty": 1,
  "orderType": "Limit",
  "price": 2350.00,
  "timeInForce": "Day",
  "isAutomated": true
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `accountSpec` | string | Yes | Account name string |
| `accountId` | integer | Yes | Account numeric ID (from `/account/list`) |
| `action` | enum | Yes | `Buy` or `Sell` |
| `symbol` | string | Yes | Contract symbol (e.g., `MGCM6`, `MNQM6`) |
| `orderQty` | integer | Yes | Number of contracts |
| `orderType` | enum | Yes | `Market`, `Limit`, `Stop`, `StopLimit`, `MIT`, `TrailingStop`, `TrailingStopLimit`, `QTS` |
| `price` | number | For Limit/StopLimit | Limit price |
| `stopPrice` | number | For Stop/StopLimit | Stop trigger price |
| `timeInForce` | enum | No | `Day` (default), `GoodTillCancel`, `ImmediateOrCancel`, `FillOrKill` |
| `isAutomated` | boolean | **Yes for bots** | **Must be `true` for algorithmic/bot orders** (CME regulation) |

### Modify Order
**`POST /order/modifyorder`**

**Request Body:**
```json
{
  "orderId": 3703634089,
  "orderQty": 2,
  "orderType": "Limit",
  "price": 2355.00,
  "isAutomated": true
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `orderId` | integer | Yes | ID of the order to modify |
| `orderQty` | integer | Yes | New quantity |
| `orderType` | enum | Yes | Order type |
| `price` | number | For Limit | New limit price |
| `stopPrice` | number | For Stop | New stop price |

### Cancel Order
**`POST /order/cancelorder`**

**Request Body:**
```json
{
  "orderId": 3703634089
}
```

### Liquidate Position
**`POST /order/liquidateposition`**

Cancels all working orders and closes the position for a given contract.

**Request Body:**
```json
{
  "accountId": 67890,
  "contractId": 12345,
  "admin": false
}
```

### Order Strategy Endpoints
- `POST /order/startorderstrategy` -- start a bracket/OCO/OSO strategy
- `POST /order/modifyorderstrategy` -- modify an active strategy

### Get Order Details
- `GET /order/item?id={orderId}`
- `GET /order/list`

---

## 7. Position Endpoints

### List Open Positions
**`GET /position/list`**

Returns all open positions with fields including `id`, `accountId`, `contractId`, `netPos`, `netPrice`.

### Get Position by ID
**`GET /position/item?id={positionId}`**

### Find Position
**`GET /position/find?name={name}`**

### Positions for Account
**`GET /position/deps?masterid={accountId}`**

---

## 8. Fill Endpoints

### List All Fills
**`GET /fill/list`**

### Get Fill by ID
**`GET /fill/item?id={fillId}`**

### Fill Pairs (for P&L)
**`GET /fillPair/list`**

---

## 9. WebSocket Protocol

### 9a. Connection

1. Open a standard WebSocket connection to the appropriate URL:
   - Orders/user events: `wss://demo.tradovateapi.com/v1/websocket`
   - Market data: `wss://md-demo.tradovateapi.com/v1/websocket`

2. Server sends an `o` frame (open) on successful connection.

### 9b. Authorization

After receiving the `o` frame, send:
```
authorize\n0\n\n{accessToken}
```

The format is: `{endpoint}\n{requestId}\n{queryString}\n{body}`

- Request ID `0` is reserved for auth.
- Success response: `a[{"i":0,"s":200}]`
- Failure response: `a[{"i":0,"s":401,"d":"Invalid access token"}]`

### 9c. Frame Types

| Prefix | Meaning | Direction |
|---|---|---|
| `o` | Open/heartbeat | Server -> Client |
| `h` | Heartbeat | Server -> Client |
| `a[...]` | Array of JSON response messages | Server -> Client |
| `[]` | Client heartbeat | Client -> Server |

### 9d. Heartbeat

Send `[]` (empty JSON array) every **2.5 seconds** (some docs say 30 seconds -- use 2.5s to be safe). If no server message for 10-15 seconds, reconnect.

### 9e. Sending Requests over WebSocket

Format: `{endpoint}\n{requestId}\n{queryString}\n{jsonBody}`

Request IDs auto-increment starting at 2 (0 and 1 are reserved).

**Example -- list accounts:**
```
account/list\n2\n\n
```

**Example -- place order:**
```
order/placeorder\n3\n\n{"accountSpec":"DEMO12345","accountId":67890,"action":"Buy","symbol":"MGCM6","orderQty":1,"orderType":"Market","isAutomated":true}
```

### 9f. Response Format

Responses arrive as `a[...]` frames containing JSON objects:
```json
a[{"i":2,"s":200,"d":[...account data...]}]
```

| Field | Description |
|---|---|
| `i` | Request ID (matches what you sent) |
| `s` | HTTP status code (200, 401, etc.) |
| `d` | Data payload |
| `e` | Event type (for push events) |

---

## 10. Market Data WebSocket

### 10a. Connection

Connect to the **market data** WebSocket (separate from the orders WebSocket):
- Demo: `wss://md-demo.tradovateapi.com/v1/websocket`
- Live: `wss://md.tradovateapi.com/v1/websocket`

Authorize using the same protocol as section 9b above.

### 10b. Subscribe to Quotes

```
md/subscribeQuote\n2\n\n{"symbol":"MGCM6"}
```

The `symbol` can be a string symbol name or a numeric contract ID.

**Response (subscription confirmation):**
The server returns a subscription ID. Cache it for unsubscribing.

**Quote data events arrive as `md` type messages:**
```json
{
  "e": "md",
  "d": {
    "quotes": [
      {
        "timestamp": "2026-06-02T14:30:00.000Z",
        "contractId": 12345,
        "entries": {
          "Bid": {"price": 2350.00, "size": 5},
          "Offer": {"price": 2350.50, "size": 3},
          "Trade": {"price": 2350.25, "size": 1},
          "HighPrice": {"price": 2365.00},
          "LowPrice": {"price": 2340.00},
          "OpeningPrice": {"price": 2345.00},
          "SettlementPrice": {"price": 2348.00},
          "TotalTradeVolume": {"size": 45000},
          "OpenInterest": {"size": 12000}
        }
      }
    ]
  }
}
```

### 10c. Subscribe to DOM (Depth of Market)
```
md/subscribeDom\n3\n\n{"symbol":"MGCM6"}
```

### 10d. Subscribe to Charts (OHLCV)
```
md/getChart\n4\n\n{"symbol":"MGCM6","chartDescription":{"underlyingType":"MinuteBar","elementSize":5,"elementSizeUnit":"UnderlyingUnits"},"timeRange":{"asMuchAsElements":100}}
```

### 10e. Unsubscribe
```
md/unsubscribeQuote\n5\n\n{"symbol":"MGCM6"}
```

### 10f. User Sync (Real-Time Events)

On the **orders** WebSocket, subscribe to user events (fills, position changes, balance updates):
```
user/syncrequest\n1\n\n{"users":[12345]}
```

Only one `syncrequest` per socket lifecycle. Provides real-time push events for order fills, position changes, and cash balance updates -- eliminating the need to poll.

---

## 11. API Key Permissions

When creating your API key at https://trader.tradovate.com, ensure **Full Access** for:
- Orders (required to place/modify/cancel)
- Contract Library (required so server can look up contracts)
- User Information (required for account ID retrieval -- commonly missed)

Without all three set to full access, order placement returns `Access is denied`.

---

## 12. Existing GitHub Libraries

### Python

| Library | Install | Coverage | Link |
|---|---|---|---|
| **TradovatePy** | `pip install TradovatePy==0.1` | Session, positions, basic wrapper | https://github.com/antonio-hickey/TradovatePy |
| **Tradovate-Python-Client** | Clone + `pip install -r requirements.txt` | Auth, orders (limit/market/trail), positions, fills, cancel | https://github.com/cullen-b/Tradovate-Python-Client |
| **tradovate-python-wrapper** | Clone repo | Swagger-generated client | https://github.com/MLAlgoTrader/tradovate-python-wrapper |
| **tradovate** (PyPI) | `pip install tradovate` | Data fetching (inactive maintenance) | https://pypi.org/project/tradovate/ |
| **dearvn/tradovate** | Clone repo | Example projects collection | https://github.com/dearvn/tradovate |

### Node.js

| Library | Install | Coverage | Link |
|---|---|---|---|
| **tradovate-api-node** | `npm install tradovate-api-node` | Full typed wrapper (v0.12.27) | https://www.npmjs.com/package/tradovate-api-node |

### Official Tradovate Examples (JavaScript)
- **example-api-js** -- tutorials + WebSocket guides: https://github.com/tradovate/example-api-js
- **example-api-oauth** -- OAuth flow example: https://github.com/tradovate/example-api-oauth
- **example-api-faq** -- FAQ docs + sample code: https://github.com/tradovate/example-api-faq

---

## 13. Quick-Start Code (Node.js)

```javascript
const BASE = 'https://demo.tradovateapi.com/v1';

// Step 1: Authenticate
const authRes = await fetch(`${BASE}/auth/accesstokenrequest`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: process.env.TV_USER,
    password: process.env.TV_PASS,
    appId: 'JaurxTrader',
    appVersion: '1.0.0',
    cid: process.env.TV_CID,
    sec: process.env.TV_SEC,
    deviceId: process.env.TV_DEVICE_ID
  })
});
const { accessToken } = await authRes.json();
const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};

// Step 2: Get account ID
const accounts = await (await fetch(`${BASE}/account/list`, { headers })).json();
const accountId = accounts[0].id;
const accountSpec = accounts[0].name;

// Step 3: Look up contract
const contract = await (await fetch(
  `${BASE}/contract/find?name=MGCM6`, { headers }
)).json();

// Step 4: Place a limit order
const order = await (await fetch(`${BASE}/order/placeorder`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    accountSpec,
    accountId,
    action: 'Buy',
    symbol: 'MGCM6',
    orderQty: 1,
    orderType: 'Limit',
    price: 2350.00,
    timeInForce: 'Day',
    isAutomated: true
  })
})).json();

// Step 5: Cancel the order
await fetch(`${BASE}/order/cancelorder`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ orderId: order.orderId })
});
```

---

## 14. Quick-Start Code (Python)

```python
import requests

BASE = 'https://demo.tradovateapi.com/v1'

# Step 1: Authenticate
auth = requests.post(f'{BASE}/auth/accesstokenrequest', json={
    'name': 'your_username',
    'password': 'your_password',
    'appId': 'JaurxTrader',
    'appVersion': '1.0.0',
    'cid': 'your_cid',
    'sec': 'your_sec',
    'deviceId': 'your-device-uuid'
})
token = auth.json()['accessToken']
headers = {'Authorization': f'Bearer {token}'}

# Step 2: Get account
accounts = requests.get(f'{BASE}/account/list', headers=headers).json()
acct_id = accounts[0]['id']
acct_spec = accounts[0]['name']

# Step 3: Find contract
contract = requests.get(f'{BASE}/contract/find?name=MGCM6', headers=headers).json()

# Step 4: Place order
order = requests.post(f'{BASE}/order/placeorder', headers=headers, json={
    'accountSpec': acct_spec,
    'accountId': acct_id,
    'action': 'Buy',
    'symbol': 'MGCM6',
    'orderQty': 1,
    'orderType': 'Market',
    'isAutomated': True
}).json()

# Step 5: List positions
positions = requests.get(f'{BASE}/position/list', headers=headers).json()
```

---

## 15. WebSocket Market Data (Python)

```python
import asyncio, websockets, json

MD_URL = 'wss://md-demo.tradovateapi.com/v1/websocket'

async def stream_quotes(access_token, symbol='MGCM6'):
    async with websockets.connect(MD_URL) as ws:
        # Wait for open frame
        msg = await ws.recv()  # should be 'o'

        # Authorize
        await ws.send(f'authorize\n0\n\n{access_token}')
        auth_resp = await ws.recv()
        print('Auth:', auth_resp)

        # Subscribe to quotes
        await ws.send(f'md/subscribeQuote\n2\n\n{json.dumps({"symbol": symbol})}')

        # Listen for data + send heartbeats
        while True:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=2.5)
                if msg.startswith('a'):
                    data = json.loads(msg[1:])
                    for item in data:
                        if 'd' in item and 'quotes' in str(item.get('d', '')):
                            print('Quote:', item['d'])
                elif msg == 'h':
                    pass  # server heartbeat
            except asyncio.TimeoutError:
                await ws.send('[]')  # client heartbeat
```

---

## 16. Important Notes

1. **`isAutomated: true` is mandatory** for bot/algorithm orders (CME Group regulation).
2. **2 concurrent sessions max.** Design your system to reuse one session.
3. **Token renewal:** renew at ~75 minutes (15 min before 90-min expiry).
4. **Market data requires a subscription.** The `hasMarketData` field on the account must be `true`. CME market data licenses can cost $400+/month for API access.
5. **Demo vs Live:** always develop and test against `demo.tradovateapi.com` first.
6. **The API is OpenAPI 3.0.0 spec.** The full swagger YAML is at `swagger/services.swagger.yaml` in the official repos.
7. **Entity naming pattern:** endpoint paths are `{entityName}/{operation}` (e.g., `/order/placeorder`, `/account/find`).

---

## Sources

- Tradovate Partner API Docs: https://partner.tradovate.com
- Tradovate API (Swagger): https://api.tradovate.com
- Official JS Examples: https://github.com/tradovate/example-api-js
- Official FAQ Repo: https://github.com/tradovate/example-api-faq
- Tradovate Community Forum: https://community.tradovate.com
