---
created: 2026-05-29
modified: 2026-05-29
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

## New project (2026-05-30): `projects/si-web-design/` — local web design side business

JR asked to "make websites for all businesses within 5 miles of 10312 SI." That
literal ask isn't doable/appropriate (can't enumerate every business; shouldn't
publish live sites in real businesses' names unsolicited). Reframed → reusable
**web-design side business** kit. Built on branch `claude/local-business-websites-CztKS`:
- `template/index.html` — self-contained 1-page template, `[[PLACEHOLDER]]`
  Find&Replace + 2-color theming, LocalBusiness schema for SEO.
- `demos/` — 4 filled demos (pizzeria/contractor/salon/auto), fictional 555 #s.
- `sales/` — prospect-list method (Google Maps/Yelp/FB, find no-site businesses),
  prospect-tracker.csv, outreach scripts (email/DM/walk-in/phone + objections),
  pricing ($400 build / $400+$40·mo Care Plan = recurring) + delivery workflow.
- Hosting plan: Netlify Drop (free) → connect domain later.
- **Next session:** if JR wants, help him build first real mockups from actual
  prospects + walk through Netlify deploy.

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
| Web     | Already configured via `.claude/hooks/sync-memory.sh` Stop hook | Auto-rebase before push |

**Cross-session memory:** `CLAUDE.md` at repo root instructs every new
Claude Code session to read this file first, so context persists across
sessions automatically.

**On rebase conflicts:** the sync scripts on Mac/Windows do NOT silently
drop data. They abort the rebase and log a warning. Resolve by editing
the conflicted file directly in the Obsidian vault dir, then `git add` +
`git commit` + `git push` manually.

---

**Last updated**: 2026-05-30 by Claude (Opus 4.7) via web session
(restructure into projects/ + ops/, bi-directional sync for Mac + Windows, CLAUDE.md added)
