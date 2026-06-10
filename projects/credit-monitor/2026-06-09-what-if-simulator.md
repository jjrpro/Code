# Credit Monitor — What-if payment simulator

**Date:** 2026-06-09
**Summary:** Added an interactive "what-if" simulator so JR can see exactly what a
payment does to his credit *before* he makes it — projected reported utilization,
current utilization, and health score, live as he types. Built while deploy is on
hold (JR chose "keep building").

---

## What it does
Type a planned payment for any card (assumed paid before the statement closes, so
it lowers both the current and the **reported** balance) and the panel updates
live:
- **Projected reported utilization** (what the bureaus see → drives the score),
  color-coded, shown as `before% → after%`.
- Current utilization before → after.
- Health indicator before → after (with the +/- delta).
- Total planned payment.
- A target check: "✓ under your X% target" or guidance to pay more.

## How it's built
- `src/logic/simulate.js` — reuses `utilization.aggregate/forCard` and
  `factors.breakdown` (the **same math as the dashboard**), so projections match
  the rest of the app. Remaps payments onto cloned cards; floors balances at 0.
- `POST /api/simulate` — body `{ adjustments:[{id,payment}], target }`.
- UI: "🧮 What-if: plan a payment" panel; per-card payment inputs (debounced
  300 ms), a results card, and Reset. Typed amounts persist across refreshes
  (in-memory `SIM_PAY`).

## Verified
With sample data (agg reported 26.9%): paying $4,000 on Sapphire → reported
**26.9% → 15.2%**, health **73 → 77**, that card **41% → 7.7%**; $2,000 →
26.9% → 21.1%. No-payment case returns before == after. Endpoint + UI panel +
app.js all serve and parse.

## Status
Code-complete for the MVP feature set: cloud hosting (auth + PWA), AI screenshot
import, auto-backups, and now the what-if simulator. The remaining gate is still
**deploying** (JR's call, deferred). Next candidate features when he's ready:
phone push alerts (needs deploy to be useful) or score-from-screenshot.
