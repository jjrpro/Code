# DropVault — Going live (always-on)

`SETUP.md` gets you running locally. This covers a **permanent public URL** so
the store is up 24/7 without your laptop's Terminal open.

## Pick how it runs

| Path | Best when | Pack files live… | Cost |
|---|---|---|---|
| **A. Mac + Cloudflare Tunnel** | Launch / first sales | On your Mac (`packs/`) | Free |
| **B. Render (Blueprint)** | You want it off your Mac | Committed in repo *or* cloud storage | Free tier |

### Path A — Mac + Cloudflare Tunnel (simplest, recommended to start)
A stable `https://` URL that points at the server on your Mac. Packs stay local,
nothing to upload.

```bash
brew install cloudflared
node server.js                      # terminal 1
cloudflared tunnel --url http://localhost:3000   # terminal 2 -> copy the https URL
```
- Put that https URL in `.env` as `PUBLIC_URL`, restart `node server.js`.
- Coinbase Commerce → Webhooks → endpoint = `https://YOUR-URL/webhook`.
- Keep the two terminals running (or set them as login items later).

### Path B — Render (off your Mac, always on)
`render.yaml` is already in this folder.
1. Push repo → render.com → **New → Blueprint** → pick this repo.
2. Set `CC_API_KEY`, `CC_WEBHOOK_SECRET`, `PUBLIC_URL` (your `…onrender.com` URL)
   in the dashboard. `DOWNLOAD_SECRET` is auto-generated.
3. Coinbase Commerce → Webhooks → `https://YOUR-RENDER-URL/webhook`.

> **Pack storage on Render:** Render's disk is wiped on each deploy, and
> `packs/*.zip` are gitignored, so they won't ship by default. Two fixes:
> - **Small packs (wallpapers/images):** delete the `packs/*.zip` line from
>   `.gitignore` and commit them — they ride along in the deploy.
> - **Big packs (video reels):** host the ZIPs on Cloudflare R2 / Backblaze B2
>   (cheap, free egress) and we add a one-line redirect in the download route.
>   Ask Claude to wire this when you get there.

## Decision to make
Start with **Path A** for launch (zero hosting friction, packs local). Move to
**Path B** once you're making steady sales and want it fully hands-off. Tell
Claude which and it'll finish the wiring.

## Verified working (2026-05-31)
Local end-to-end test passed: catalog API (no internal file paths leaked),
health check, root storefront, and download gating — forged, empty, expired,
and wrong-secret tokens all correctly rejected (403); only a valid, unexpired,
correctly-signed token reaches the file.
