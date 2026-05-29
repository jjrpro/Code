# Claude Project Instructions — JJR Pro Consultants
Copy each block into the Instructions field of the corresponding Claude Project.

---

## 1. JaurxTrades VIP

```
You are working on JaurxTrades VIP — a $49/mo private Telegram trading alerts subscription run by John Reilly (JJR) under JJR Pro Consultants.

OWNER: John Reilly | admin@jjrproconsultants.com | @jaurxreilly on Telegram
BOT: @JaurxBot
BOT FILE: /Users/johnreilly/trading-bot/bot.js (runs on Mac, Node.js)

WHAT THE SERVICE IS:
- Private Telegram channel: "JaurxTrades VIP"
- Members get: live MGC + MNQ trade alerts (entry/SL/TP), daily morning bias, weekly recaps, DM access to John
- Pricing: $49/mo recurring | Founders rate: $29/mo lifetime (first 25 only)
- Platform: Whop (recommended) handles payments + Telegram auto-invite/kick | DIY Stripe path also built

PAYMENT PATHS:
A) Whop — whop.com/jaurxtrades-vip/ — handles billing, Telegram access, cancellations automatically
B) DIY Stripe — Express server (server.js on port 3001) + Stripe webhooks + bot.js patches
   - checkout.session.completed → creates single-use Telegram invite link → emails customer
   - customer.subscription.deleted → kicks user from VIP channel via banChatMember
   - Data stored in vip_subs.json

KEY ENV VARS (for Stripe path):
STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, TELEGRAM_TOKEN, VIP_CHANNEL_ID, PUBLIC_URL

REPO: github.com/jjrpro/Code — folder: jaurxtrades-vip/
KEY FILES:
- jaurxtrades-vip/VIP-LAUNCH.md — full launch plan + Whop setup steps
- jaurxtrades-vip/launch-copy.md — copy-paste content: welcome post, disclaimer, trade alert format, DM templates
- jaurxtrades-vip/stripe-diy/server.js — DIY Stripe webhook server
- jaurxtrades-vip/stripe-diy/public/ — checkout success/cancel pages

COMPLIANCE: Every post ends with "NFA. Trade your own size." Full disclaimer pinned in VIP channel. Service is educational/entertainment only — not financial advice.

SUCCESS METRIC: 5+ paid subs = $245+ MRR. Target 10 subs = $490 MRR at launch.
```

---

## 2. JaurxBot

```
You are working on JaurxBot — the Telegram trading bot for JaurxTrades, owned by John Reilly (JJR).

OWNER: John Reilly | admin@jjrproconsultants.com
BOT USERNAME: @JaurxBot
BOT FILE: /Users/johnreilly/trading-bot/bot.js (Node.js, running on Mac)
RESTART: pkill -f "node.*bot.js" && cd /Users/johnreilly/trading-bot && nohup node bot.js > /tmp/bot.log 2>&1 & disown

ARCHITECTURE:
- Node.js long-polling bot (getUpdates)
- Handles commands via handleCommand() dispatch
- Uses OWNER_IDS array to gate owner-only commands
- Sends messages via sendTelegram(chatId, text, parseMode)

VIP CHANNEL PATCH (bot-vip-patch.js):
- Constants: VIP_CHANNEL_ID (the -100xxx private channel ID), VIP_ENABLED, VIP_TAG
- sendVIP(text) — broadcasts to VIP channel with 🎯 VIP prefix
- sendVIPPhoto(filePath, caption) — sends chart screenshot to VIP
- /vip <text> — owner command: manually broadcast anything to VIP channel
- /vipbias <text> — owner command: post morning bias with timestamp
- /vipcount — owner command: get VIP channel member count
- /disclaimer — auto-reply with full risk disclaimer
- placeBracket() hook — auto-broadcasts every confirmed bracket trade to VIP channel

STRIPE PATCH (bot-stripe-patch.js):
- Handles chat_member events to link telegram_id ↔ Stripe invite link
- handleChatMemberUpdate() — fires when user joins VIP via tracked invite link
- POSTs to server.js /api/link-telegram to associate email ↔ telegram_id
- /vipstatus — owner command: hits server.js /health for active sub count + MRR

SETUP CHECKLIST:
1. Create private Telegram channel "JaurxTrades VIP"
2. Add @JaurxBot as admin (Post, Edit, Invite, Pin perms)
3. Get channel ID via @userinfobot (forward any channel message to it)
4. Set VIP_CHANNEL_ID in bot.js
5. Test: DM bot /vip Hello world → check VIP channel

REPO: github.com/jjrpro/Code — folder: jaurxbot/
KEY FILES:
- jaurxbot/bot-vip-patch.js — VIP broadcast + manual commands
- jaurxbot/bot-stripe-patch.js — Stripe/Telegram link logic
```

---

## 3. JaurxShops

```
You are working on JaurxShops — John Reilly's e-commerce Shopify store under JJR Pro Consultants.

OWNER: John Reilly | admin@jjrproconsultants.com
STORE: jaurxflips.myshopify.com (brand name: TheOneStopShop)
SOCIAL: @jaurxshops on TikTok + Instagram

PRODUCTS:
- 7 magnetic phone wallets (MagSafe-compatible)
- Price tiers: $16.99 / $19.99 / $24.99
- Sourced via DSers/AliExpress (~$3.50 landed cost)
- Free shipping threshold: $35 (drives upsell)

MARGIN MATH (per $19.99 sale):
- Revenue: $19.99 | COGS: ~$3.50 | Shopify fee: ~$0.88
- Gross profit: ~$15.61 | Target CAC: <$10 | Break-even ROAS: 1.3x | Profitable ROAS: >1.6x

AD STACK:
1. TikTok Spark Ads — $60/day (3 ad groups × $20, boost existing organic @jaurxshops videos)
   - Objective: Sales → Complete Payment | No interest targeting | 48h min before judging
   - Kill: CPM >$20 or CTR <1% or $40 spent with 0 ATCs | Scale: ROAS >1.5 → +50%, >2.5 → +100%
2. Meta Advantage+ Shopping (ASC+) — $30/day
   - 6 creative variants: UGC video, carousels, lifestyle images, collection ad
   - Do NOT edit for 72h after launch — algo learning period
   - Kill: 3 days ROAS <1 | Scale: ROAS >1.5 at 72h → +50%

PIXEL SETUP REQUIRED:
- TikTok Pixel + Events API (Advanced Matching ON) — test with TikTok Pixel Helper
- Meta Pixel + CAPI — test with Meta Pixel Helper
- Events: ViewContent, AddToCart, InitiateCheckout, Purchase must all fire

STACK MULTIPLIERS (after ads running):
- Post-purchase upsell app (ReConvert/AfterSell/Zipify) — $24.99 upsell for $16.99 buyers
- Abandoned cart emails at 1h + 10h
- Klaviyo free tier: 3-email welcome + abandoned cart flows
- Instagram Shopping tagged posts

CREATIVE ANGLES:
1. Demo: "POV: you'll never lose your phone again" — wallet slammed on table, phone snaps
2. Problem-solution: normal case cards falling out → MagSafe snap
3. Social proof: unboxing montage / buyer clips ($5 promo for 5-second clip)

HOOKS: "Don't buy a wallet until you see this" | "Replace your wallet for $20" | "iPhone users — this is for you"

WEEKEND BUDGET LADDER: Sat $90 → Sun $90-135 → Mon $135-200 | Total test spend ~$315-425

REPO: github.com/jjrpro/Code — folder: jaurxshops/
KEY FILE: jaurxshops/SHOPIFY-ADS.md
```

---

## 4. Local 638 Steamfitters

```
You are working on the Local 638 Steamfitters website — a client project for John Reilly (JJR Pro Consultants).

CLIENT: Steamfitters Local Union No. 638 — United Association
DESCRIPTION: New York City's mechanical trades union, serving since 1888
SITE FILE: local-638/index.html (single-file static site)

DESIGN SYSTEM:
- Colors: --navy #0a2540 | --navy-deep #061a2e | --steel #4a5568 | --steel-light #cbd5e0
          --gold #c9a55c | --gold-soft #e7d4a7 | --red #b71c1c | --bg #f7f7f5 | --ink #1a202c
- Stack: Pure HTML/CSS — no frameworks, no JS dependencies
- Responsive: mobile-first

CONTENT SECTIONS: Apprenticeship, journeyman training, contractor referral, member services

REPO: github.com/jjrpro/Code — folder: local-638/
KEY FILE: local-638/index.html
```

---

## 5. JR Command Center (Obsidian Plugin)

```
You are working on JR Command Center — a custom Obsidian community plugin built by John Reilly (JJR) and Claude.

PLUGIN: "JR Command Center" v1.0.0 | By JR + Claude
DESCRIPTION: Trading command center dashboard inside Obsidian — positions, P&L, bot health, trade journal, and skill launchers

PURPOSE:
- Central hub in Obsidian vault for JJR's trading operations
- Surfaces live bot status, open positions, P&L
- Houses trade journal entries
- Launches skills/shortcuts from inside Obsidian

VAULT LOCATION: John's Mac (Obsidian vault = "JR AI-brain")
OBSIDIAN MCP: Local REST API with MCP plugin (v4.1.2 by Adam Coddington) is installed and enabled on port 27124
API KEY: stored in ~/.claude/settings.json on the Mac under mcp-obsidian config

RELATED PROJECT: JaurxBot (bot.js) is the data source — bot health, trade data feeds into this dashboard

When writing code for this plugin:
- Target Obsidian plugin API (TypeScript/JavaScript)
- Follow Obsidian community plugin conventions
- Plugin lives in the Obsidian vault's .obsidian/plugins/jr-command-center/ directory
```

---

## 6. JR AI-Brain (Obsidian Vault + Session Memory)

```
You are working on JR AI-Brain — John Reilly's Obsidian knowledge base and Claude session memory system.

OWNER: John Reilly | admin@jjrproconsultants.com | JJR Pro Consultants
VAULT NAME: "JR AI-brain" (visible in Obsidian bottom-left)
OBSIDIAN: Running on John's Mac

MCP CONNECTION:
- Plugin: Local REST API with MCP (v4.1.2, Adam Coddington) — installed + enabled
- Port: 27124 | Host: 127.0.0.1
- API Key: 24dc5d680f401f54bce237c60e5a261a7b696c123366094ea0f71bbd05020f93
- Claude Code config: ~/.claude/settings.json on Mac (mcp-obsidian via uvx)
- Only works in LOCAL Claude Code CLI sessions on the Mac (not remote web sessions)

VAULT PURPOSE:
- Session memory across Claude conversations
- Project notes for all JJR active projects
- Trade journal + market analysis
- JR Command Center plugin dashboard

ACTIVE PROJECTS IN VAULT (corresponding repo folders):
- JaurxTrades VIP → jaurxtrades-vip/
- JaurxBot → jaurxbot/
- JaurxShops → jaurxshops/
- Local 638 → local-638/
- JR Command Center → Obsidian plugin

REPO: github.com/jjrpro/Code (branch: claude/great-archimedes-BeEwL)

When in a remote session (no MCP access): ask John to paste relevant vault notes or run ngrok on Mac to tunnel port 27124 so the remote container can reach Obsidian.
```
