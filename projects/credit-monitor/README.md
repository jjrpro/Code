# 🛡️ Credit Monitor

A **local-first** app that tracks your credit cards and overall credit health
and tells you **exactly what to do** to improve your credit — with specific
dollar amounts and deadlines, prioritized by what actually moves your score.

Your financial data never leaves your machine. There is no cloud account, no
signup, and nothing is sent anywhere unless *you* configure SMTP (for email
digests) or Plaid (optional read-only sync).

---

## Why it's built this way (the data reality)

There is no free, fully-automatic way to pull live credit-bureau reports or
FICO scores into a personal app. So this app:

- **Computes everything it can** from data you provide — balances, limits,
  utilization, due/statement dates, account ages, payment history.
- **Lets you log your score** (from Credit Karma / Experian / your card
  issuer's free FICO) and trends it over time.
- **Supports optional Plaid** (read-only) behind a flag — but works fully
  without it via manual entry + CSV import.

---

## Quick start (one command after install)

```bash
cd projects/credit-monitor
npm install        # installs deps (better-sqlite3 ships a prebuilt binary)
npm start          # seeds sample data on first run, then serves the dashboard
```

Open **http://127.0.0.1:4600**. You'll see a fully populated dashboard using
realistic sample data immediately. To start fresh with your own data, run
`npm run seed:reset` and then edit/delete the sample cards, or just delete
`data/credit-monitor.db`.

> No `.env` is required to run. Copy `.env.example` → `.env` only when you want
> to enable email digests, change the port, set an encryption key, etc.

### Other commands

| Command | What it does |
|---|---|
| `npm start` | Run the web dashboard + in-process scheduler |
| `npm run seed` | Load sample data if the DB is empty |
| `npm run seed:reset` | Wipe and reload sample data |
| `npm run digest` | Build + send the digest now (email/desktop if configured) |
| `npm run digest:dry` | Print the digest to the console, send nothing |
| `node scripts/print-recommendations.js [--azeo]` | Print the full recommendation output |

---

## 📷 Screenshot import (AI)

Instead of typing cards in, upload a screenshot of your accounts (your bank
dashboard, Credit Karma, an issuer app, or a spreadsheet) and Claude reads off
the issuer, balance, limit, due/closing dates, APR, and minimum payment into a
review table you confirm before saving. Matches by last-4 or nickname update an
existing card instead of duplicating it.

- Set `CM_ANTHROPIC_API_KEY` (get one at <https://console.anthropic.com>). Costs
  a few cents per scan. Without a key, the **📷 Scan screenshot** button is
  disabled and manual + CSV entry still work.
- The reader model defaults to `claude-opus-4-8` (most accurate). Set
  `CM_VISION_MODEL=claude-haiku-4-5` to spend less per scan.
- Screenshots are sent to Anthropic's API to be read, then discarded. Only scan
  images you're comfortable sending off-device.

## ☁️ Cloud hosting + phone app (optional)

Want it always-on and on your phone's home screen instead of local-only? The app
ships as a **PWA** (installable) with a **password gate** and a **Dockerfile +
Render blueprint**. See **[DEPLOY.md](./DEPLOY.md)** for the click-by-click
(~$7/mo). Key points:

- Set `CM_PASSWORD` to lock it. The server **refuses to start** on a non-localhost
  interface without a password, so you can't accidentally expose your data.
- Set `CM_DATA_DIR` to a persistent disk path (e.g. `/var/data`) so your DB and
  encryption key survive restarts. Keep `CM_ENCRYPTION_KEY` stable.
- On your phone: open the URL → **Add to Home Screen** (iOS) / **Install app**
  (Android). It runs full-screen and stays signed in.

---

## Architecture & stack

**Stack:** Node + Express + `better-sqlite3` + a zero-build vanilla-JS
dashboard (charts drawn as inline SVG — no CDN, fully offline).

**Why:** fastest path to a solid, *single-command* MVP that runs on a normal
machine with no build toolchain, no external services, and no internet
dependency. `better-sqlite3` is synchronous and embedded (one file on disk);
the dashboard is plain HTML/JS so there's nothing to compile.

```
src/
  config.js            env + feature flags (everything has a default)
  crypto.js            AES-256-GCM field encryption at rest (card last-4, tokens)
  db.js                SQLite schema (cards, scores, inquiries, payments)
  models/              thin data-access layer per entity
  logic/
    dates.js           recurring statement/due-date math + countdowns
    utilization.js     per-card & aggregate utilization + color thresholds
    statement-timing.js "pay $X before close to hit target util" engine
    factors.js         FICO factor breakdown (35/30/15/10/10 weighting)
    recommendations.js the playbook, encoded → prioritized action list
    csv.js             dependency-free CSV parser + column-mapped importer
    dashboard.js       ties it all together into one payload
  notify/
    digest.js          builds the text + HTML summary
    email.js           SMTP via nodemailer (optional)
    desktop.js         desktop notifications (optional node-notifier)
    push.js            mobile-push hook — STUB (TODO)
    index.js           orchestrates the channels
  jobs/scheduler.js    node-cron daily/weekly digest
  plaid/plaid.js       Plaid read-only integration — STUB (TODO)
  routes/api.js        JSON API
  server.js            entry point (seeds on first run, serves dashboard)
public/                index.html + app.js + styles.css (the dashboard)
scripts/               send-digest, print-recommendations
sample-data/           example CSVs for the import feature
data/                  SQLite DB + .keyfile (gitignored)
```

### Data model

- **cards** — issuer, nickname, last-4 (encrypted), credit limit, current
  balance, statement balance, statement closing day, payment due day, minimum
  payment, APR, date opened, autopay on/off, active flag.
- **scores** — date, score, source, bureau/model (trended over time).
- **inquiries** — date, reason, bureau, hard/soft.
- **payments** — card, date, amount, kind, on-time flag.
- Aggregate limit/balance/utilization are computed, not stored.

---

## Features

### Dashboard
- Per-card **and** aggregate utilization with color thresholds
  (🟢 <10% · 🟡 10–30% · 🔴 >30%), both *current* and *reported* (what hits the
  bureaus).
- **Credit-score trend chart** from your logged scores.
- **Statement/due-date calendar** with day countdowns and "no autopay" warnings.
- **FICO factor breakdown** using real FICO weighting, showing where you're
  strong/weak based on your data.

### Daily check-in (the "daily survey")
A prominent **Daily Check-In** panel at the top of the dashboard. Once a day you:
- confirm/adjust each card's balance (pre-filled with what's on file) and autopay,
- log any payment you made, a new hard inquiry, or a new credit score,
- flag if you're about to apply for credit (turns on AZEO guidance).

On submit it applies the updates, snapshots your utilization/score, shows
**today's #1 move**, tracks a **streak**, and builds a **utilization trend from
your own daily inputs**. The daily reminder (email/desktop, via the scheduler)
nudges you if you haven't checked in and carries today's top action.

### Make it yours (enter your real cards)
The app ships with sample data so it looks real immediately. To switch to your
own cards, privately and locally:
1. Click **Start fresh (clear all)** in the Cards panel to wipe the sample data.
2. Add each of your cards with **+ Add a card** (issuer, nickname, limit,
   balance, statement closing day, due day, APR, autopay…). Edit any card later
   with the **✎** button.
3. Do your first **Daily Check-In**. That's it — nothing ever leaves your Mac.

### Statement-close timing logic
The most actionable lever in the app: it warns you when a card's balance is
high and its statement closes soon, and tells you **exactly how much to pay
before the closing date** to hit your target utilization — because the
statement balance is what most issuers report to the bureaus.

### Recommendation engine
Encodes the credit-improvement playbook into a **prioritized, specific action
list** sorted by score-factor impact (payment history 35% + utilization 30%
first):

- Flag any card without **autopay** → recommend autopay for at least the minimum.
- **Keep utilization low** (per-card + aggregate; <30% always, <10% ideal).
- **Time payments before the statement closing date**, with exact dollar amounts.
- **AZEO** ("All Zero Except One") plan before an application / score pull
  (toggle AZEO mode).
- **Don't close old cards** — warns about lost age + available credit.
- **Keep unused cards active** with a small recurring charge + autopay.
- **Limit hard inquiries** — flags clustering.
- **Request credit-limit increases** periodically (notes possible hard pull).
- **Dispute report errors** — checklist + where to file.
- **Debt-paydown priority** — surfaces *both* strategies: score-first (cards
  near/over 30%) and avalanche (highest APR, saves the most interest).

### Notifications (modular)
- Daily/weekly scheduled **email digest** (configurable SMTP) with a summary +
  action items + due-date / high-utilization alerts.
- **Desktop notifications** now; a clean **mobile-push hook** (`src/notify/push.js`)
  for later.

### Data inputs (all three)
1. Manual entry/editing in the UI.
2. **CSV import** with column mapping (card balances *and* payments) — auto-guesses
   column matches; re-imports update existing cards.
3. Optional **Plaid** (read-only), stubbed if no keys present.

---

## Privacy & security

- **Local-first:** data lives in `data/credit-monitor.db` on your machine. The
  server binds to `127.0.0.1` by default.
- **Encryption at rest:** sensitive fields (card last-4, any Plaid tokens) are
  encrypted with AES-256-GCM (`src/crypto.js`). Provide `CM_ENCRYPTION_KEY` or
  let the app generate a local `data/.keyfile` (gitignored).
- **No secret logging.** All credentials come from `.env` (see `.env.example`).
- `.env`, the database, and the keyfile are all gitignored.

---

## TODO markers

- **Plaid** (`src/plaid/plaid.js`) — read-only sync is stubbed. `npm i plaid`,
  set `CM_PLAID_ENABLED=true` + keys, implement the three marked functions.
- **Mobile push** (`src/notify/push.js`) — wire a provider (ntfy / Pushover /
  FCM / Expo) behind the existing hook.
- **Later phases:** score-vs-actions correlation; a "what-if" simulator
  (projected utilization/score impact of a payment, new card, limit increase,
  or closing a card).

---

*Estimates are for guidance only. This is not a real FICO score and not
financial advice.*
