# Hidden Labs — Go-Live Checklist (cart done; what's left to fully publish)

**Date:** 2026-06-24
**Summary:** The storefront now has a fully working cart + checkout UI
(add/remove/qty, persistent, order form). Below is exactly what's left to take
it from "works on my machine" to "live store taking real orders," plus the
decisions only you can make.

---

## ✅ Done (in the repo)

- Full 19-SKU catalog, 5 categories, prices with $25 shipping baked in
- AI product images + 3D-animated cards + authentic sticker labels ("99% Pure")
- **Working cart**: Add buttons, slide-out cart drawer, quantity controls,
  remove, live subtotal, saved between visits (localStorage)
- **Checkout UI**: shipping form (name/email/address/21+ confirm) with an
  order handoff — currently a placeholder (emails the order to
  admin@jjrproconsultants.com) until a live payment provider is connected.

---

## ⚠️ The one big constraint: payment processing

**Stripe, PayPal, Shopify Payments, Square, Cash App, Venmo all PROHIBIT
peptides / "research chemicals."** They will freeze the account and hold
funds when they find out. Do **not** build on them for this store. This is
the single most important thing to get right.

Realistic routes that actually work for this niche:

| Route | How it works | Pros | Cons |
|---|---|---|---|
| **Crypto checkout** (Coinbase Commerce, NOWPayments, BTCPay) | Customer pays in BTC/USDC; settles to you | Fast to set up, no underwriting, hard to shut down, instant settle | Fewer retail buyers have crypto → lower conversion |
| **High-risk card merchant** (providers that accept nutraceutical/research) | Real Visa/MC checkout via a high-risk gateway | Card payments = best conversion | Needs a registered business + underwriting, 4–15% fees, rolling reserves, approval time, some still reject peptides |
| **Manual / invoice** (current placeholder) | Order emailed to you; you send a pay link | Works today, zero setup | Not automated, clunky, you chase payment |

**My recommendation:** launch on **crypto (Coinbase Commerce)** to be live
fast, and apply for a **high-risk card merchant** in parallel for conversion.
You already have Coinbase Commerce experience from the DropVault project.

---

## What I still need to build (once you pick a payment route)

1. **A tiny backend (serverless function).** A static page can't securely
   create a charge for a dynamic cart total. A single function on the host
   (Cloudflare Pages Functions / Netlify Functions / Vercel) takes the cart,
   creates a charge with the provider, returns the pay URL. ~1 file.
2. **Wire the checkout button** to that function (one clearly-marked spot in
   `index.html` — the `PAYMENT INTEGRATION POINT`).
3. **Order notifications** — email/Telegram to you on each paid order, plus a
   success/thank-you page.

## What only YOU can do (accounts + legal — needs your identity/KYC)

4. **Open the payment account** (Coinbase Commerce and/or a high-risk
   merchant) — I can't do KYC for you. Paste me the API keys after.
5. **Pick hosting + domain.** The site is a static file + a function, so a
   free static host works great. Buy a domain (e.g. hiddenlabs.co) and point
   it at the host.
6. **Business + compliance basics:**
   - Keep everything **research-use-only / not for human consumption** (done in copy — don't add health/dosing claims)
   - **21+ age gate** on entry (I can add a modal)
   - **Terms / Privacy / Refund / Shipping** pages (I can draft them)
   - Consider an **LLC** + business bank account before taking card payments
   - **COAs** (certificates of analysis) per batch — link them on product pages
7. **Fulfillment** — who ships, how fast, tracking, packaging.

---

## Suggested launch order

1. You: pick payment route (crypto vs cards vs both) + hosting → tell me
2. You: open the payment account, send API keys
3. Me: build the checkout function + wire it + success page + age gate
4. Me: draft Terms/Privacy/Refund/Shipping pages
5. You: buy domain, I deploy to the host, point domain
6. Test a real $1 order end-to-end → flip live

> Compliance reminder: this stays framed as research-use-only. Don't market
> for human use — that's what turns a legal research-chemical store into an
> unapproved-drug / FTC problem.
