# CLAURX · Shopify read-only dashboard (jaurxflips)

Pulls four views from your store using a **read-only** Admin API token:
**today's orders + revenue**, **low-stock flags**, **price-tier
reconciliation** ($16.99 / $19.99 / $24.99), and a **7-day revenue trend**.
It makes zero writes.

## 1. Get credentials (dev-dashboard app — the current path)
As of **Jan 1, 2026** Shopify no longer issues permanent `shpat_` tokens from
the admin. Custom apps live in the **dev dashboard** and authenticate with a
**Client ID + Secret** via the OAuth *client-credentials* grant — this script
mints a fresh 24h token on every run, so there's nothing to lose or paste twice.

1. In the dev dashboard, open your app (`claurx read only`).
2. Configure **Admin API scopes** (read-only): `read_orders`, `read_products`,
   `read_inventory`.
3. **Install** the app on JaurxShops (required before client-credentials works).
4. From **Settings → Credentials**, grab the **Client ID** and **Secret**.
   If the Secret was ever shown in a screenshot/chat, **Rotate** it first.

> Legacy: if you still have an old admin custom app with a `shpat_` token, you
> can use `SHOPIFY_TOKEN=` instead and skip the client-credentials step.

## 2. Store credentials (NEVER commit them)
```bash
cp shopify.env.example shopify.env   # shopify.env is git-ignored
# edit shopify.env: paste SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET
```

## 3. Run it
```bash
set -a; . ./shopify.env; set +a
node claurx-shopify.mjs            # human-readable dashboard
node claurx-shopify.mjs --json     # machine-readable (for the 11AM briefing)
```

## Granting scopes (the part that 403s if skipped)
Configuring scopes does **not** grant them — the merchant must install/approve
the app on the store. The reliable, server-free way is the **install link**:
dev dashboard → app → **Distribution** → **Custom distribution** → enter
`jaurxflips.myshopify.com` → **Generate link** → open it → **Install** →
approve the scopes. (The embedded/`app_url` OAuth flow needs a real app server;
skip it.) `read_orders` additionally needs **Protected customer data access**.

## Automation (daily briefing)
- `run-shopify-briefing.sh` — runs the pull, writes `briefings/<date>-shopify.md`
  + `briefings/latest-shopify.md`.
- `install-launchagent.sh` — installs a macOS LaunchAgent that runs it daily at
  **8:45 AM**. Enable once: `bash install-launchagent.sh`.

## Notes
- **Timezone:** all day boundaries are America/New_York (your EST rhythm).
- **Low stock:** flags active, inventory-tracked variants at/under
  `LOW_STOCK_THRESHOLD` (default 5).
- **Price tiers:** any active variant not priced at exactly one of the three
  tiers is flagged as off-tier.
- **Sessions/conversion:** order-derived revenue is exact; true sessions &
  conversion-rate require Shopify's analytics (ShopifyQL) — a later add-on.
- **Security:** the token grants read access to your whole store. Keep
  `shopify.env` off git and out of chat. Revoke/rotate from the same Develop
  apps screen if it ever leaks.
