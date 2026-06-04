---
title: Credit Monitor — Architecture Overview & Stack Decision
date: 2026-06-04
summary: Short architecture overview, stack decision and rationale, data model, and build phases for the local-first personal credit monitoring & improvement MVP.
tags: [credit-monitor, architecture, mvp, local-first]
---

# Credit Monitor — Architecture Overview (2026-06-04)

One-line summary: the design decisions behind a local-first app that tracks
your cards and credit health and tells you exactly what to pay, and when, to
improve your score. Working MVP lives in `projects/credit-monitor/`.

## The core constraint that shaped everything

There is **no free, fully-automatic way** to pull live credit-bureau reports or
FICO scores into a personal app. The system is built around that reality:

1. **Compute everything it can** from data you provide (balances, limits,
   utilization, statement/due dates, account ages, payment history).
2. **Manually log your score** (Credit Karma / Experian / issuer FICO) and trend it.
3. **Optional Plaid (read-only)** behind a flag — but fully functional without it
   via manual entry + CSV import.

## Stack decision

**Node + Express + `better-sqlite3` + zero-build vanilla-JS dashboard (inline-SVG charts).**

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node 18+ | Already present in this repo's tooling; one runtime for server + scripts |
| Storage | SQLite via `better-sqlite3` | Embedded, single file, synchronous, ships a prebuilt binary → `npm install` "just works" |
| Frontend | Vanilla HTML/JS/CSS, charts as inline SVG | **No build step**, no bundler, no CDN — fully offline, fastest path to a solid MVP |
| Email | nodemailer (optional SMTP) | Standard, configured purely via `.env` |
| Scheduler | node-cron (in-process) | No OS cron required; can be disabled to use real cron |
| Encryption | Node `crypto` AES-256-GCM | No extra deps for at-rest field encryption |

**Why not React/Postgres/etc.:** a non-developer needs *one command* and zero
infrastructure. React would add a build toolchain; Postgres would add a server
to run. Neither earns its keep for a single-user local app, and both slow the
path to a working MVP.

## Privacy / security posture

- Local-first: DB is a file on your machine; server binds to `127.0.0.1`.
- Sensitive fields (card last-4, any Plaid tokens) encrypted at rest with
  AES-256-GCM. Key from `CM_ENCRYPTION_KEY`, else an auto-generated gitignored
  `data/.keyfile`.
- Secrets only from `.env` (shipped `.env.example`); never logged. `.env`, the
  DB, and the keyfile are all gitignored.

## Data model

- **cards** — issuer, nickname, last-4 (encrypted), credit_limit, current_balance,
  statement_balance, closing_day, due_day, minimum_payment, apr, date_opened,
  autopay, active.
- **scores** — date, score, source, bureau/model (trended).
- **inquiries** — date, reason, bureau, hard/soft.
- **payments** — card_id, date, amount, kind, on_time.
- Aggregate limit/balance/utilization are **computed**, never stored.

## The three signature pieces of logic

1. **Utilization** (`logic/utilization.js`) — per-card + aggregate, both
   *current* and *reported* (statement balance), with 🟢<10 / 🟡10–30 / 🔴>30 bands.
2. **Statement-close timing** (`logic/statement-timing.js`) — computes how much
   to pay *before the closing date* to land reported utilization on a target,
   and warns when a card is high and closing soon. This is the highest-leverage
   feature because the statement balance is what gets reported.
3. **Recommendation engine** (`logic/recommendations.js`) — encodes the
   credit-improvement playbook into a prioritized, specific action list, sorted
   by FICO factor impact (payment history 35% + utilization 30% first). Includes
   AZEO, don't-close-old-cards, keep-unused-active, inquiry clustering, CLI
   requests, dispute checklist, and dual debt-paydown strategies (score-first +
   avalanche).

## Build phases

- **Phase 1 (done — this MVP):** data model, dashboard (per-card + aggregate
  utilization, score trend, calendar/countdowns, FICO factor breakdown),
  statement-timing logic, recommendation engine, CSV import with column mapping,
  email/desktop notification job + scheduler, seed data, encryption at rest.
- **Phase 2 (hooks in place):** Plaid read-only auto-sync (`plaid/plaid.js` stub),
  mobile push (`notify/push.js` stub).
- **Phase 3 (later):** score-vs-actions correlation over time; "what-if"
  simulator (projected utilization/score impact of a payment, a new card, a
  limit increase, or closing a card).

## Assumptions made (no architecture-blocking questions needed)

- Single user, single machine, trusted local network → no auth layer in the MVP
  (server bound to localhost). Add auth before exposing it.
- Statement/due dates recur monthly and are stored as a day-of-month; the app
  computes the next real occurrence (clamping e.g. day 31 in short months).
- The FICO factor breakdown and composite "health indicator" are **estimates**
  for guidance from the data on hand — explicitly *not* a real FICO score, and
  not financial advice. Surfaced as such in the UI and digest.
- Credit mix is informational only (the app tracks revolving cards, not loans).
