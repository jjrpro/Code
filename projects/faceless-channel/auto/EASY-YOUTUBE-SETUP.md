---
date: 2026-05-31
project: faceless-channel
type: how-to
summary: Dead-simple, browser-only walkthrough for JR to authorize YouTube uploads for Curious Frame. No Terminal, no code. Produces 3 values Claude needs to turn on auto-publishing.
---

# YouTube Auto-Publish — Easy Browser Setup (no Terminal)

**Goal:** give the Curious Frame autopilot permission to upload to your YouTube.
**Time:** ~10 minutes. **You need:** the Curious Frame Google account logged in.
**End result:** 3 values to send me → auto-publishing is done.

> Do the whole thing signed in as the **Curious Frame** Google account
> (not your personal one). Open an Incognito window and log in as Curious Frame
> if that's easier.

---

## PART 1 — Turn on the YouTube API (≈2 min)

1. Go to **console.cloud.google.com**
2. At the very top, click the project name dropdown → **New Project**.
3. Name it `curious-frame` → **Create**. Wait ~10 sec, then make sure the top
   bar now shows `curious-frame`.
4. In the top search bar, type **YouTube Data API v3** → click it → click the
   blue **Enable** button.

✅ Done when you see "API Enabled."

---

## PART 2 — Set up the consent screen (≈3 min)

1. Left menu (☰) → **APIs & Services** → **OAuth consent screen**.
2. Choose **External** → **Create**.
3. Fill only the required boxes:
   - App name: `Curious Frame`
   - User support email: pick your email from the dropdown
   - Developer contact email: type your email
4. Click **Save and Continue**.
5. On the "Scopes" page → just click **Save and Continue** (skip it).
6. On the "Test users" page → click **+ Add Users** → type your **Curious Frame
   Gmail address** → **Add** → **Save and Continue**. ⚠️ Don't skip this one.
7. Click **Back to Dashboard**.

✅ Done when the consent screen shows your app name.

---

## PART 3 — Create the credentials (≈2 min)

1. Left menu → **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** (top) → **OAuth client ID**.
3. Application type: **Web application**.
4. Name: `curious-frame-web`.
5. Under **Authorized redirect URIs**, click **+ Add URI** and paste exactly:
   ```
   https://developers.google.com/oauthplayground
   ```
6. Click **Create**.
7. A popup shows **Your Client ID** and **Your Client Secret**.
   👉 Copy both into a note — you'll need them in Part 4. Keep them private.

✅ Done when you have the Client ID + Client Secret saved.

---

## PART 4 — Get the magic token (≈3 min, all in browser)

This uses Google's official "OAuth Playground" — no code.

1. Go to **developers.google.com/oauthplayground**
2. Top-right, click the **⚙️ gear icon** (Settings).
3. Check the box **"Use your own OAuth credentials."**
4. Paste your **Client ID** and **Client Secret** from Part 3 into the two boxes.
   Leave the gear panel open or close it — either is fine.
5. On the LEFT side, find the box that says **"Input your own scopes."**
   Paste this exactly and click the blue **Authorize APIs** button under it:
   ```
   https://www.googleapis.com/auth/youtube.upload
   ```
6. A Google login appears → choose the **Curious Frame** account.
7. You'll see **"Google hasn't verified this app."** That's normal (it's your own
   app). Click **Continue** (or Advanced → Go to Curious Frame).
8. Click **Continue / Allow** to grant access.
9. You're back on the Playground. Click the blue button
   **"Exchange authorization code for tokens."**
10. A **Refresh token** appears (a long string starting with `1//`).
    👉 Copy it into your note.

✅ Done when you have a Refresh token.

---

## PART 5 — Send me the 3 values

You now have three things. Save them somewhere private. When you're ready to go
live, I'll tell you exactly where each goes (into Render as secrets — I never
need your password, just these):

1. **Client ID**
2. **Client Secret**
3. **Refresh token** (starts with `1//`)

> Heads up on safety: these 3 let the autopilot post to your channel. Treat them
> like a password. When we deploy, you'll paste them into Render's secret boxes
> yourself — you don't have to send them in plain chat if you'd rather not.

---

## If you get stuck
Tell me the part number and what you see on screen ("Part 4 step 7, it says X")
and I'll unstick you. There's nothing here you can break — worst case we delete
the project and redo it in 10 minutes.
