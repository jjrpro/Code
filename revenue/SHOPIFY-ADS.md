# Shopify Ad Scale-Up — Weekend Playbook

**Goal**: Move from $22 lifetime spend → first $1K in tracked revenue by Monday EOD.
**Store**: jaurxflips.myshopify.com (TheOneStopShop)
**Products**: 7 magnetic phone wallets, $16.99 / $19.99 / $24.99 tiers
**Socials feeding traffic**: @jaurxshops TikTok + Instagram

---

## ☑ Pre-Flight (Saturday morning, 60 min)

Before you spend a dollar, these MUST be green:

- [ ] **TikTok Pixel + Events API installed** in Shopify (Apps → TikTok → Connect → "Advanced Matching ON")
- [ ] **Meta Pixel + CAPI installed** in Shopify (Apps → Facebook & Instagram → Conversion API ON)
- [ ] **Standard events firing**: `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase` (test with TikTok Pixel Helper + Meta Pixel Helper Chrome extensions)
- [ ] **Shopify abandoned cart email turned on** (Settings → Notifications → Abandoned checkout — sent at 1h and 10h)
- [ ] **Post-purchase upsell app** installed (Shopify free trials: ReConvert, AfterSell, or Zipify OCU). Add 1 upsell at $24.99 wallet for buyers of $16.99 wallet.
- [ ] **Free shipping threshold** set at $35 in Shopify (cart upsell driver)
- [ ] **Trust badges + reviews** on product pages (Loox or Judge.me free tier, import 5-10 AliExpress reviews per product)

---

## ☑ Campaign 1 — TikTok Spark Ads (Saturday, $20/day start)

**Why first**: Cheapest CPMs, your existing @jaurxshops content can be boosted as native ads.

1. **Pick your 3 best-performing organic videos** from @jaurxshops (most likes, comments, saves)
2. In TikTok Ads Manager → Campaign → **Sales objective** → Website → optimize for `Complete Payment`
3. Ad group: Spark Ad → paste the 3 video TikTok URLs
4. Targeting: **US, age 18-44, no interest targeting** (let TikTok algo learn — your pixel data drives it)
5. Budget: **$20/day per ad group**, 3 ad groups = $60/day
6. Bid: Lowest cost, no bid cap
7. Run for 48 hours minimum before judging

**Kill triggers (check 24h in):**
- CPM > $20 → pause that ad group
- CTR < 1% → swap creative
- Spend $40 with 0 ATCs → pause

**Scale triggers (after 48h):**
- ROAS > 1.5 → +50% budget
- ROAS > 2.5 → +100% budget (compound daily)

---

## ☑ Campaign 2 — Meta Advantage+ Shopping (Saturday, $30/day start)

**Why second**: Best for cold purchase intent, Advantage+ does the targeting for you.

1. Meta Ads Manager → **Sales objective** → **Advantage+ Shopping Campaign** (the new ASC+)
2. Budget: **$30/day campaign budget**
3. Audience: leave defaults (Meta picks). Existing customer cap: 20%.
4. Creative: upload **6 variations** — mix of:
   - 1 vertical UGC-style video (15s, problem→demo→price)
   - 2 vertical product carousels (all 7 wallets)
   - 2 single image (lifestyle shots with wallet + phone)
   - 1 collection ad (catalog feed)
5. Placements: Advantage+ (all placements)
6. Run for 72 hours, do NOT touch the dials (Meta's algo punishes early edits)

**Kill triggers:**
- CPM > $35 → diagnostic only, don't pause yet
- 3 days with ROAS < 1 → pause and rethink creative

---

## ☑ Creative Angles (for new posts + ads — Saturday content batch)

Shoot these as 3 vertical videos (15s each, can use phone, post organically + boost):

1. **Demo angle**: "POV: you'll never lose your phone again." Wallet snapped to back of phone, phone slammed on table, picked up by wallet — phone doesn't fall. CTA: link in bio.
2. **Problem-solution**: Show a normal phone case with cards falling out / awkward pocket. Cut to MagSafe wallet snap. "Why did no one make this sooner?"
3. **Social proof**: 3-clip montage of orders being unboxed (use AliExpress unboxing footage if you don't have customer UGC yet — or DM 3 buyers a $5 promo for a 5-second clip).

**Hooks that work for $20 impulse buys** (first 1.5 seconds):
- "Don't buy a wallet until you see this"
- "Replace your wallet for $20"
- "iPhone users — this is for you"
- "TSA's worst nightmare" (humorous)

---

## ☑ Daily Budget Ladder (Sat → Mon)

| Day | TikTok | Meta | Total |
|-----|--------|------|-------|
| Sat | $60 | $30 | **$90** |
| Sun | Hold or 1.5x winners | Hold (algo learning) | **$90-135** |
| Mon | 2x winners only | +50% if ROAS > 1.5 | **$135-200** |

**Total weekend test spend**: ~$315-425. Need ~$700-1000 in revenue to break even on ad spend at your margins.

---

## ☑ Margin Math (know your numbers)

Per $19.99 sale (mid-tier wallet):
- Revenue: $19.99
- AliExpress cost (DSers): ~$3.50
- Shopify Payments fee (2.9% + 30¢): ~$0.88
- **Gross profit per unit: ~$15.61**
- Target CAC: **<$10** (gives ~$5 margin per order)
- Break-even ROAS: **~1.3x**
- Profitable ROAS: **>1.6x**

Bump AOV with the post-purchase upsell — average $24 → $32 order at the same CAC = ROAS jumps 1.5x → 2.0x.

---

## ☑ Daily Check-in Routine (5 min, 2x/day)

Morning (9 AM ET):
1. Open Shopify Analytics → yesterday's sessions, conversion rate, orders, revenue
2. Open TikTok + Meta ads dashboards → spend, ROAS, ATCs
3. Check abandoned cart count — if >10 unrecovered, manually DM 3 via Shopify Inbox

Evening (9 PM ET):
1. Repeat above for today
2. Apply kill/scale triggers from above
3. Log spend + revenue in `marketing_spend.json`

---

## ☑ Stack Multipliers (do these AFTER ads are running, Sun-Mon)

- [ ] Klaviyo free tier → 3-email welcome flow + abandoned cart flow
- [ ] Instagram Shopping tagged posts (link to product pages)
- [ ] TikTok Shop catalog sync (separate workstream — see TIKTOK-SHOP.md)
- [ ] Bundle offer: "Buy 2, save 15%" — automatic in Shopify Discounts

---

## Red Flags / Stop Spending If…

- 24h in with $50+ spent and 0 ATCs across all campaigns → creative is broken, don't keep paying for it
- Shopify conversion rate < 0.5% with 100+ sessions → product page or checkout problem, fix before spending more
- Customer support volume > 5/day → pause and address (you're solo, don't drown)

---

**Last updated**: 2026-05-29
