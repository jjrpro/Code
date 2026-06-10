# Credit Monitor — score-from-screenshot + phone push alerts

**Date:** 2026-06-09
**Summary:** Built the two remaining candidate features in one pass ("do it all"):
read a credit score from a screenshot, and real phone push notifications.

---

## 1. Score from a screenshot
- `screenshot-import.js` now has `extractScore()` (refactored the vision call into
  a shared `callVision` helper) with its own strict JSON schema + prompt tuned for
  score widgets (Credit Karma / bureau / issuer FICO).
- `POST /api/import/score-screenshot` → `{ score, source, bureau, date }`.
- UI: **📷 Scan score** button in the "Log a credit score" panel → reads the image
  → **pre-fills** the score form (score/source/bureau/date) for JR to confirm and
  click **Log score**. Coercion clamps to 300–900 and only accepts ISO dates.

## 2. Phone push alerts (web push / VAPID)
- Real implementation replacing the old stub: `src/notify/push.js` uses
  `web-push`, stores subscriptions in a new `push_subscriptions` table, sends to
  all devices, and prunes dead subscriptions (404/410).
- Because the digest orchestrator already calls `push.send()`, the **daily digest
  now also pushes** to every enabled device automatically.
- Endpoints: `GET /api/push/key`, `POST /api/push/subscribe`,
  `/api/push/unsubscribe`, `/api/push/test`.
- Service worker (`sw.js`) gained `push` + `notificationclick` handlers.
- UI: **🔔 Enable alerts** button (header) requests permission, subscribes via
  `PushManager` with the server's VAPID public key, and fires a test push. Hidden
  unless the server has VAPID keys.
- Keys: `npm run vapid` (new `scripts/gen-vapid.js`) prints the env block.
  Config: `CM_VAPID_PUBLIC`, `CM_VAPID_PRIVATE`, `CM_VAPID_SUBJECT`.

## Verified (offline)
- Score module loads; coercion correct (`742` / source / bureau preserved).
- Push: `push/key` reports enabled + public key; subscribe stored (devices
  0→1); `push/test` against a fake endpoint returned gracefully (no crash);
  unsubscribe removed it; score-scan without an AI key returns the clean
  "needs a key" error. All syntax-checked.
- **Not testable here:** real push delivery needs HTTPS + a real browser
  subscription, and the live vision read needs JR's Anthropic key. The plumbing,
  storage, and graceful-failure paths are all verified.

## Caveat for JR
**Push only works once deployed (HTTPS).** On iOS he must Add to Home Screen
first, then open that installed app and tap Enable alerts. Locally the button
stays hidden unless VAPID keys are set. Everything else (score scan) works the
moment his Anthropic key is set.

## Status
All planned MVP features are now built: cloud hosting (auth + PWA), AI screenshot
import (accounts **and** score), auto-backups, what-if simulator, and phone push.
Remaining gate is the Render deploy (JR's call).
