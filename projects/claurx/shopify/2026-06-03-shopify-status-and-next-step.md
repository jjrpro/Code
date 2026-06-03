---
created: 2026-06-03
modified: 2026-06-03
tags:
  - claurx
  - shopify
  - status
status: blocked-on-shopify-install
---

# CLAURX Shopify — Status & The One Remaining Step (2026-06-03)

> One-line: the integration is built and PROVEN working — it authenticates and
> reads the live store. The only blocker is a Shopify-side app install/approval
> that grants the scopes. Everything else is done.

## What works (verified live, ~1:30 AM EST)
- Files on JR's Mac at `~/code/projects/claurx/shopify/`.
- `shopify.env` exists locally (git-ignored) with `SHOPIFY_CLIENT_ID` +
  `SHOPIFY_CLIENT_SECRET`. **The secret was exposed in screenshots during setup
  — rotate it once more when convenient and update `shopify.env`.**
- Script authenticates via OAuth client-credentials grant (mints a 24h token).
- Script runs, reaches the real store, and degrades gracefully per scope.

## The blocker (the ONLY thing left)
Every Admin API call returns:
`403 — "This action requires merchant approval for read_* scope."`

Cause: the app's scopes (`read_inventory, read_orders, read_products` — all
correctly configured on version `claurx-read-only-2`, Active) are **published
but not granted**. Releasing a version ≠ installing it. The merchant (JR) must
**install/approve the app on JaurxShops**, which is done from the **store admin**
(JaurxShops → app), not the dev dashboard.

### Likely sub-issue to check
The active version lists `app_url = https://example.com` and `embedded = true`.
If the store install tries to OAuth-redirect to that placeholder URL and fails,
fix the app config (set a real/no app URL, or disable embedded for this
API-only app), cut a new version, then install.

## Exact next step (5 min, fresh)
1. Store admin → **Settings → Apps and sales channels** (or the open
   "JaurxShops · claurx read only" tab) → find **claurx read only**.
2. Click **Install / Update / Approve permissions** → approve the 3 scopes.
3. Re-run on the Mac:
   ```bash
   cd ~/code/projects/claurx/shopify && set -a && . ./shopify.env && set +a && node claurx-shopify.mjs
   ```
4. Expect: product counts, low-stock list, $16.99/$19.99/$24.99 tier check.
   `read_orders` (revenue) may need an extra "Protected customer data access"
   approval — handle after catalog data is flowing.

## Note for `read_orders` specifically
Orders contain customer PII → Shopify gates it behind "Protected customer data
access" in the app's API access settings, on top of the scope grant. Products
and inventory do not need this.
