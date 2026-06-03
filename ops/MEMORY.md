---
created: 2026-05-29
modified: 2026-06-02
tags:
  - jaurx
  - vip
  - telegram
  - shopify
  - whop
  - session
  - revenue
status: in-progress
session: jaurx-launch-2026-05-29
---

# JAURX Launch Session — 2026-05-29 → 30

> Comprehensive memory of everything built and decided during the JAURX
> revenue launch session. Drop into [[Obsidian vault]] or copy to
> `~/.claude/projects/-Users-johnreilly/memory/` to bring future Claude
> sessions up to speed.

---

## JR's standing preferences

- **Save every deliverable as a dated file.** Anything JR asks for —
  analysis, copy, plans, walkthroughs, lists, recommendations — must be
  saved as `YYYY-MM-DD-descriptive-kebab-name.md` in the most relevant
  `projects/<name>/` subdir (or `ops/sessions/` if cross-project), not
  just in chat. Files auto-sync to his Obsidian vault on Mac + Windows
  within 60 seconds. Set: 2026-05-30. (See CLAUDE.md for the
  full convention.)

---

## TL;DR — what was accomplished

- ✅ Created **JAURX** private Telegram channel — ID `-1003952631411`
- ✅ Posted founder-pledge welcome message (locks in free founders for life)
- ✅ Renamed Shopify store from `TheOneStopShop` to **JaurxShops**
- ✅ Installed apps: Klaviyo, Judge.me, Upsell.com (ex ReConvert), TikTok, Meta (CAPI)
- ✅ Built full revenue stack in repo `jjrpro/code` on branch `claude/jjr-ops-handoff-QHQJj`
- ⏳ Whop setup partial — past apps screen, pricing pending
- ⏳ bot.js VIP patch not yet applied (terminal error, never debugged)
- ⏳ Domain purchase pending — recommend `jaurxshops.com`

---

## JAURX Auto-Trading — Execution Status (2026-06-02) ⚠️ READ BEFORE TRADING

**Hard fact: JAURX has NEVER placed a real trade on Tradovate. Zero orders,
zero fills, zero money won or lost.** Verified by reading the full 1.7MB
session transcript — **0 broker order IDs** exist in our entire history.

- The "wins" JR remembers are from the **`backtest` command** (simulated
  historical performance — appears 322× in transcript). A backtest is a flight
  simulator, not a flight. **There is no pile of winnings and no open position.**
  Do NOT validate the belief that trades were executed — it's financially
  dangerous and untrue. Be kind but firm on this.
- **The ONLY blocker is the Tradovate API Access add-on ($25/mo)**, on a live
  account funded $1k+. It mints `cid` + `sec`. This is a hard lock on
  Tradovate's side — applies to this system, any bot, and TradingView alike.
- **Network is fine:** this container reaches `demo/live.tradovateapi.com`
  (~0.01s). Once the key exists, orders place directly from here.
- **Built & ready:** `config/credentials.json` (gitignored — has JR's
  username/password `LTT6RQJB360`; needs appId/cid/sec). `bridge/pipeline.py
  execute` is the real order path — preflight-refuses without the key (verified),
  defaults to DEMO, prints real order IDs on success. Run:
  `python3 -m bridge.pipeline execute MGC BUY 4507 4485 4540,4575,4610`
- **Full detail:** `projects/jaurx-trading/2026-06-02-jaurx-execution-status-and-truth.md`
- **Next step (JR):** activate API Access → paste appId/cid/sec → I run `execute`
  on DEMO first, then LIVE only on explicit say-so.

NOTE: This `jaurx-trading` project is on branch `claude/epic-maxwell-KhURK`
(separate from the `jjr-ops-handoff-QHQJj` vault branch). Full bridge:
data engine, ML, decision brain, position sizer, alert formatter, Tradovate
client, 11 skills, 5 workflows.

---

## Faceless AI video channel — Cinematic Curiosities (2026-05-31)

Second Claude-run revenue stream. Faceless YouTube Shorts + TikTok channel,
60–90s AI mini-docs ("Cinematic Curiosities" niche). Designed to pass YouTube's
2026 "inauthentic content" rule via **original written script + original AI
visuals** (the key design choice). Claude runs production (script→manifest→
render→score→package→handoff); platforms pay JR directly into his AdSense/bank.
Lives in `projects/faceless-channel/`.

- **Built now (no credits needed):** blueprint saved, `calendar.json` (30
  topics), `PIPELINE.md` runbook + autopilot design, `video.manifest.example.json`
  format, 3 sample scripts + SCRIPT-TEMPLATE, publish-sheet template.
- **Blocked on JR:** (1) create dedicated Google/YouTube/TikTok accounts THIS
  WEEK (starts the 6-month monetization clock); (2) fund media credits — free
  plan / 10 credits can't render even one video.
- **Realistic money:** monthly AdSense, first deposit ~5–7 months out after
  ramp; Shorts RPM $0.03–0.10 = volume game. Not week-one cash.
- **Name LOCKED: "Curious Frame"** — tagline "One new wonder a day." Paste-ready
  account kit (handles, bios, About text, visual signature) in `BRAND.md`.
- **DONE 2026-05-31:** all 30 scripts pre-written (`scripts/dayNN-*.md`),
  calendar marked `scripted`, BRAND kit ready. JR funds credits "first thing in
  the morning"; then Claude renders + sets up daily autopilot trigger.
- **AUTOPILOT BUILT (2026-05-31):** JR has accounts; wants full automation, Claude
  controlling it. Locked architecture: **YouTube Data API** (full-auto publish) +
  **always-on Render host** w/ daily cron. Built in `projects/faceless-channel/auto/`:
  `youtube.js` (resumable upload, refresh-token auth — no passwords), `generate.js`
  (render+stitch seam), `build-manifest.js` (script→beats, tested), `run-daily.js`
  (daily loop, dry-run tested), `server.js` (+/cron/daily,/status), `render.yaml`
  (web+cron), `get-youtube-token.js` (one-time OAuth), `SETUP-AUTOMATION.md`.
  All 30 calendar items now carry curated publish copy (title/desc/hashtags/thumb).
- **Honest limits told to JR:** no persistent 24/7 "Claude" — it's a scheduled
  machine on Render that I drive/maintain each session. Two steps are unavoidably
  JR's: (1) fund media credits, (2) one-time YouTube OAuth grant (mints refresh
  token → Render secret). The 3 model-call fns in generate.js are intentionally
  stubbed until the funded account's API surface is known (~30-line final wire).
- **Next:** JR funds + does OAuth → Claude wires renderClip/Voice/Thumbnail, runs
  ONE real test video, then enables the cron. TikTok/IG via authorized scheduler later.
- **Funding (live pricing pulled 2026-05-31):** media plans — PLUS $39/mo annual
  (1,000 cr) / ULTRA $99/mo annual (3,000 cr ⭐). A mini-doc ≈ 50–90 cr; ULTRA ≈
  ~1 polished video/day. Checkout links in `2026-05-31-curious-frame-launch-checklist.md`.
  NOTE: no video/thumbnail rendered yet — free plan, 10 cr. Don't overstate it.
- **AUTHORITATIVE publish copy:** `2026-05-31-curious-frame-launch-pack.md` holds
  all 30 videos fully packaged (hook, script, title, description, hashtags,
  thumbnail) + final branding (tagline "One wonder a day", handle @curiousframe,
  navy/cyan palette). Scripts reconciled to it (Day 11=Maya/Copán, 23=Tutankhamun,
  25=+cenote, 2=+67k mph). Per-beat visual prompts still TODO at render time.
- **Relation to DropVault:** both gated on the same media-credit top-up. Two
  parallel AI-content revenue streams; JR to say whether to run both or focus one.

---

## New revenue stream — DropVault AI content packs (2026-05-31)

Built a faceless, Claude-maintained store: AI image/video content packs sold on
autopilot. Buyer pays by card → settles to **USDC instantly** via Coinbase
Commerce (no payout wait). Claude monitors every sale with `monitor.js` (reads
the Commerce API from the cloud). Lives in `projects/ai-content-packs/` on branch
`claude/eloquent-gates-kLzps`. Deliberately NOT tied to JR's trading/Shopify —
runs independently. Why this design: it's the only combo that hits all three of
JR's asks (easy maintain + Claude monitors + instant pay).

- **Built & syntax-checked:** storefront, Coinbase Commerce checkout, webhook
  fulfillment + signed download links, `monitor.js`, `SETUP.md`, launch plan.
- **Blocked on JR:** (1) make Coinbase Commerce acct + paste 3 secrets (~20 min,
  see SETUP.md); (2) top up media credits — account is free plan / 10 credits,
  not enough to generate a full pack. JR said he'll load money later.
- **Next for Claude:** once credits loaded, run the gen prompts in
  `2026-05-31-ai-content-packs-launch-plan.md`, zip packs into `packs/`, go live;
  then run `monitor.js` each session and report revenue.

---

## Channel Details — JAURX

| Field | Value |
|---|---|
| Name | JAURX |
| Channel ID | `-1003952631411` |
| Type | Private channel (broadcast only) |
| Admins | Owner (JR) + need to add @JaurxBot + Whop bot |
| Status | Live, welcome posted, needs pin |

### Welcome message text (posted)
```
🎯 Welcome to JAURX

This channel is for live MGC + MNQ trade alerts — entries,
stops, and targets, posted the moment I take them. Plus a
daily bias before NY open and a weekly recap.

Public launch price: $49/mo via Whop, going live shortly.

📌 If you're already in this channel right now — you're locked in.
Founder status. No charge. Full access for life. You will not lose
access when paid subscriptions open.

Educational and entertainment only. NFA.
— John
```

### Pinning status
- Welcome message → needs to be pinned manually (long-press → Pin)
- Disclaimer → needs separate post + pin (text in [[#Disclaimer text]] below)

---

## Pricing Strategy

| Tier | Price | Plan ID | Visibility | Limit |
|---|---|---|---|---|
| VIP Monthly | $49/mo | (pending Whop) | Public | none |
| Founders Lifetime | $29/mo | (pending Whop) | Hidden link | 25 spots |

**Logic**: $29 founders rate creates scarcity + saves $20/mo forever (FOMO),
$49 public price is below the "I need to think about it" threshold for
retail traders.

---

## Repo Structure — `jjrpro/code` branch `claude/jjr-ops-handoff-QHQJj`

```
projects/
├── jaurx-vip/                       # Telegram trade-alerts monetization
│   ├── launch/
│   │   ├── VIP-LAUNCH.md            # $49/mo Telegram VIP launch playbook (Whop)
│   │   ├── whop-launch-pack.md      # paste-ready content for every Whop screen
│   │   └── launch-copy.md           # copy-paste-ready: welcome, disclaimer, FAQs
│   ├── bot/
│   │   ├── bot-vip-patch.js         # bot.js snippets (sendVIP, /vip, etc.)
│   │   └── patch-bot.js             # one-shot bot.js auto-patcher (idempotent)
│   └── stripe-diy/                  # DIY Stripe + Telegram alternative to Whop
│       ├── SETUP.md
│       ├── server.js                # Express webhook + Telegram invite gen
│       ├── package.json
│       ├── bot-stripe-patch.js      # chat_member event handler
│       └── public/
│           ├── index.html           # Stripe Payment Link landing
│           ├── success.html         # post-payment thank-you w/ invite link
│           └── cancel.html
├── shopify-dropship/                # Magnetic phone wallet store
│   ├── SHOPIFY-ADS.md               # TikTok Spark + Meta Advantage+ ad scale-up
│   ├── shopify-audit.md             # 18-point self-diagnostic checklist
│   └── shopify-playbook.md          # blind playbook for magnetic wallet dropship
├── local-638/                       # Steamfitters website template
│   └── index.html
└── trade-analysis/                  # Research / setups
    └── xauusd-bearish-2026-05-29.md # Sample: full bearish gold thesis + R:R

ops/                                  # Shared infrastructure (not project work)
├── MEMORY.md                         # this file — cross-project state
├── WEEKEND-CHECKLIST.md              # hour-by-hour Sat-Mon execution
├── obsidian-sync/                    # Mac LaunchAgent for Obsidian Git sync
└── diagnostics/                      # mac-check.sh / mac-fix.sh
```

To sync on Mac:
```bash
git clone -b claude/jjr-ops-handoff-QHQJj https://github.com/jjrpro/code ~/jjr-ops
# or if already cloned:
git pull origin claude/jjr-ops-handoff-QHQJj
```

---

## Shopify Status

### Brand identity
- **Old**: `TheOneStopShop` brand, `jaurxflips` URL, `@jaurxshops` socials (3-way split, conversion killer)
- **New**: `JaurxShops` across the board — renamed ✅
- **Domain**: pending purchase (`jaurxshops.com` recommended, $14/yr)

### Installed apps
1. **Upsell.com (ex ReConvert)** — post-purchase upsell — needs setup
2. **Judge.me Reviews** — chose over Loox (better free tier) — needs review import
3. **Klaviyo Email + SMS** — needs welcome + abandoned cart flows enabled
4. **DSers-AliExpress** — fulfillment (pre-existing)
5. **TikTok** — pixel + CAPI ✅ installed
6. **Facebook & Instagram (Meta)** — pixel + CAPI ✅ installed
7. **Messaging** (Shopify Inbox) — customer chat
8. **jaurxbotzzz** — custom app JR built (leaving alone)

### Pending Shopify actions
- Buy `jaurxshops.com` domain → set as primary
- Configure Judge.me — import 10-15 AliExpress reviews per product (mix 4★ and 5★)
- Configure Klaviyo — enable welcome flow + abandoned cart flow
- Configure Upsell.com — set up 1-click post-purchase upsell ("Add 2nd wallet, 25% off")

### Product catalog
- 7 SKU magnetic MagSafe wallets
- Price tiers: $16.99 / $19.99 / $24.99
- Pricing decision pending: keep tiered if products differ, flatten to $19.99 if identical

---

## bot.js Patcher

### What it does
Idempotent script at `projects/jaurx-vip/bot/patch-bot.js` that:
1. Backs up `bot.js` with timestamp
2. Inserts `VIP_CHANNEL_ID = -1003952631411` + helper constants
3. Inserts `sendVIP()` and `sendVIPPhoto()` functions
4. Inserts `/vip` command handler
5. Syntax-checks, rolls back on failure
6. Prints restart commands

### How to run (on Mac)
```bash
gh api repos/jjrpro/code/contents/projects/jaurx-vip/bot/patch-bot.js?ref=claude/jjr-ops-handoff-QHQJj \
  -H "Accept: application/vnd.github.raw" > /tmp/patch-bot.js && node /tmp/patch-bot.js
```

### Status
- ⚠️ JR attempted, hit a terminal error, never pasted error back for debug
- **Next session priority**: get this patch applied so `/vip` and bracket
  auto-broadcast work

---

## Cloud Sandbox Constraints (Important)

This Claude Code on the web session runs in an ephemeral container.
**Cannot reach** (egress-blocked):
- `api.telegram.org`
- `jaurxflips.myshopify.com` (any *.myshopify.com)
- `web.archive.org`

**Can reach**:
- GitHub (via `gh` and `mcp__github__*` tools)
- General web (most domains via WebFetch/WebSearch)

**Implication**: any Telegram or Shopify storefront action MUST be
executed on JR's Mac, not from web Claude. Web Claude can only write
code/docs/scripts that JR runs locally.

---

## Tonight's Operational Decisions

- **Telegram channel type**: Channel (broadcast only) over Group or Channel+Group
  - Reason: cleaner signal feed, easier moderation, industry standard for paid signals
- **Payment platform**: Whop over DIY Stripe for launch
  - Reason: 15-min setup vs 4-6 hr deploy. Whop handles invite/kick automatically.
  - DIY Stripe stack built and ready for migration in week 2-3.
- **Brand**: JaurxShops over TheOneStopShop or jaurxflips
  - Reason: matches existing @jaurxshops social handle (biggest equity)
- **Reviews app**: Judge.me over Loox
  - Reason: Judge.me has unlimited free tier, Loox caps at 100 orders/mo free

---

## Disclaimer text (for pinned post in JAURX)

```
⚠️ DISCLAIMER — PLEASE READ

JAURX is an educational and entertainment service. Nothing posted
here is financial, investment, or trading advice.

Futures and derivatives trading involves substantial risk of loss
and is not suitable for everyone. Past performance is not indicative
of future results.

You are solely responsible for your own trading decisions and outcomes.
Consult a licensed financial advisor before making investment decisions.

By being in this channel, you acknowledge these terms.

— John Reilly, JAURX
```

---

## Open Action Items (prioritized)

### Immediate (do now / next session)
1. Pin the welcome message in JAURX
2. Post + pin the disclaimer (above) in JAURX
3. Finish Whop setup — add Telegram app, connect bot to JAURX, set $49 + $29 pricing
4. Apply bot.js patcher on Mac (debug terminal error first)
5. Buy `jaurxshops.com` domain

### Short-term (this weekend)
6. Configure Judge.me — import AliExpress reviews per product
7. Configure Klaviyo — enable welcome + abandoned cart flows
8. Configure Upsell.com — set up post-purchase upsell
9. DM 20 most engaged free JaurxTrades group members with $29 founders link
10. Sunday 7 PM ET — post public launch announcement in free group
11. Monday 7:30 AM ET — post first morning bias to JAURX

### Medium-term (week 2-3)
12. Migrate from Whop to DIY Stripe stack (if Whop's 3% fee bites)
13. Launch annual VIP plan ($490/yr = 2 months free)
14. Free 7-day trial to lower VIP friction
15. Affiliate program — 30% recurring commission for sub referrals
16. Case study post: "VIP results month 1"

---

## Success Metrics — by Monday EOD

- ✅ 5+ paid VIP subs (≥$245 MRR)
- ✅ $300+ Shopify revenue over the weekend
- ✅ At least 1 ad campaign with ROAS > 1.5
- ✅ bot.js patched and broadcasting brackets to JAURX

---

## Related Notes

- [[bot.js architecture]]
- [[Tradovate REST patterns]]
- [[Whop vs Stripe DIY tradeoffs]]
- [[Shopify magnetic wallet niche]]
- [[Founders pricing psychology]]

---

## Where to find this file

- **GitHub**: `jjrpro/code` → branch `claude/jjr-ops-handoff-QHQJj` → `ops/MEMORY.md`
- **Auto-synced** to the Obsidian vault every 60s on both Mac and Windows
  via the bi-directional sync loop (see "Sync architecture" below)
- **Pull manually** (any platform): `git pull origin claude/jjr-ops-handoff-QHQJj`

---

## Sync architecture (bi-directional, all sessions)

The flow is symmetrical — edits on any side reach every other side within
about 60 seconds, with rebase-on-conflict to avoid push rejection.

```
                ┌───────────────────────┐
                │  GitHub: jjrpro/code  │
                │   branch jjr-ops-…    │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    push/pull           push/pull           push/pull
    every 60s           every 60s           every 60s
        │                   │                   │
        ▼                   ▼                   ▼
  ┌──────────┐        ┌──────────┐        ┌─────────────────┐
  │  Mac     │        │ Windows  │        │ Claude Code Web │
  │ Obsidian │        │ Obsidian │        │   (Stop hook)   │
  └──────────┘        └──────────┘        └─────────────────┘
```

**Per-platform install (one-time):**

| Platform | Installer | Mechanism |
|---|---|---|
| Mac     | `bash ops/obsidian-sync/install-mac-sync.sh`         | LaunchAgent + `jjr-obsidian-sync-loop.sh` |
| Windows | `powershell -ExecutionPolicy Bypass -File ops/obsidian-sync/install-windows-sync.ps1` | Scheduled Task + `jjr-obsidian-sync-loop.ps1` |
| Web     | Already configured via `.claude/hooks/sync-memory.sh` Stop hook | Auto-rebase + **permanent vault mirror** |

**Permanent vault branch (the fix for branch churn):** every web session runs
on its own throwaway branch (`claude/<random>`), but Mac/Windows only pull ONE
fixed branch — `claude/jjr-ops-handoff-QHQJj`, now the canonical **vault branch**.
The Stop hook (`sync-memory.sh`) mirrors whatever session branch it's on INTO the
vault branch on every sync (fast-forward, or merge if the vault moved). So new
work can never again land on a branch the vault doesn't watch, and JR never has
to touch his Mac/Windows config. To repoint the vault branch, change
`VAULT_BRANCH` in `sync-memory.sh` (and the installers) — that's the only knob.

**Cross-session memory:** `CLAUDE.md` at repo root instructs every new
Claude Code session to read this file first, so context persists across
sessions automatically.

**On rebase conflicts:** the sync scripts on Mac/Windows do NOT silently
drop data. They abort the rebase and log a warning. Resolve by editing
the conflicted file directly in the Obsidian vault dir, then `git add` +
`git commit` + `git push` manually.

---

## CLAURX personal-assistant build — 2026-06-03

New project `projects/claurx/`. JR's JARVIS-style assistant persona, finalized.
- `2026-06-03-claurx-system-prompt-and-build-checklist.md` — the copy-paste
  CLAURX system prompt (butler voice, SPEED default, act-with-confirm, $50
  auto-purchase, 11AM briefing) + hybrid build plan (cloud brain, private
  memory). Both open decisions resolved: butler sign-offs kept, hybrid approved.

**Phase 1 — Shopify (`projects/claurx/shopify/`):** read-only Node CLI built and
PROVEN live against `jaurxflips` — today's orders+revenue, low-stock, $16.99/
$19.99/$24.99 tier check, 7-day trend. EST boundaries, no writes.
- Shopify killed permanent `shpat_` tokens (Jan 2026); the app is a dev-dashboard
  custom app, so the script mints a 24h token via OAuth **client-credentials**
  (`SHOPIFY_CLIENT_ID` + `SHOPIFY_CLIENT_SECRET` in git-ignored `shopify.env`).
- **BLOCKED on one Shopify-side step:** scopes (`read_inventory/orders/products`)
  are configured + released on version `claurx-read-only-2` but **not granted** —
  all calls 403 "requires merchant approval." JR must **install/approve the app
  on JaurxShops from the store admin**. Full details + exact next step:
  `projects/claurx/shopify/2026-06-03-shopify-status-and-next-step.md`.
- **Security debt:** the client secret was exposed in setup screenshots — rotate
  it once more and update `shopify.env`. `read_orders` also needs "Protected
  customer data access" approval (PII gate) before revenue pulls work.

---

**Last updated**: 2026-05-30 by Claude (Opus 4.7) via web session
(restructure into projects/ + ops/, bi-directional sync for Mac + Windows, CLAUDE.md added)
