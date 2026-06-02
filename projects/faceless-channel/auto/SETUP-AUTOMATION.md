# Curious Frame — Full Autopilot Setup

What "Claude controls the whole thing" actually means, and the exact steps to
get there. Be clear-eyed: there's no persistent always-on "me." Instead we
deploy a **scheduled machine** that runs the pipeline daily on a host that stays
awake (Render), publishing to your YouTube via the official API. I build, drive,
and maintain that machine; you do two one-time things only you can do.

## The division of labor

| Piece | Owner | Status |
|---|---|---|
| Scripts, manifests, branding | Claude | ✅ done |
| Generation + stitch + upload code | Claude | ✅ built, dry-run tested |
| Always-on host + daily cron | Claude (code) | ✅ render.yaml ready |
| **Fund the media credits** | **You** | ⬜ blocker — nothing renders without it |
| **One-time YouTube OAuth grant** | **You** | ⬜ ~5 min, mints a refresh token |
| Deploy to Render + paste secrets | You (5 min) or Claude-guided | ⬜ after the two above |

## Why two steps are unavoidably yours
1. **Credits** cost money tied to your card. The account has 10 free credits;
   a video needs ~50–90. No funding → no render. (Plans + links:
   `../2026-05-31-curious-frame-launch-checklist.md`.)
2. **YouTube access** must be granted by the account owner via Google's consent
   screen. The safe pattern: you approve once, which mints a **refresh token**.
   That token (never your password) becomes a Render secret. After that, uploads
   happen forever with no further logins.

---

## Step-by-step (≈20 min total, once)

### 1. Fund the media account
Pick a plan and pay (see the launch checklist). ULTRA gives ~1 video/day of
credits + scheduled-job headroom. Then create an **API key** on that account and
keep it for step 3 (`MEDIA_API_KEY`).

### 2. Authorize YouTube (mints the refresh token)
1. Google Cloud Console → new project → enable **YouTube Data API v3**.
2. APIs & Services → Credentials → **Create OAuth client** → type **Desktop app**.
   Copy the **client ID** + **client secret**.
3. On your Mac:
   ```bash
   cd projects/faceless-channel/auto && npm install
   YT_CLIENT_ID=xxx YT_CLIENT_SECRET=yyy npm run token
   ```
4. Approve in the browser. Copy the printed **refresh token** (`YT_REFRESH_TOKEN`).

### 3. Deploy the autopilot to Render
1. render.com → **New → Blueprint** → pick this repo (root
   `projects/faceless-channel/auto`). It reads `render.yaml`.
2. In the dashboard, set the secrets: `MEDIA_API_KEY`, `YT_CLIENT_ID`,
   `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`, and `SELF_URL` (your service URL).
   `CRON_SECRET` is auto-generated — copy the same value into the cron job.
3. Done. The cron hits `/cron/daily` at 9am ET every day → one video produced,
   stitched, and uploaded to YouTube automatically.

### 4. Hand control to Claude
From then on, each session I can: check `/status`, read `auto/log.jsonl`, adjust
the calendar/cadence, fix failures, swap visual styles, and add new months of
topics. You don't touch it unless you want to.

---

## What's still stubbed (and honest about it)
The model-call seam in `generate.js` (`renderClip` / `renderVoice` /
`renderThumbnail`) is **isolated and intentionally not yet pointed at a live
endpoint** — because the exact generation API surface is finalized once the
funded account exists. Everything around it (pick → script → beats → stitch →
YouTube upload → status) is built and dry-run tested. When you fund + key the
account, wiring those three functions is the last ~30-line change, then we do a
single real end-to-end test video before turning the cron on.

## TikTok / Instagram
YouTube is fully API-automatable (above). TikTok + IG don't allow the same
hands-off uploading, so those go through a scheduler you authorize (Buffer/
Metricool) fed from the same `renders/` folder — add when you want them.

## Cross-posting note
The same rendered 9:16 MP4 works on all three platforms; only the publish
transport differs.
