# Weekend Sprint — Sat May 30 → Mon June 1

One-page execution checklist. Print this. Tick boxes as you go.

---

## SATURDAY (~5 hrs total)

### Morning block (90 min — coffee, no socials open)
- [ ] Run `git pull` on your Mac in `/Users/johnreilly/trading-bot/` (or wherever you keep this repo) to get the new `revenue/` docs
- [ ] Read `revenue/SHOPIFY-ADS.md` Pre-Flight section, do all 7 checks
- [ ] Read `revenue/VIP-LAUNCH.md` Path A (Whop) Saturday section
- [ ] Verify TikTok Pixel + Meta CAPI firing via Chrome pixel helpers

### Midday block (2 hrs)
- [ ] Sign up at whop.com/sell with admin@jjrproconsultants.com
- [ ] Create "JaurxTrades VIP" Whop
- [ ] Create private Telegram channel, add @JaurxBot as admin
- [ ] Get channel ID via @userinfobot, paste into `bot.js` as `VIP_CHANNEL_ID`
- [ ] Apply patches from `revenue/bot-vip-patch.js` to bot.js
- [ ] Restart bot, test `/vip Hello world` from your DM

### Afternoon block (90 min)
- [ ] Launch TikTok Spark Ads — 3 ad groups @ $20/day = $60/day
- [ ] Launch Meta Advantage+ Shopping — $30/day, 6 creatives
- [ ] Shoot 3 new vertical videos for @jaurxshops (demo, problem-solution, social proof)

### Evening (30 min)
- [ ] Check ad stats — kill anything with CPM > $20 / CTR < 1%
- [ ] Log Saturday spend in `marketing_spend.json`

---

## SUNDAY (~3 hrs)

### Morning (30 min)
- [ ] Check overnight Shopify orders + ad ROAS
- [ ] Apply scale/kill triggers per `SHOPIFY-ADS.md`

### Midday (90 min)
- [ ] DM founders offer ($29 lifetime) to 20 most active JaurxTrades free group members
- [ ] Schedule launch announcement for 7 PM ET in the free group (use the template in `VIP-LAUNCH.md`)
- [ ] Pin a teaser in the free group: "VIP opens tonight at 7 PM ET"

### Evening (60 min)
- [ ] 7 PM: post launch announcement
- [ ] First trade alert into VIP channel (if you take one) — use `/vip` or auto via bracket
- [ ] Pin welcome + disclaimer post in VIP channel
- [ ] Drop morning bias for Monday: `/vipbias MGC: watching X. MNQ: watching Y.`

---

## MONDAY (~2 hrs)

### Pre-market (30 min)
- [ ] Post morning bias to VIP via `/vipbias`
- [ ] Check Whop dashboard — how many subs? DM each one personally to welcome
- [ ] Check overnight Shopify revenue vs ad spend

### Midday (60 min)
- [ ] Take 1 high-conviction VIP trade (your bracket auto-broadcasts via the patch)
- [ ] Apply ad scaling per `SHOPIFY-ADS.md` (winners +50-100%, losers off)

### Evening (30 min)
- [ ] Tally results:
  - VIP subs: ___ × $49 (or $29) = $___ MRR
  - Shopify revenue today: $___
  - Ad spend today: $___
  - Net cash flow today: $___
- [ ] Decide: scale, hold, or pivot for Tuesday

---

## Success Bar by Monday EOD

- ✅ 5+ VIP subs ($245+ MRR)
- ✅ $300+ in Shopify revenue across the weekend
- ✅ TikTok or Meta campaign showing ROAS > 1.5
- ✅ Bot patched and broadcasting VIP trades reliably

**If you hit all 4**: you've proven both streams. Tuesday's job is to compound.
**If you hit 2-3**: still a win. Iterate on what didn't.
**If you hit 0-1**: ping me Monday night, we re-strategize Tuesday.

---

## Things That Can Sink You — Avoid

- ⚠️ Don't redesign the Shopify store this weekend. Ad money first, polish later.
- ⚠️ Don't promise specific returns in the VIP launch copy. "Educational only. NFA." every post.
- ⚠️ Don't touch Meta campaigns in the first 72 hours after launch — the algo is learning.
- ⚠️ Don't open the Whop landing page to public DMs for support — route everything through the VIP channel or a single support email.
- ⚠️ Don't manually onboard VIP subs if Whop is auto-handling it — let the platform work.

---

**Sprint window**: Sat 8 AM ET → Mon 11 PM ET
