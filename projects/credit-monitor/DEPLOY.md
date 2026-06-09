# Deploy Credit Monitor to the cloud (always-on, phone-ready)

This puts the app on a small server so it's always running, password-locked, and
installable on your phone's home screen. Plan: ~$7/month on Render (needed for a
disk that keeps your data between restarts).

You'll need three secrets ready before you start:

- **A password** you'll type to open the app (make it long).
- **An encryption key** — run this once on your Mac and copy the output:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **An Anthropic API key** for screenshot import (optional). Get one at
  <https://console.anthropic.com> → API Keys. Costs a few cents per scan. Skip
  this if you only want manual + CSV entry.

---

## One-time setup on Render

1. Push this repo to GitHub (the Stop hook already commits + pushes for you).
2. Go to <https://dashboard.render.com> → **New** → **Web Service**.
3. **Connect** your GitHub repo.
4. Configure:
   - **Root Directory:** `projects/credit-monitor`
   - **Runtime:** Docker (it auto-detects the `Dockerfile`)
   - **Instance Type:** **Starter ($7/mo)** — the free tier can't keep a disk.
5. **Add a disk** (so your data survives restarts):
   - Click **Advanced** → **Add Disk**
   - **Name:** `credit-data`  ·  **Mount Path:** `/var/data`  ·  **Size:** 1 GB
6. **Add environment variables** (Advanced → Environment):
   | Key | Value |
   |-----|-------|
   | `HOST` | `0.0.0.0` |
   | `CM_DATA_DIR` | `/var/data` |
   | `CM_PASSWORD` | your password |
   | `CM_ENCRYPTION_KEY` | the 64-char key you generated |
   | `CM_ANTHROPIC_API_KEY` | your Anthropic key (optional) |
7. Click **Create Web Service**. First build takes a few minutes.
8. When it goes live, open the URL Render gives you
   (`https://credit-monitor-xxxx.onrender.com`). You'll see the **password
   screen** — sign in.

> Prefer one-click? Copy `render.yaml` to the **root** of your repo and use
> Render's **Blueprint** flow instead — it pre-fills everything above except the
> three secrets, which you paste in once.

---

## Put it on your phone's home screen

- **iPhone (Safari):** open the URL → Share button → **Add to Home Screen**.
- **Android (Chrome):** open the URL → menu (⋮) → **Install app** / **Add to Home Screen**.

It opens full-screen like a real app, and stays signed in.

---

## Notes

- **Your data lives on the Render disk** at `/var/data`, encrypted at rest for the
  sensitive bits. Keep `CM_ENCRYPTION_KEY` stable — if you change it, previously
  saved last-4 digits can't be decrypted.
- **Screenshots** you upload are sent to Anthropic's API to be read, then
  discarded. Only do this with screenshots you're comfortable sending.
- **Backups:** download `/var/data/credit-monitor.db` from the Render shell
  occasionally, or use the CSV export.
- **Cost control:** the default reader model is `claude-opus-4-8` (most accurate).
  To spend less per scan, set `CM_VISION_MODEL=claude-haiku-4-5` in the env vars.
