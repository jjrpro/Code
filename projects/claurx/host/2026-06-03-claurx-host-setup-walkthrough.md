---
created: 2026-06-03
tags:
  - claurx
  - infrastructure
  - setup
status: action
---

# CLAURX — Host Setup Walkthrough (2026-06-03)

> One-line summary: The 15-minute, click-by-click path to stand up the $6/mo
> always-on box for self-driving CLAURX. You do steps 1–4 (create the box +
> paste one command). Then you hand me access and I do the rest.

**Why you and not me:** creating a cloud account needs your card, email, and
phone verification — legally and technically yours to do. Once the box exists,
deployment is one command (already written: `setup-host.sh`), then I take over.

---

## Step 1 — Create the server (~5 min)

Using **DigitalOcean** (simplest UX; Hetzner/Vultr work the same way):

1. Go to **digitalocean.com** → Sign up (Google login is fastest) → add your card.
2. Top-left **Create → Droplets**.
3. Choose:
   - **Region:** New York (closest to you).
   - **Image:** Ubuntu 24.04 LTS.
   - **Size:** Basic → Regular → **$6/mo** (1 GB / 1 vCPU) — plenty.
   - **Authentication:** **Password** (simplest) — set a strong root password and
     save it. (SSH key is more secure; password is fine for v1.)
4. **Create Droplet.** Wait ~1 min. Copy the **IP address** it shows.

## Step 2 — Open the box's terminal (~1 min)

In DigitalOcean: your droplet → top-right **Console** (opens a terminal in the
browser — no software to install). Log in as `root` with the password from Step 1.

## Step 3 — Paste ONE command (~3 min, it runs itself)

```bash
curl -fsSL https://raw.githubusercontent.com/jjrpro/code/claude/ecstatic-allen-5Z9Ay/projects/claurx/host/setup-host.sh | bash
```

This installs Node, clones CLAURX, sets the clock to EST, creates the key files,
runs a test briefing, and installs the 11AM + 9:30PM cron. When it finishes it
prints "CLAURX host is bootstrapped."

> If the repo is private, the clone will ask for a GitHub login — tell me and
> I'll switch the script to a token/deploy-key method instead.

## Step 4 — Hand me access

Reply with the droplet **IP** and the **root password** (or better: create a
user for me / add an SSH key — say the word and I'll give you those two lines).
Paste them and I'll connect.

---

## Then I take over (the rest is mine, ~1–2 hrs)

5. Wire **delivery** — Telegram bot (recommended) or email, so the 11AM briefing
   lands on your phone. I'll set up the bot token + chat ID in `host.env`.
6. Connect **data sources** as keys come in: weather (free key), MGC/MNQ news,
   Google Calendar (one-time OAuth), and the Shopify store read (after you
   approve the app).
7. Flip each `briefing.config.json` section on, run a **live end-to-end test**,
   and confirm the cron fires.
8. Turn on **watch-for triggers** (low stock, unusual spend, thresholds).

At that point CLAURX is self-driving: briefs you at 11, recaps at night, watches
the store and the scoreboard — no summoning required.

---

## Security note (plain English)

- Keys live **only** in git-ignored `.env` files on your box — never in the repo,
  never in chat.
- The box is yours; you can change the password or destroy it anytime (DO →
  Destroy). If you ever want me out, rotate the password and I'm locked out.
- For tighter security, use an SSH key instead of a password and give me a
  non-root user — ask and I'll hand you the exact two commands.
