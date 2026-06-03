# CLAURX · Shopify read-only dashboard (jaurxflips)

Pulls four views from your store using a **read-only** Admin API token:
**today's orders + revenue**, **low-stock flags**, **price-tier
reconciliation** ($16.99 / $19.99 / $24.99), and a **7-day revenue trend**.
It makes zero writes.

## 1. Mint a read-only token (~3 min)
Shopify admin → **Settings → Apps and sales channels → Develop apps** →
**Allow custom app development** → **Create an app** (`CLAURX-readonly`) →
**Configure Admin API scopes**, tick only:
`read_orders`, `read_products`, `read_inventory`, `read_reports` → **Save** →
**Install app** → copy the **Admin API access token** (`shpat_…`, shown once).

## 2. Store the token (NEVER commit it)
```bash
cp shopify.env.example shopify.env   # shopify.env is git-ignored
# edit shopify.env, paste your shpat_ token
```

## 3. Run it
```bash
set -a; . ./shopify.env; set +a
node claurx-shopify.mjs            # human-readable dashboard
node claurx-shopify.mjs --json     # machine-readable (for the 11AM briefing)
```

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
