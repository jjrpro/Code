# DropVault — Distribution Plan (the part that actually makes the money)

**Date:** 2026-06-01
**Saved to:** Obsidian AI Brain (auto-sync)
**One-line summary:** The store is built; this is how it gets *seen* — because a
storefront with no traffic earns $0 regardless of how good the packs are. Plus an
honest reckoning of the real costs and a faster alternative.

---

## The hard truth about this store

Everything technical is done: storefront, card→USDC checkout, auto-delivery,
sales monitor. None of it matters until **buyers find it**. Distribution is
~90% of whether DropVault makes a dollar, and it's the one thing no script
automates away. There are only two ways to get traffic:

- **Pay for it** (ads) — fast, costs money per click, easy to lose money.
- **Earn it** (organic posting) — free, slower, needs consistent content.

Since the whole point is *no money*, this plan is **100% organic**.

---

## The real cost stack (so there are no surprises)

| Cost | Amount | Required? |
|---|---|---|
| Media credits to make packs | $49/mo (PLUS) — subscription, no one-time option | **Yes** — can't generate inventory without it |
| Coinbase Commerce | Free | Yes (the payout rail) |
| Hosting | Free tier (Render) or your Mac + ngrok | Yes |
| Domain (optional) | ~$12/yr | No — can launch on a free URL |
| Ads | $0 in this plan | No |

So the honest floor is **one $49 subscription month** to manufacture the launch
inventory. If it doesn't sell, you cancel after one month. That's the real risk:
~$49, not $0.

---

## Who we're selling to (be specific or the posts flop)

**Faceless content creators** — people running TikTok/Reels/Shorts/IG theme
pages who burn through b-roll and need fresh assets weekly. They already hang
out in known places. We go to them; we don't wait for them.

---

## Where to post (free, high-intent communities)

| Channel | Why it works | Cadence |
|---|---|---|
| **Reddit**: r/NewTubers, r/SideProject, r/juststart, r/podcasting (b-roll), r/faceless | High concentration of exact buyers; allow value-first posts | 2–3 value posts/wk, soft mention |
| **TikTok / Reels** (DropVault's own page) | Post a 10s clip *from* a pack as a demo — the product sells itself | 1 clip/day from existing inventory |
| **Pinterest** | Wallpapers + cinematic stills rank for years; links straight to store | 5 pins/day, automatable |
| **X / Threads** | "I made 100 4K wallpapers with AI, grab the pack" + sample grid | 1 post/day |
| **Gumroad / itch.io listing** | Built-in marketplace discovery + handles payment for you | One-time list |

> The clever part: the **packs are their own ads.** Every clip we post to grow the
> DropVault TikTok is literally a sample of the product. Content production and
> marketing are the same action.

---

## A faster, lower-friction alternative worth considering

The custom Coinbase store gives you instant USDC and full control — but **zero
built-in audience**. A digital marketplace like **Gumroad** solves *both* the
payment-rail AND the discovery problem in one move: buyers browse it already,
and it handles checkout/delivery without the Coinbase setup.

Trade-off: Gumroad takes a fee and pays out on a schedule (not instant USDC).
But for *getting the first sale*, marketplace discovery beats a custom store with
no traffic. **Recommendation:** list the same packs on Gumroad as the front door,
keep the Coinbase store as the "no-fee, instant" option for repeat buyers. I can
build the Gumroad listing copy for free the moment packs exist.

---

## The launch sequence (once credits are funded)

1. **Claude** generates the 3 packs (run the prompts in `packs.manifest.json`).
2. **Claude** zips them via `scripts/build-pack.sh`, stocks `packs/` + `img/`.
3. **JR** does the Coinbase Commerce setup (20 min, `SETUP.md`) OR I set up Gumroad copy.
4. **Claude** writes 14 days of launch posts (Reddit/TikTok/Pinterest) — pre-loaded.
5. Go live; **Claude** runs `monitor.js` each session and reports revenue here.

---

## What I need from you to start manufacturing

Only one thing blocks the entire pipeline: **funded media credits.** Until then
I literally cannot generate a single asset. Everything else, I can prep for free.
