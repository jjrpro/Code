---
title: Credit Monitor — Daily Check-In + Personalization
date: 2026-06-09
summary: Added a daily credit check-in ("survey") with streak + utilization trend, made the app easy to personalize with your own cards (full edit + start-fresh), and wired a daily reminder. How to switch from sample data to your real cards, privately.
tags: [credit-monitor, daily-checkin, personalization, mvp]
---

# Credit Monitor — Daily Check-In + Personalization (2026-06-09)

One-line summary: JR wanted the app customized to him — enter his real cards and
get a daily survey that tells him what to do to raise his score. This adds the
daily check-in, a streak + trend, full card editing, a "start fresh" button, and
a check-in-aware daily reminder. JR chose to enter his cards **in-app** (most
private — nothing leaves his Mac), so no real financial data is committed.

## What's new

- **Daily Check-In panel** (top of the dashboard). Once a day: confirm/adjust
  each card balance (pre-filled) + autopay, optionally log a payment / new hard
  inquiry / new score, and flag an upcoming application (turns on AZEO). On
  submit it applies updates, snapshots utilization/score, shows **today's #1
  move**, tracks a **streak**, and draws a **utilization trend from your own
  daily inputs** (with the 30% line marked).
- **Personalization made easy:** full card editing (✎), and **Start fresh
  (clear all)** to wipe the sample data and enter your own cards. **Load sample
  data** restores the demo.
- **Daily reminder:** the scheduled digest is now check-in aware — it nudges you
  if today's check-in isn't done and carries today's top action (email + desktop).

## How JR switches to his real cards (private, local)

1. `cd projects/credit-monitor && npm start` → open http://127.0.0.1:4600
2. Cards panel → **Start fresh (clear all)**.
3. **+ Add a card** for each card: issuer, nickname, credit limit, current
   balance, statement closing day, payment due day, APR, min payment, autopay.
   (Statement closing day is the key field for the "pay before close" timing.)
4. Do the first **Daily Check-In**.

Nothing is committed or synced — his balances live only in
`data/credit-monitor.db` on his Mac.

## Under the hood

- New `checkins` table (one row/day: utilization + score snapshot, focus, raw
  answers). `src/logic/daily-survey.js` handles `today()` / `submit()` / streak /
  progress. API: `GET /api/survey/today`, `POST /api/survey`,
  `GET /api/survey/progress`, plus local admin `POST /api/admin/reset` and
  `POST /api/admin/load-sample`.
- Verified working: a check-in that pays Discover 2,600 → 500 dropped aggregate
  utilization 26.9% → 20.8%, logged the payment, logged score 724, set the
  streak, and flipped the digest to "✓ Daily check-in done — 1-day streak."
