---
date: 2026-05-31
project: jaurx-vip
status: ready-to-deploy
tags:
  - auto-post
  - telegram
  - growth
---

# Auto-Grow Setup — Telegram Daily Auto-Poster

**What this does**: Auto-posts your pre-open watchlist and EOD recap to the **JaurxTrades free Telegram channel** every trading day at the times you choose. Saves ~10 min/day and guarantees consistency (which is the #1 free-growth lever).

**Time to wire up**: ~15 minutes one-time setup. Then ~30 seconds/day to update levels.

---

## What you need

- Your bot token (the one already in your bot.js: `8733045334:AAEzoWAeteCTgD3a5N4iIoV5bdRpxyFqDHE`)
- The chat ID of your **JaurxTrades free channel** (public, NOT the private VIP one)
- Node.js on your Mac (you already have it from the stripe-diy setup)
- 15 min of one-time clicking

---

## Step 1 — Get the JaurxTrades free channel ID

1. Open Telegram on Mac or phone
2. Open the JaurxTrades free channel
3. Tap the channel name → **Settings/Info** → look for a "Username" or "Link" like `@JaurxTrades` or `t.me/JaurxTrades`
4. The channel ID is the username with `@` prefix (e.g., `@JaurxTrades`) — public channels accept that as a chat_id
5. If it's NOT public (private with invite link), you need the numeric ID: forward any message from the channel to `@userinfobot` on Telegram. It'll reply with the numeric ID (something like `-1001234567890`).

---

## Step 2 — Add env vars to your shell profile

On Mac, open `~/.zshrc` (or `~/.bash_profile` if you're still on bash) and add at the bottom:

```bash
export TELEGRAM_TOKEN="8733045334:AAEzoWAeteCTgD3a5N4iIoV5bdRpxyFqDHE"
export JAURXTRADES_CHANNEL_ID="@JaurxTrades"
```

(Replace `@JaurxTrades` with whatever the actual channel handle or numeric ID is.)

Then run:
```bash
source ~/.zshrc
```

Verify:
```bash
echo $JAURXTRADES_CHANNEL_ID
```
Should print the value you set.

---

## Step 3 — Create your daily levels file

In the synced repo on your Mac:

```bash
cd ~/Documents/Obsidian/JaurxOps/projects/jaurx-vip/auto-grow/
cp daily-levels.example.json daily-levels.json
```

Open `daily-levels.json` in any text editor (or directly in Obsidian — it lives in your vault) and update with today's actual levels.

**Each morning** (takes 30 seconds):
1. Open Obsidian → navigate to `projects/jaurx-vip/auto-grow/daily-levels.json`
2. Update the `mgc` and `mnq` blocks with today's levels from your pre-market routine
3. Save. (The sync will commit it; the auto-poster reads it locally so it works immediately.)

**End of trading day** (takes 1 minute):
1. Open the same file
2. Update the `eod` block with today's actual numbers
3. Save.

---

## Step 4 — Test the pre-open post manually

From terminal:
```bash
cd ~/Documents/Obsidian/JaurxOps/projects/jaurx-vip/auto-grow/
node daily-telegram-post.js preopen
```

If it works, you'll see:
```
Posting preopen to @JaurxTrades...
---
☕️ Pre-NY-Open Watchlist — Monday, Jun 1
...
---
Posted. message_id=12345
```

Check Telegram — the post should be live.

If it errors, the most likely issues:
- `Missing TELEGRAM_TOKEN or JAURXTRADES_CHANNEL_ID env vars` → your shell didn't pick up the new env vars; run `source ~/.zshrc` again
- `chat not found` → channel ID is wrong; double-check the handle or numeric ID
- `Forbidden: bot was kicked` → bot needs to be added to the channel as admin

---

## Step 5 — Schedule auto-posting (Mac launchd)

Install two LaunchAgents — one for pre-open (8:30am ET), one for EOD (5:00pm ET).

Create `~/Library/LaunchAgents/com.jjr.jaurx-preopen.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.jjr.jaurx-preopen</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/Users/johnreilly/Documents/Obsidian/JaurxOps/projects/jaurx-vip/auto-grow/daily-telegram-post.js</string>
    <string>preopen</string>
  </array>
  <key>StartCalendarInterval</key>
  <array>
    <dict>
      <key>Weekday</key><integer>1</integer>
      <key>Hour</key><integer>8</integer>
      <key>Minute</key><integer>30</integer>
    </dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>8</integer><key>Minute</key><integer>30</integer></dict>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>TELEGRAM_TOKEN</key><string>8733045334:AAEzoWAeteCTgD3a5N4iIoV5bdRpxyFqDHE</string>
    <key>JAURXTRADES_CHANNEL_ID</key><string>@JaurxTrades</string>
    <key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>StandardOutPath</key>
  <string>/Users/johnreilly/Library/Logs/jaurx-preopen.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/johnreilly/Library/Logs/jaurx-preopen.log</string>
</dict>
</plist>
```

Same idea for EOD — copy that file, change Label to `com.jjr.jaurx-eod`, change Hour to `17`, change Minute to `0`, change the `preopen` argument to `eod`, and change the log file name.

Load both:
```bash
launchctl load ~/Library/LaunchAgents/com.jjr.jaurx-preopen.plist
launchctl load ~/Library/LaunchAgents/com.jjr.jaurx-eod.plist
```

Times above are 8:30am and 5:00pm **system local time** on your Mac. If your Mac clock is ET, these match NY open prep and post-close.

---

## Step 6 — Verify scheduling

```bash
launchctl list | grep jaurx
```

Should show both agents. Wait until the next scheduled time and the post should appear in JaurxTrades automatically.

---

## What this leaves for you to do daily

Just **two 30-second edits to one JSON file**:
- Morning: fill in `mgc`/`mnq` levels + optional `catalyst`
- Evening: fill in `eod` block with today's actual trades

That's it. Posts happen automatically. Consistency = growth. You can't forget if you don't have to remember.

---

## What I can NOT automate (honest list)

1. **TikTok posting** — requires the TikTok app on your phone, plus their Content Posting API requires manual approval (1–2 weeks). Use the script templates in `2026-05-31-30-day-content-pack.md` instead — fill in today's numbers, record, post. ~10 min/day.

2. **Twitter/X posting** — possible with Twitter API v2 IF you set up a developer account (free, ~24h approval). I can scaffold the auto-poster the moment you tell me you have keys. For now: paste from the content pack.

3. **DMing cross-promo channels** — Telegram doesn't allow bots to DM users who haven't messaged the bot first. You have to send the swap DMs from your personal account. (Templates ready in `2026-05-31-cross-promo-target-list.md`.)

4. **Recording video** — you have the face/voice, I have only words. No path around this.

What you CAN delegate to me entirely: the **words to say**, the **post schedule**, the **strategy**, the **analytics tracking**.
