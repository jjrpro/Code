# CLAURX · Tradovate account status (read-only)

Pulls your account **equity / cash balance / P&L** and **open positions**. It
never places, modifies, or cancels an order — read-only.

## Prerequisites (the real gate)
Tradovate's API isn't free or automatic. You need:
1. A **LIVE** Tradovate account with **> $1,000 equity**.
2. The **API Access** subscription (add-on in your Tradovate account).
3. An **API Key** generated in Tradovate → gives you `cid` (key id) + `sec` (secret).

Without all three, auth or `/account/list` will fail — the script says so plainly.

## ⚠️ Credential warning (read this)
Unlike Shopify's scoped token, Tradovate's API authenticates with your **actual
username + password + API secret**. That's full account access. So:
- `tradovate.env` is **git-ignored** — never commit it, never screenshot it.
- It lives only on your machine. Treat it like your bank password, because it is.
- Use `TRADOVATE_ENV=demo` first to test safely against a paper account.

## Setup
```bash
cd ~/code/projects/claurx/tradovate
cp tradovate.env.example tradovate.env
# edit tradovate.env: name, password, cid, sec (copy the secret, don't screenshot)
```

## Run
```bash
set -a; . ./tradovate.env; set +a
node claurx-tradovate.mjs           # human-readable
node claurx-tradovate.mjs --json    # machine-readable
```

## Notes
- **Auth:** `POST /auth/accesstokenrequest` → 90-min bearer token (fine for a pull).
- **Endpoints used:** `account/list`, `cashBalance/getcashBalanceSnapshot`,
  `position/list`.
- **Sessions:** Tradovate allows only 2 concurrent API sessions; the oldest is
  dropped if you exceed it. Don't be surprised if a live trading session bumps it.
- **Demo vs live:** demo hits `demo.tradovateapi.com`, live hits
  `live.tradovateapi.com`. Start on demo.
