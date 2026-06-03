# ☕ CLAURX Shopify — 9 AM Wake-Up Checklist (2026-06-03)

Everything's built. You have **two actions**, ~3 minutes total. Action 1 is the
only real work — it's the Shopify approval I can't click for you.

---

## ✅ ACTION 1 — Approve the app on your store (the install link method)

The `example.com` embedded flow is a dead end. Use the **install-link** method
instead — no app server needed:

1. Dev dashboard → app **claurx read only** → **Settings** (or **Distribution**).
2. Find **Distribution** → choose **Custom distribution**.
3. Enter your store domain: **`jaurxflips.myshopify.com`** → **Generate link**.
4. **Open that install link** in a new tab → select **JaurxShops** → **Install**.
5. When it shows the permissions (`read_inventory`, `read_orders`,
   `read_products`), click **Install / Approve**.

> If `read_orders` is greyed or warns about customer data: approve the other two
> now (catalog data will flow), and grant **Protected customer data access**
> under the app's **API access** settings afterward for revenue.

---

## ✅ ACTION 2 — Confirm it works, then let it auto-run

Open Terminal, paste this (gets the latest files + runs the pull):

```bash
cd ~/code && git fetch origin claude/ecstatic-allen-5Z9Ay && git checkout origin/claude/ecstatic-allen-5Z9Ay -- projects/claurx/shopify && cd projects/claurx/shopify && set -a && . ./shopify.env && set +a && node claurx-shopify.mjs
```

You should now see **real numbers** — product counts, low-stock list, your
$16.99 / $19.99 / $24.99 tier check. (Revenue too, if `read_orders` approved.)

**Then make it run itself every morning at 8:45** (one time):

```bash
bash install-launchagent.sh
launchctl start com.claurx.shopify-briefing
```

After that, your briefing lands at `briefings/latest-shopify.md` every morning —
no command needed. Syncs to your Obsidian vault (phone) within a minute.

---

## 🧹 Loose ends (not blocking — do when you have a sec)
- **Rotate the client secret once more** (it showed in setup screenshots) and
  update `shopify.env`. Use the 📋 copy icon, not the eye — never screenshot it.
- `read_orders` / revenue needs Protected customer data access (see Action 1).

If anything errors, paste me the **output** (never the secret) and I'll fix it.
