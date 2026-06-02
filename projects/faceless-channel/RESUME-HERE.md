---
date: 2026-06-01
project: faceless-channel
type: resume-here
summary: Exact stopping point for the Curious Frame YouTube auto-publish setup. Pick up here next session.
---

# 👉 RESUME HERE — Curious Frame setup

Last worked: 2026-06-01 (early AM). Paused mid OAuth setup, away from home.

## Where you stopped
Setting up YouTube auto-publish (the free half — no credits needed yet).
Following `auto/EASY-YOUTUBE-SETUP.md`.

- ✅ **Part 1 done** — Google Cloud project `curious-frame` created on the
  **claudeai Gmail** (NOT the jjrproconsultants work account — that one was
  permission-blocked). YouTube Data API v3 **enabled**.
- ⏸️ **Part 2 in progress** — OAuth consent screen. Next click: set **App name
  = Curious Frame**, support email + developer email = claudeai Gmail, Save;
  then Scopes page → Save; then **Test users → add the claudeai Gmail** → Save.
- ⬜ **Part 3** — Credentials → Create OAuth client → **Web application** →
  redirect URI `https://developers.google.com/oauthplayground` → copy Client ID + Secret.
- ⬜ **Part 4** — OAuth Playground → use own creds → scope
  `https://www.googleapis.com/auth/youtube.upload` → authorize as Curious Frame
  → exchange → copy **Refresh token** (starts `1//`).
- ⬜ **Part 5** — hand Claude the 3 values (Client ID, Secret, Refresh token).

## Open question to answer (30 sec, in YouTube app)
**Is the Curious Frame YouTube channel on the claudeai Gmail?**
The auto-publisher posts to whatever account owns the channel, so the channel
should live on the same claudeai account used above. Confirm or move it.

## Easy phone tasks (free, start the 6-month monetization clock)
Do anytime from the apps — paste-ready copy is in `BRAND.md`:
- [ ] YouTube channel named `Curious Frame` on claudeai Gmail + bio/About
- [ ] TikTok `@curiousframe` + bio
- [ ] Instagram `@curiousframe` + bio

## Still hard-blocked (decision, not a task)
- Rendering any video needs **funded credits** (account is at 0, free plan).
  Plans/links: `2026-05-31-curious-frame-launch-checklist.md`. Realistic payoff
  is ~5–7 months out — fund only when you've decided it's worth ~$40–100/mo.

## What's already built and waiting (nothing more to build)
DropVault store (tested) + Curious Frame (30 scripts, full publish copy, brand
kit, autopilot: YouTube uploader + daily Render cron, dry-run tested). The only
stub left is the 3 render functions in `auto/generate.js` — a ~30-line wire-up
the moment credits exist.
