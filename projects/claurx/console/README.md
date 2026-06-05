# CLAURX · Console — see + hear her, today

A single self-contained file. No install, no server, no $6 box. You open it in
**Chrome on your Mac** and CLAURX has a face you see, a British voice you hear,
and a mic you talk into. Conversation is wired to Claude with **your own API
key, stored only in your browser** (sent only to Anthropic, never to this repo).

## Start (2 minutes)
1. Get the file onto your Mac — it syncs to your Obsidian vault, or pull the repo:
   `projects/claurx/console/index.html`
2. **Double-click it** (opens in your default browser; use **Chrome** for the mic).
3. Click **⚙︎** → paste your **Anthropic API key** (`sk-ant-…`) → pick a voice →
   **Save**. (Get a key at console.anthropic.com → API Keys.)
4. Click **▶ test voice** to hear her. Then press **🎙️** and talk, or type and hit
   Send. She answers **aloud**.

## What you get
- **See** — a butler-styled voice orb that breathes when idle, glows gold while
  listening, pulses while speaking.
- **Hear** — replies spoken in a British female voice (best match your OS offers;
  Chrome ships "Google UK English Female").
- **Talk** — push-to-talk mic (Chrome/Edge speech recognition).
- **Real CLAURX** — the full persona (butler voice, blunt, evidence-first,
  honesty over persona) loaded as the system prompt; live answers from Claude.
- **Private** — key + settings live in `localStorage` on your machine only.

## Honest limits
- **Mic** needs Chrome or Edge (Safari won't expose speech recognition). Typing
  works everywhere.
- **Voice quality** depends on your OS voices. For a premium British voice later,
  we can swap the browser voice for ElevenLabs (cloud, paid) — Phase 4.
- This console is the **see/hear/talk** layer. The **self-driving** layer (11AM
  briefing on its own, watches store/trading 24/7) still needs the always-on box
  — see `../host/2026-06-03-claurx-host-setup-walkthrough.md`. Different jobs:
  this one is "CLAURX I talk to"; that one is "CLAURX that runs without me."
- It costs per message against your Anthropic key (pennies on Sonnet/Haiku).

## Models
Default **Sonnet 4.6** (fast, good for voice). Switch to **Opus 4.8** (most
capable) or **Haiku 4.5** (fastest) in ⚙︎.

## All devices — put it online once, open it anywhere (~2 min, free)
The console is a static page, so one HTTPS link works on Mac, Windows, iPhone,
iPad — and **installs like an app** (home-screen icon) on each. Hosting on HTTPS
also makes the mic work remotely (a local file can't on phones).

**Fastest, no account-fuss — Netlify Drop:**
1. On your Mac, open **app.netlify.com/drop** in Chrome.
2. Drag the **whole `console/` folder** (index.html, manifest, icon, sw.js)
   onto the page. It returns an HTTPS URL like `https://claurx-xyz.netlify.app`.
3. Open that URL on **every device**. Paste your API key once per device (⚙︎).
4. **Install it:** iPhone Safari → Share → *Add to Home Screen*. Desktop Chrome →
   the install icon in the address bar. Now it's an app called **CLAURX**.

(Cloudflare Pages or any static host works the same. Rename the URL in Netlify's
site settings to something memorable like `claurx-jr`.)

**Honest device notes:**
- **iPhone/iPad:** voice-out (hear her) + **typing** + home-screen app all work.
  The text box at the bottom is your input on phone — type, Send, she replies
  aloud + on screen. The **push-to-talk mic does not** work on iOS (Apple exposes
  no speech recognition), so the mic button is hidden there automatically. The
  layout collapses to a phone-friendly view (compact orb on top, chat + typing
  fill the screen).
- When the always-on box is up, it can **serve this same page** *and* run the
  self-driving briefing — one box, everything unified. Until then, Netlify gives
  you all-devices access today for free.
