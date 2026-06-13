---
date: 2026-06-13
project: cross-project
status: actionable
tags:
  - revenue
  - business-formation
  - llc
  - sole-proprietor
  - jaurx-vip
  - whop
  - stripe
---

# Launch Without the LLC — Sole-Proprietor Playbook

**Date:** 2026-06-13
**One-line:** You do not need an LLC to start collecting money. Launch JAURX as a
sole proprietor today; form the LLC later once revenue justifies it (and migrate accounts then).

> Not legal or tax advice — general info. Rules vary by state; JR is in NY (Staten Island).
> For anything material, confirm with a CPA/attorney. This is about removing a false blocker.

---

## The core fact

The moment you accept a dollar for JAURX, you are a **sole proprietor** by default — under
your own legal name + SSN, no filing required. Business income flows onto your personal return
(Schedule C). Every payment rail you've already built supports an individual/sole-prop account:

| Rail | Onboard as | Needs | Status |
|---|---|---|---|
| **Whop** (VIP) | Individual | Name, DOB, SSN **or EIN**, personal bank | Parked at pricing screen — THE launch step |
| **Stripe** (stripe-diy, starter pack) | Individual / Sole prop | SSN or EIN, bank | Stack built, ready |
| **Shopify Payments** | Individual | SSN or EIN, bank | Store live |
| **Coinbase Commerce** (DropVault) | Individual | Email + wallet; KYC to cash out | Built, awaiting secrets |

---

## The 3 moves to get rolling (today)

1. **Get a free EIN** (IRS, ~10 min online, instant).
   - Sole proprietors CAN get an EIN without an LLC.
   - Then give platforms the **EIN instead of your SSN** — same onboarding, less personal exposure.
   - irs.gov → "Apply for an EIN Online." Entity type: Sole Proprietor.

2. **Finish Whop onboarding as "Individual"** — this is the actual ball-rolling step.
   - Use `projects/jaurx-vip/launch/whop-launch-pack.md` (paste-ready for every screen).
   - Name + EIN + personal bank for payouts.
   - Set pricing: **$49/mo public** + **$29/mo founders (hidden, 25-spot cap)**.
   - Connect the JAURX channel (`-1003952631411`); add the Whop bot as admin.

3. **(Optional) File a NY DBA** = "Certificate of Assumed Name" with the county clerk (~$30–120).
   - Lets you take money / open a bank account as **"JAURX"** instead of "John Reilly."
   - Nice-to-have for legitimacy + clean books; NOT required to launch.

---

## Why waiting on the LLC is the smart move in NY (not just acceptable)

- **NY publication requirement:** after forming an LLC you must publish notice in two
  newspapers for 6 weeks. In the NYC / Staten Island area this runs **~$1,000–2,000**.
- Spending that **before** you've proven the revenue is backwards.
- **Validate as sole prop → form the LLC once it's earning.** You can update/convert the
  Whop, Stripe, and Shopify accounts to the LLC later — no need to redo the launch.

---

## Liability: what protects you in the meantime

An LLC's job is asset protection (separating personal assets from business liability). Until
you form it, your front-line protections for an **info product** are:

1. **Disclaimer** — "educational & entertainment only, NFA" (already written + pinned in JAURX).
2. **Terms of Service + no-refund / refund policy** on the Whop landing page.
3. **Separate banking** — open a second personal checking account used ONLY for business
   income/expenses. Keeps books clean and makes the eventual LLC handoff trivial.
   (A true "business bank account" usually wants an EIN/DBA or LLC — a separate *personal*
   account is the no-friction version for now.)

The LLC is an **upgrade you add later**, not a prerequisite to start.

---

## What this unblocks (critical path from MEMORY.md)

Getting the ball rolling = finishing the launch you already 90% built. The LLC was never on it:

1. ✅ JAURX channel live, welcome posted → **pin welcome + disclaimer**
2. ⏳ **Whop: onboard as Individual + set $49/$29 pricing + connect bot** ← do this
3. ⏳ Apply `bot.js` VIP patch on Mac (debug the terminal error)
4. ⏳ DM ~20 most-engaged free-group members the **$29 founders link**
5. ⏳ Sunday 7pm ET public launch post → Monday 7:30am ET first morning bias

First paid sub can happen the same day you finish step 2.

---

## When to actually form the LLC

Form it once any of these is true:
- You're consistently earning (e.g., past ~$1–2k/mo) and want the liability shield + tax options.
- You're about to spend real money on ads / contractors in the business name.
- You want a business bank account + business credit in the entity's name.

Then: file NY LLC → EIN stays or get a new one for the entity → update Whop/Stripe/Shopify
business profiles to the LLC → done. No customer-facing disruption.

---

## Next action

Get the EIN, then walk the Whop pack screen-by-screen as an Individual. Everything else
(bot patch, founders DMs, launch posts) is already scripted in the repo.
