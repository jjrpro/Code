# Hidden Labs — Deploy & Payment Setup

Everything needed to take the store live on **Cloudflare Pages** with **crypto
checkout (Coinbase Commerce)** now, and **cards (high-risk merchant)** later.

The store is a static site (`index.html` + `img/` + `success.html`) plus one
serverless function (`functions/api/checkout.js`). Cloudflare Pages serves the
static files and runs the function automatically — no separate server.

---

## A. Put it online (Cloudflare Pages) — ~15 min

1. Create a free account at **dash.cloudflare.com** → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git**.
2. Authorize GitHub and pick the **`jjrpro/code`** repo.
3. Build settings:
   - **Production branch:** the branch this is merged to (e.g. `claude/jjr-ops-handoff-QHQJj`)
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `projects/hidden-labs`
   - **Root directory:** `projects/hidden-labs`
4. **Save and Deploy.** You'll get a live URL like `hidden-labs.pages.dev`.
   The store works immediately; checkout uses the email fallback until step B.

> No-Git alternative: install the Cloudflare CLI and run
> `npx wrangler pages deploy projects/hidden-labs` from the repo.

---

## B. Turn on crypto payments (Coinbase Commerce) — ~10 min

1. Sign up at **commerce.coinbase.com** (this is the niche-safe processor —
   unlike Stripe/PayPal it won't ban research compounds).
2. **Settings → Security → API keys → New API key.** Copy it.
3. In Cloudflare Pages → your project → **Settings → Environment variables →
   Production → Add:**
   - Name: `COINBASE_COMMERCE_API_KEY`
   - Value: *(the key you copied)*
4. **Redeploy** (Deployments → Retry deployment, or push any commit).
5. Test: add an item → Checkout → fill the form → Place Order. You should be
   redirected to a Coinbase-hosted pay page. Pay a small amount to confirm the
   full flow, then you're live.

That's it — crypto checkout is fully operational.

---

## C. Add card payments later (high-risk merchant)

"Regular" card checkout for peptides requires a **high-risk merchant account**
(Stripe/PayPal/Square will not work — they ban this category).

1. Register a business entity (LLC recommended) + business bank account.
2. Apply with a **high-risk payment provider** that accepts nutraceutical /
   research compounds (search "high-risk merchant account research peptides";
   examples in that space: PaymentCloud, Soar Pay, DigiPay, Easy Pay Direct —
   compare fees/approval, no endorsement). Expect underwriting, 4–15% fees, and
   possibly a rolling reserve.
3. When approved you'll get hosted-checkout or gateway API credentials.
4. Send me the credentials. I'll fill the clearly-marked **CARD PATH** block in
   `functions/api/checkout.js` and flip the front-end to offer "Pay by card"
   alongside crypto. (Server-side price validation is already in place.)

---

## D. Before you flip it fully live (recommended)

- **Custom domain:** buy one (e.g. hiddenlabs.co) → Cloudflare Pages → Custom
  domains → add it (Cloudflare auto-handles SSL).
- **Order notifications:** I can add an email/Telegram ping on each paid order
  (Coinbase Commerce webhook → the function).
- **Legal pages:** I can draft Terms, Privacy, Refund, and Shipping pages.
- **COAs:** link certificates of analysis on product pages when you have them.
- **Age gate** is already live (21+ modal, remembered per browser).

---

## What's already wired

- `functions/api/checkout.js` — creates the Coinbase Commerce charge, **recomputes
  the price server-side** (no browser tampering), redirects to `success.html`.
- `index.html` checkout → calls `/api/checkout`, redirects to the pay page, and
  falls back to emailing the order if payments aren't configured yet.
- `success.html` — thank-you page that clears the cart.
- 21+ age gate on entry.
