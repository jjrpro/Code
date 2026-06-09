# Credit Monitor — Cloud hosting + AI screenshot import

**Date:** 2026-06-09
**Summary:** Made Credit Monitor cloud-ready (always-on, password-locked,
installable on the phone) and added AI screenshot import so JR can upload a
picture of his accounts and have the cards filled in automatically. These were
the two options JR picked for the next iteration.

---

## What changed

### 1. AI screenshot import (built into the app)
- New **📷 Scan screenshot** button in the Cards panel. Pick/photograph a
  screenshot → Claude vision reads it → a review table pre-fills each account →
  JR edits if needed → **Save**. Matches by last-4 or nickname so re-scans
  update an existing card instead of duplicating.
- Server module `src/logic/screenshot-import.js` uses the official
  `@anthropic-ai/sdk` with **structured outputs** (strict JSON schema) so the
  result is always parseable, **prompt caching** on the stable system prefix,
  and adaptive thinking at low effort (accuracy without much cost).
- Model defaults to `claude-opus-4-8`; override with `CM_VISION_MODEL`
  (e.g. `claude-haiku-4-5`) to cut per-scan cost.
- Needs `CM_ANTHROPIC_API_KEY`. Without it, the button is disabled and the rest
  of the app is unaffected (graceful, clear error).
- Endpoint: `POST /api/import/screenshot` (accepts a base64 data URL).

### 2. Cloud hosting (always-on)
- **Password gate** (`src/auth.js`): single `CM_PASSWORD`, signed httpOnly
  session cookie (HMAC-SHA256, 30-day), constant-time compare, login page at
  `/login`. Auth is **off when no password is set** (local Mac use stays
  one-command).
- **Safety:** the server **refuses to start** on a non-localhost interface
  without a password — can't accidentally expose financial data.
- **Persistent data:** `CM_DATA_DIR` points the SQLite DB + encryption keyfile
  at a mounted disk (e.g. Render `/var/data`).
- **Deploy:** `Dockerfile`, `render.yaml` blueprint, and `DEPLOY.md`
  (click-by-click, ~$7/mo on Render Starter + 1 GB disk).
- `trust proxy` + Secure cookies behind the host's HTTPS proxy.

### 3. Installable phone app (PWA)
- `manifest.webmanifest`, service worker (`sw.js`, caches the shell, never the
  API), generated PNG icons (`scripts/make-icons.js` — pure-JS encoder, no image
  libs), and the head tags / apple-touch-icon. "Add to Home Screen" → full-screen
  app that stays signed in.

## New / changed env vars
`CM_PASSWORD`, `CM_SESSION_SECRET` (optional), `CM_ANTHROPIC_API_KEY`,
`CM_VISION_MODEL`, `CM_DATA_DIR`. All documented in `.env.example`.

## Verified offline
- Local (no password): boots, screenshot status reports disabled, screenshot
  call returns a clean "needs a key" error, manifest serves with the right
  content-type, icons serve, index open.
- Password mode: unauth `/` → 302 `/login`; wrong pw → 401; correct → cookie →
  200; API without cookie → 401; `/login` open.
- Bind safety: `HOST=0.0.0.0` without a password exits with a clear message.
- Coercion: messy values (`**** 1234`, `$4,920.50`, `12,000`, `24.99%`, `yes`)
  map correctly.
- Could **not** test a live vision call here (no API key in this environment) —
  JR provides the key on his host; the request shape follows the Anthropic SDK
  vision + structured-output docs.

## JR-facing next step
Follow `DEPLOY.md`: push to GitHub → Render web service (root dir
`projects/credit-monitor`, Starter plan, 1 GB disk at `/var/data`) → set
`CM_PASSWORD`, `CM_ENCRYPTION_KEY`, `CM_ANTHROPIC_API_KEY` → open the URL → Add to
Home Screen.
