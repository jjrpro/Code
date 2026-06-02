# AI Content Packs (DropVault) — Launch & Production Plan

**Date:** 2026-05-31
**Summary:** A faceless, low-maintenance revenue stream. Claude manufactures
the inventory (AI image/video packs), the store sells it on autopilot, buyers
pay by card, it settles to USDC instantly, and Claude monitors every sale from
the cloud. Not tied to JR's trading/Shopify work — runs on its own.

---

## Why this design hits all three of JR's requirements

| JR's ask | How it's met |
|---|---|
| **Easy to maintain** | Digital downloads, no inventory/shipping. Claude generates the product. |
| **Claude fully monitors it** | `monitor.js` reads the Coinbase Commerce API (source of truth) from the cloud each session — sales, revenue, 24h/7d, per pack. |
| **Instant pay, no wait** | Coinbase Commerce settles to **USDC in JR's balance the moment a charge confirms.** No payout schedule. Card buyers auto-convert to crypto. |

---

## The product line (launch catalog)

| Pack | Price | What's in it |
|---|---|---|
| Luxury Lifestyle B-Roll | $19 | 60 cinematic 4K AI clips + 40 stills |
| Dark Minimal 4K Wallpapers | $9 | 100 original 4K wallpapers (phone + desktop) |
| AI Motivation Reel Pack | $29 | 50 vertical 1080×1920 motion clips |
| The Everything Bundle | $49 | All packs + 12 mo of new packs free |

Target buyer: the **faceless-content gold rush** — people running TikTok/Reels/
Shorts/IG theme pages who need fresh b-roll and assets constantly. Evergreen,
broad, nothing to do with trading.

---

## Production pipeline (Claude's recurring job — this is the "maintenance")

Each pack is generated with the media tools (`generate_image`, `generate_video`),
QC'd with `virality_predictor` where relevant, zipped, and dropped in `packs/`.
Cadence: **one new pack/week** keeps the bundle valuable and the store fresh.

### Ready-to-run generation prompts

**Luxury Lifestyle B-Roll** (stills + 4–6s clips):
- "Cinematic aerial of a white yacht cutting through deep blue ocean, golden hour, 4k, anamorphic"
- "Slow dolly through a modern infinity-pool villa at dusk, warm interior lights, no people, luxury real estate"
- "Close-up of a luxury watch on marble, soft window light, shallow depth of field"
- "First-person walk into a private jet cabin, cream leather, morning light"

**Dark Minimal Wallpapers** (stills, phone 1080×2340 + desktop 3840×2160):
- "Minimal dark abstract gradient, deep charcoal to indigo, soft grain, centered negative space"
- "Single neon line over matte black, brutalist minimal, 4k wallpaper"
- "Moody fog over dark mountains, monochrome, lots of empty sky for icons"

**AI Motivation Reels** (vertical 1080×1920 motion):
- "Lone runner on an empty road at sunrise, slow motion, dramatic clouds, vertical"
- "Time-lapse city skyline night to day, vertical, cinematic, space for top/bottom captions"
- "Crashing ocean waves in slow motion, vertical, golden light"

> **Credit note (2026-05-31):** media account is on the **free plan, 10 credits**
> — not enough to generate a full pack. JR confirmed he'll top up. Once credits
> are loaded, Claude runs the prompts above, zips each set, and the store is
> stocked. The store/checkout/monitor are all built and ready now.

---

## Money math (illustrative)

- Cost to produce a pack ≈ credits only (one-time). After that it sells forever.
- 10 sales/wk across packs ≈ $150–250/wk with zero per-sale work.
- Bundle at $49 is the anchor; most buyers land on $9–19 impulse packs.

---

## Status checklist

- [x] Storefront (`public/index.html`) + success/cancel pages
- [x] Checkout via Coinbase Commerce (card → instant USDC)
- [x] Webhook fulfillment + signed, time-limited download links (`server.js`)
- [x] Read-only revenue monitor for Claude (`monitor.js`)
- [x] Setup guide for JR's Mac (`SETUP.md`)
- [x] **Always-on deploy config** — `render.yaml`, `Procfile`, `.env.example`, `DEPLOY.md`
- [x] **Pack-production pipeline** — `packs.manifest.json` (prompts) + `scripts/build-pack.sh` (zip + license)
- [x] **Local end-to-end test passed** — catalog API, health, storefront, and
      download-token gating all verified; fixed a bug where forged tokens
      returned 500 instead of 403 (timingSafeEqual length guard)
- [ ] JR: create Coinbase Commerce account + paste 3 secrets (20 min, see SETUP)
- [ ] JR: top up media credits so Claude can generate the first 3 packs
- [ ] JR: pick hosting path (A: Mac+tunnel for launch / B: Render) — see DEPLOY.md
- [ ] Claude: once credits land, generate inventory → `build-pack.sh` → `packs/`
- [ ] Go live

---

## Next actions

1. **JR:** follow `SETUP.md` steps 1–2 (Coinbase Commerce + secrets).
2. **JR:** top up media credits.
3. **Claude:** generate the first 3 packs from the prompts above; stock `packs/`.
4. **Claude:** run `monitor.js` each session and report revenue.
