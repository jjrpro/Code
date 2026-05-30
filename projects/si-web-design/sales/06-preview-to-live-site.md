---
created: 2026-05-30
modified: 2026-05-30
tags:
  - jaurx
  - web-design
  - staten-island
  - delivery
  - playbook
status: in-progress
---

# Preview → Real Website — Full Delivery Playbook

What to actually DO once a business says "yes, I want it." Written for you (not
a developer). Follow it top to bottom per client. Whole thing takes ~1–2 hours
of real work once you've done it twice.

> **The short version:** Collect their info → finalize the mockup → get a domain
> → drag the folder onto Netlify → connect the domain → test on your phone →
> get paid → hand it off. Hosting is free; the domain is ~$12/yr.

---

## STEP 1 — They said yes. Collect this from them (5-min text or visit)

Send them this exact list:
1. **Logo** (any image file; phone photo of their sign works if needed)
2. **3–8 photos** — storefront, food/products, the team, interior
3. **Exact business name** as they want it shown
4. **Address** (confirm it — listings are often wrong)
5. **Phone** + **email** they want customers to use
6. **Hours** (confirm — this is the #1 wrong detail online)
7. **Services / menu** + any **prices** they want shown
8. **2–3 sentences about the business** (or you write it, they approve)
9. **Social links** (Instagram / Facebook)
10. **Do they already own a domain / web address?** (yes/no — see Step 3)

> 💡 If they're slow to send stuff, launch with what you have and add photos
> later. Don't let "gathering content" kill the deal.

---

## STEP 2 — Finalize the mockup (make it really theirs)

1. Open their folder (e.g. `mockups/their-business/index.html`).
2. **Replace every placeholder** with the real info from Step 1 (the comment at
   the top of the file lists what to confirm).
3. **Swap the stock photos** for their real photos:
   - Put their image files inside the folder (e.g. an `img/` folder).
   - In the file, change the photo web addresses to the file names
     (e.g. `url('img/storefront.jpg')`).
4. **Change the 2 brand colors** at the top of the file to match their logo.
5. **Working contact form** (only if they want one — contractors love this):
   - Easiest: **Formspree** (free). Make a form, paste its address into the
     form tag, submissions email straight to the owner. (Or Netlify Forms — Step 4.)
6. Save. Double-click the file to preview it in your browser. Looks right? Move on.

---

## STEP 3 — The domain (their web address)

A domain is the address like `tonyspizzasi.com`. Two cases:

**A) They already own one** (had an old site / bought one)
- Get their **registrar login** (GoDaddy, Namecheap, Google Domains, etc.), OR
- Tell them the DNS settings to enter (Netlify gives you these in Step 4).

**B) They don't have one (most common)**
- Buy it at **Namecheap.com** or **Porkbun.com** — about **$12–15/year**.
- Pick a clean name: `businessname.com`, `businessnameSI.com`, or `.nyc`.
- **Who owns it (important):** best practice = register it in the **client's
  name/email** (or hand them the login) so *they* own their domain. You can
  still manage it. This avoids any "you're holding my website hostage" problem
  and is the honest way to do it.
- **Billing it:** either have them buy it (send them the link), or you front the
  $12 and add it to their invoice.

---

## STEP 4 — Put it live on Netlify (free hosting)

1. One-time: make a free account at **app.netlify.com/signup**.
2. Go to **app.netlify.com/drop** and **drag the whole folder** onto the page.
3. ~10 seconds later you get a live link like `random-name.netlify.app`.
4. **Rename it:** Site configuration → Change site name → `their-business` →
   now it's `their-business.netlify.app`.
5. **Connect their real domain:** Domain management → Add a domain → type it →
   Netlify shows you either **nameservers** or **DNS records**:
   - Easiest path: set the domain's **nameservers** (at Namecheap/Porkbun/their
     registrar) to the ones Netlify lists. Save.
6. **HTTPS / the padlock is automatic** — Netlify turns on free SSL once the
   domain connects (can take a few minutes to a few hours to go green).
7. **(Optional) Contact form:** add `data-netlify="true"` to the form tag,
   re-deploy, and submissions show up in Netlify → Forms (forward to their email
   under Forms → Settings → Notifications).

**Updating the site later:** Netlify → your site → Deploys → drag the updated
folder on again. It replaces the old version. (Re-drag the *whole* folder.)

---

## STEP 5 — Google Business Profile (the real local-SEO win)

This is what actually gets them found on Google/Maps — often more valuable than
the site itself, and it's free.
1. Go to **google.com/business**, claim or create their listing.
2. Add the website link, hours, photos, services.
3. This makes them show up when someone searches "[their service] near me."

> Include this as part of your build — it's 15 minutes and makes you look great.

---

## STEP 6 — Test before you call it done

On **your phone** and a computer, check:
- [ ] Loads fast, looks right, padlock (https) shows
- [ ] "Call" buttons actually dial the number
- [ ] Map points to the **correct** address
- [ ] Hours, prices, services are **confirmed correct**
- [ ] Contact form (if any) sends a test email to the owner
- [ ] Social links open the right Instagram/Facebook

---

## STEP 7 — Get paid

- **Build fee:** take it up front, or 50% deposit / 50% at launch. ($400 build.)
- **Care Plan:** $40/mo recurring (hosting + edits) — set up a subscription.
- **How to collect:** Stripe Payment Link, Square, or Zelle/Venmo for locals.
  (You already have Stripe infra in `projects/jaurx-vip/stripe-diy/` if you want
  to reuse it.)
- Send a simple invoice (Square/Stripe make one). Get the build fee before the
  domain points live if you can.

---

## STEP 8 — Hand off + keep them happy

1. Send them the **live link** + a 2-line "how to request changes" note
   (just text/email you).
2. If they're on the **Care Plan**, you keep hosting + make small edits — that's
   the recurring money.
3. **Ask for a review** of *your* service once they're happy → fuels the next clients.
4. Log it in `prospect-tracker.csv` (status = WON, note the domain + plan).

---

## What it costs YOU vs what you charge

| Item | Your cost | Notes |
|---|---|---|
| Hosting (Netlify free tier) | **$0** | Plenty for a local business site |
| Domain | **~$12/yr** | Bill it to client or have them buy it |
| Contact form (Formspree/Netlify) | **$0** | Free tier is enough |
| Photos (if none) — Unsplash/Pexels | **$0** | Free, commercial-ok |
| **Your charge** | **$400 build + $40/mo** | ~$0 overhead = almost all margin |

15 Care-Plan clients = **$600/mo recurring** for a few edits a month.

---

## Gotchas / FAQ

- **"Will my old Facebook still work?"** Yes — the site works alongside it and
  adds Google search presence Facebook doesn't give.
- **Domain takes time to connect** — nameserver changes can take a few hours.
  The `.netlify.app` link works instantly in the meantime; send that first.
- **Don't register the domain only in your name** and refuse to hand it over —
  that's how web guys get a bad rep. Client owns their domain.
- **Keep a login doc** per client (registrar + Netlify) so you're not locked out.
- **Photos make or break it** — push for real photos; a great storefront photo
  beats any stock image.

---

*Templates & assets: `../template/`, demos in `../demos/`, the live mockups in
`../mockups/`. Outreach in `02-outreach-scripts.md`, pricing in
`03-pricing-and-delivery.md`, quick deploy steps in `04-deploy-guide.md`.*
