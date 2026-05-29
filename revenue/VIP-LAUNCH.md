# JaurxTrades VIP — $49/mo Telegram Tier Launch

**Goal**: Soft-launch by Monday EOD. First 10 paid subs = $490 MRR.
**Pricing**: $49/mo recurring, no annual upfront.
**Founders offer (first 25 only)**: $29/mo lifetime lock-in.

---

## What VIP Subscribers Get (the actual offer)

This is what justifies $49/mo. Be specific or no one buys.

1. **Real-time trade alerts** — entry + SL + TP posted to private channel as you take them (your bot already does this; just need to point it at the VIP channel)
2. **Daily morning bias post** — 1-paragraph plan on MGC + MNQ before market open
3. **Weekly recap video/post** — what worked, what didn't, screenshots of fills
4. **Access to John in DMs** — limited to "ask a question, get a reply within 24h"
5. **Educational drops** — your zones/FVG methodology, 1-2 mini lessons per month

**NOT promised**: profit guarantees, signal accuracy %, hand-holding. Keep the floor low — you don't want needy refunders.

---

## Path A — Whop (RECOMMENDED for Monday launch)

Whop is built for exactly this. They handle payments, recurring billing, refunds, auto-grant/revoke Telegram access. Fee: ~3% + $0.30/transaction. Worth it for the time saved.

### Saturday (60 min total)

1. **Sign up at whop.com/sell** with admin@jjrproconsultants.com
2. **Create a Whop**: "JaurxTrades VIP"
3. **Create a NEW private Telegram channel** (not the existing group):
   - Open Telegram → New Channel → "JaurxTrades VIP" → Private
   - Add @JaurxBot as admin with "Post Messages" + "Invite Users" perms
   - Copy the channel ID (forward a message from it to @userinfobot to get the `-100xxx` ID)
4. **Connect the channel to Whop**:
   - In Whop dashboard → Apps → Telegram → connect your bot account → select the new private channel
   - Whop will auto-invite paying subs and kick non-payers
5. **Set pricing**:
   - Plan 1: "VIP Monthly" — $49/mo
   - Plan 2 (limited, manual): "Founders Lifetime" — $29/mo, hidden link, share only with first 25 buyers via DM
6. **Customize Whop landing page**:
   - Headline: "Live MGC & MNQ Trades. Posted As I Take Them."
   - Bullets: copy from "What VIP Subscribers Get" above
   - Add 3-5 screenshots of recent winning trades (use Tradovate position screenshots)
   - Add disclaimer footer (see below)
7. **Get your Whop checkout URL** — looks like `whop.com/jaurxtrades-vip/`

### Sunday (90 min)

1. **Write launch announcement** for the existing JaurxTrades free group. Schedule for Sunday 7 PM ET:
   ```
   Big news — we're opening JaurxTrades VIP. 🎯

   For the first time, my live MGC + MNQ entries go to a private
   channel. Same setups I've been calling here, posted the second I
   take them — entry, SL, TP, position size, all of it.

   First 25 founders lock in $29/mo for life. After that, $49/mo.

   Link: whop.com/jaurxtrades-vip/
   Founders code in DM if you want it.

   *Not financial advice. Past performance ≠ future results.
    Trade your own size.*
   ```
2. **DM your most engaged free group members first** (anyone who's interacted in the last 30 days). Offer the $29 founders link directly. 5-10 of these convert > 100 cold checkout clicks.
3. **Post on @jaurxshops Instagram + TikTok** with a short pinned story: "Live trade alerts now open — link in bio." (TikTok algo doesn't love finance content; keep posts about Shopify.)

### Monday (30 min)

1. **Patch bot.js** to broadcast trades to the VIP channel (see `bot-vip-patch.js`)
2. **First VIP-only trade goes live** — make it count. Pick a high-conviction MGC or MNQ setup.
3. **Pin a welcome post** in the VIP channel:
   - "Welcome. Trades drop here. Pinned post = current open positions. Daily bias every morning at 8 AM ET. Questions → DM John."

---

## Path B — DIY Stripe + bot.js (full ownership, more code)

Use this if Whop's 3% fee or platform risk bothers you. **Adds ~4 hrs of dev time.**

Architecture:
```
Customer → Stripe Checkout → Stripe webhook → bot.js webhook handler
   → bot.js generates 1-time Telegram invite link → emails customer
   → on subscription.deleted webhook → bot.js kicks user from VIP channel
```

Files:
- `stripe-checkout.html` — hosted checkout page (Vercel/Netlify)
- `bot-vip-patch.js` — webhook endpoint + invite/kick logic added to bot.js
- Stripe Customer Portal — handles cancels/card updates (free, hosted by Stripe)

I'd write this if you want — say the word and I'll commit it. But **for "functional by Monday" I strongly recommend Path A (Whop)**. You can migrate to DIY later once you have proof of demand and want to keep the 3%.

---

## Pricing Psychology Cheat Sheet

- **$49/mo** = below the "I need to think about it" threshold for most retail traders (~$60+)
- **Founders $29 lifetime** = scarcity + saves you $20/mo forever, classic FOMO
- **No annual upfront option at launch** — keeps refund liability low while you prove cadence
- **Add annual ($490/yr = 2 months free) at month 2** once retention data is in

---

## Compliance / Disclaimer (PIN this everywhere)

```
DISCLAIMER: JaurxTrades VIP is an educational and entertainment service.
Nothing posted here constitutes financial, investment, or trading advice.
Futures and derivatives trading involves substantial risk of loss. Past
performance is not indicative of future results. You are solely responsible
for your own trading decisions and outcomes. Consult a licensed financial
advisor before making investment decisions.
```

Add this to:
- Whop landing page footer
- Pinned post in VIP channel
- Your Instagram bio (one line: "Educational only. NFA.")
- Bot.js auto-reply to /disclaimer command

---

## What Success Looks Like by Monday Night

- ✅ 5+ paid VIP subs ($245+ MRR)
- ✅ At least 1 VIP-only trade posted from the bot
- ✅ Founders offer DM'd to 20+ free group members
- ✅ Stripe/Whop dashboard showing live recurring subscriptions

**If you have 0 subs by Monday**: the offer doesn't suck, the distribution does. Push harder to your free group and DM list before discounting.

---

## Next 30 Days (after Monday)

- Week 2: launch annual plan ($490/yr)
- Week 2: add free 7-day trial to lower friction
- Week 3: affiliate referral — 30% recurring commission for anyone who brings paid subs
- Week 4: case study post: "VIP results month 1" — uses real screenshots, drives next cohort

---

**Last updated**: 2026-05-29
