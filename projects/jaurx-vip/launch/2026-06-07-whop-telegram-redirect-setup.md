---
date: 2026-06-07
project: jaurx-vip
status: verification-required
tags:
  - whop
  - telegram
  - post-purchase
  - redirect
---

# Whop → Telegram Auto-Redirect — Verification + Setup

**Goal**: Customer pays → lands on a success page that auto-redirects them to a one-time Telegram invite link → they join JAURX private channel → Whop bot tracks their membership.

**Short answer**: Whop does this natively when the product has **Telegram access** wired correctly. No custom code. If it's not happening, one of 4 specific settings is missing.

---

## How Whop's Telegram redirect actually works (architecture)

```
Customer clicks "Join VIP — $49/mo" on jjrpro-site
        ↓
Lands on Whop checkout (plan_NRcpgDOL6DRS0)
        ↓
Pays via Stripe (Whop's payment processor)
        ↓
Whop's webhook fires: payment.succeeded
        ↓
Whop generates a ONE-TIME Telegram invite link via Whop bot
        ↓
Customer auto-redirects to Whop's hosted success page
        ↓
Success page shows "Join Channel" button + auto-redirect
        ↓
Telegram invite consumed → customer joins JAURX channel
        ↓
Whop bot logs the join, tracks subscription status
        ↓
On cancel/refund → Whop bot kicks customer from channel
```

The customer never copies/pastes a link. It's a single click after payment.

---

## 5-step verification (do this in Whop dashboard, ~5 min)

### Step 1 — Confirm product access type
1. Log in to `whop.com` → **Dashboard**
2. Click your **JAURX VIP** product
3. Click **Access** or **Delivery** tab (label varies by Whop version)
4. **Expected setting**: Access type = "Telegram" (NOT "Manual" or "Discord")

If it's wrong: change to Telegram, save.

### Step 2 — Confirm the linked Telegram channel
Still in Access settings:

1. Look for "Telegram channel" or "Connected channel" field
2. **Expected value**: channel ID `-1003952631411` (JAURX private) OR channel handle `@JAURX`

If empty or wrong: click "Connect Telegram" → authorize Whop bot → select the JAURX channel from the dropdown.

### Step 3 — Confirm Whop bot is admin in JAURX channel
1. Open Telegram → JAURX private channel
2. Tap channel name → **Administrators**
3. **Expected**: `@whopbot` (or whatever Whop's bot is named in your install) is listed as admin
4. **Expected permissions**:
   - ✅ Invite users via link
   - ✅ Ban users (so Whop can kick on cancel)
   - ✅ Read messages (optional but recommended for analytics)

If missing: tap **Add Administrator** → search `whopbot` → grant the 3 permissions above.

### Step 4 — Confirm post-purchase redirect target
Still in Whop product settings, find the **Redirect URL** or **Success URL** field.

You have two options:

**Option A (recommended — use Whop's default)**: Leave blank. Whop's hosted success page automatically shows the Telegram join button and auto-redirects.

**Option B (custom — use your jjrpro-site success page)**: Set redirect URL to:
```
https://your-jjrpro-site-domain/whop-success?session={CHECKOUT_SESSION_ID}
```
This sends them to your branded success page that embeds the Whop-generated invite link.

For tonight: **leave it blank, use Option A.** It works out of the box. Option B is a polish later.

### Step 5 — Test the full flow with a $0 test purchase
Whop lets you create a test plan or use a "preview" link:

1. In product settings → click "**Preview**" or "**Test Mode**"
2. Open the test checkout URL in incognito (so you're not logged in as the seller)
3. Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
4. Complete checkout
5. **Expected**:
   - Lands on Whop success page within 2 seconds
   - "Join JAURX Channel" button visible
   - Clicking it opens Telegram, accepts invite, joins channel
6. After test: go to **Telegram → JAURX → Administrators** → kick yourself out, or run the cancel flow to verify Whop kicks you when refunded

If the redirect doesn't fire → it's almost always Step 3 (bot not admin or missing permissions).

---

## Most common reasons the redirect "doesn't work"

| Symptom | Cause | Fix |
|---|---|---|
| Success page loads but no "Join Channel" button | Step 1 wrong — access type isn't Telegram | Change access type, save |
| "Join Channel" button → "channel not found" | Step 2 wrong — wrong channel ID | Re-link channel, verify ID is `-1003952631411` |
| "Join Channel" button → invite expired immediately | Step 3 — Whop bot not admin | Add bot as admin with invite + ban perms |
| Customer paid but never lands on success page | Whop webhook failing on Whop's end | Check Whop dashboard → Webhooks → recent events |
| Customer can join channel but cancellation doesn't kick them | Step 3 missing "ban users" perm | Add ban-users perm to Whop bot |

---

## What to do RIGHT NOW

Order of operations:

1. **Open Whop dashboard** → JAURX VIP product → check Steps 1, 2, 4 (3 min)
2. **Open Telegram → JAURX channel → Administrators** → verify Whop bot present with the 3 perms (1 min)
3. **Run the $0 test purchase** in incognito to verify end-to-end (5 min)
4. **If any step fails** → DM the exact error/screenshot to Claude, I'll diagnose

Total time: under 10 minutes. After that, every real purchase will auto-redirect and auto-add the customer to JAURX, no manual work from JR ever again.

---

## If Whop is unfixable — fallback to Stripe DIY

You already have a working Stripe DIY alternative at `projects/jaurx-vip/stripe-diy/`. Its `server.js` handles:
- Stripe checkout webhook (`checkout.session.completed`)
- Generates Telegram invite via your bot
- Returns a custom success page with the invite link

To swap to Stripe DIY:
1. Deploy `stripe-diy/server.js` to Render or Vercel
2. Create Stripe Payment Link for $49/mo recurring → point success URL at deployed server's `/success`
3. Update jjrpro-site CTA buttons to point at Stripe Payment Link instead of Whop checkout
4. Bot patches in `projects/jaurx-vip/bot/bot-vip-patch.js` handle the channel-add side

This is a 30-60 min migration if Whop turns out to be the wrong tool. For now: try the Whop path first since it's already 90% set up.
