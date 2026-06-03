---
created: 2026-06-03
tags:
  - claurx
  - infrastructure
  - always-on
status: plan
---

# CLAURX — Always-On Box Plan (2026-06-03)

> One-line summary: The honest path to a self-driving CLAURX that briefs you at
> 11AM, recaps at night, and watches your store/trading without you summoning
> it. The brain and scripts are already built; this is the body they need to
> live in. Two real options, exact costs, and a setup checklist that's mostly
> a one-evening job — most of it yours, because it's accounts and hardware I
> can't create from a cloud session.

---

## Why this is needed (the one hard truth)

I run in an **ephemeral cloud container** — I'm *summoned*, I don't run 24/7.
A JARVIS that wakes itself at 11AM and talks to you unprompted needs **a
computer that's always on** to fire the schedule and hold the keys. No amount
of code removes that gate. Everything else (persona, memory, journal,
briefing, store dashboard) is built and waiting for this body.

What the box actually does:
- Runs `cron` → fires `briefing.mjs` at 11:00 and the recap at 21:30.
- Holds the API keys (Shopify, weather, news, calendar, voice) **privately**,
  on hardware you own — not pasted into a chat.
- Runs the watch-for triggers (low stock, unusual spend, metric thresholds).
- Delivers output where you read it (Telegram DM, email, or an Obsidian note).

---

## Option A — Mini-PC at home (recommended for "private")

A small fanless mini-PC (e.g. Beelink/Intel N100 class) sitting at home, always on.

| | |
|---|---|
| **Up-front** | ~$150–$220 one-time (N100 mini-PC, 16GB) |
| **Monthly** | ~$2–$4 electricity. $0 hosting. |
| **Privacy** | Highest — keys + memory never leave your house |
| **Best for** | "I want it private and I don't want a monthly bill" |
| **Trade-off** | If home internet/power drops, briefing skips until back up |

## Option B — Small private cloud VM (recommended for "never miss")

A cheap always-on Linux VM (e.g. a $6/mo cloud instance).

| | |
|---|---|
| **Up-front** | $0 |
| **Monthly** | ~$6–$12 (1 small VM) |
| **Privacy** | High — your VM, your keys; provider is the only third party |
| **Best for** | "It must never miss the 11AM, even if my house loses power" |
| **Trade-off** | Small recurring bill; keys live on a rented box (encrypted) |

**My call:** Option B for v1 — $6/mo buys reliability and a 20-minute setup, and
it fits well inside your $100/mo. Move to a home mini-PC (Option A) later if you
want zero recurring cost and maximum privacy. Either way the scripts are
identical; only the host changes.

---

## Setup checklist (one evening, mostly yours)

**Yours (the parts I can't do from a cloud session):**
1. [ ] Pick A or B and stand up the box (VM: create instance; mini-PC: plug in + OS).
2. [ ] Create the accounts/keys CLAURX will hold:
   - [ ] Shopify: approve the CLAURX app + fresh client secret (unblocks the live store read).
   - [ ] Weather: free API key (e.g. OpenWeather).
   - [ ] Market news: a feed/API for MGC + MNQ headlines.
   - [ ] Calendar: Google OAuth (one-time grant → refresh token).
   - [ ] Delivery: a Telegram bot token *or* an email-send key for where the briefing lands.
3. [ ] Give me SSH/console access (or paste the box's details) so I can deploy.

**Mine (once the box + keys exist):**
4. [ ] Clone this repo onto the box, drop keys into git-ignored `.env` files.
5. [ ] Flip the `briefing.config.json` sections on as each source connects.
6. [ ] Install the two cron lines (11:00 briefing, 21:30 recap).
7. [ ] Wire delivery (Telegram/email) + run one real test briefing end-to-end.
8. [ ] Turn on watch-for triggers (low stock, unusual spend, thresholds).

---

## Honest timeline

- **Tonight:** brain, memory, trade journal + $500/day scoreboard, and the
  briefing engine — **all built and runnable.** ✅
- **The evening you stand up the box + create the keys:** I deploy, cron it,
  wire delivery, and CLAURX goes self-driving — **~1–2 hours of my work once
  your side is ready.**
- **Voice (optional, last):** add a British-female TTS (ElevenLabs cloud, or
  local Piper if you insist on private) after the text briefing is proven.

The blocker is never the code — it's the box and the five accounts. The day you
hand me those, the JARVIS layer is a short job, not a project.

---

## Monthly cost (fits your $100)

| Item | Cost |
|---|---|
| Always-on host (Option B VM) | ~$6–12/mo |
| Claude API usage (the brain) | variable — typically the bulk |
| Voice (ElevenLabs, only if Phase 4) | optional add-on |
| Weather/news/calendar APIs | free tiers cover this |
