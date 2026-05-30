# Jaurx Telegram Notifier

Pushes **finished work and pitches to your Telegram chat**. Built to fit your
existing setup: Claude (web) drops notes into `outbox/`, your repo sync carries
them to the Mac, and a watcher on the Mac posts them to Telegram.

> ⚠️ **Runs on your Mac, not the cloud.** The Claude Code web sandbox is
> egress-blocked from `api.telegram.org`, so the actual posting happens on your
> Mac (which already runs your Obsidian sync and can reach Telegram).

## How it works

```
Claude (web) writes a note ──► ops/telegram-notify/outbox/2026-05-30-topnotch.md
        │  (committed + synced like everything else, ~60s)
        ▼
Mac watcher (every 60s) ──► posts note to your Telegram chat ──► moves it to sent/
```

Plus a manual one-off command whenever you want: `node notify.js "message"`.

## One-time setup (~5 min, on your Mac)

1. **Create the bot:** open Telegram → message **@BotFather** → `/newbot` →
   follow prompts → copy the **token** it gives you.
2. **Get your chat id:**
   - For a personal chat: DM **@userinfobot**, it replies with your id.
   - For a group: add your new bot to the group, send any message, then open
     `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser and copy
     `"chat":{"id": ... }`.
3. **Save your creds OUTSIDE the repo** (so the token is never committed).
   `chatId` can be one id or a list — list = broadcast to several people:
   ```bash
   echo '{"token":"YOUR_TOKEN","chatId":["FIRST_ID","SECOND_ID"]}' > ~/.jaurx-telegram.json
   chmod 600 ~/.jaurx-telegram.json
   ```
   > Every recipient must **press Start on the bot once** (open @JaurxDesignBot →
   > Start), or the bot can't DM them and that id will fail with `403`. A failing
   > id won't block the others — it just gets skipped and logged.
4. **Install the watcher:**
   ```bash
   bash ~/Documents/Obsidian/JaurxOps/ops/telegram-notify/install-mac-notify.sh
   ```
   (Pass your repo path as an argument if it's somewhere else.)
5. **Test it:**
   ```bash
   node ~/Documents/Obsidian/JaurxOps/ops/telegram-notify/notify.js "✅ Notifier is live"
   ```
   You should get the message in your chat.

## Files

| File | What it does |
|---|---|
| `notify.js` | Manual one-off push: `node notify.js "message"` (or pipe via stdin) |
| `watch.js` | Posts new `outbox/*.md` notes to Telegram, moves them to `sent/` |
| `notify-lib.js` | Shared Bot-API logic (no dependencies) |
| `install-mac-notify.sh` | Installs the 60s LaunchAgent watcher on the Mac |
| `config.example.json` | Template for creds (real creds go in `~/.jaurx-telegram.json`) |
| `outbox/` | Drop notes here to be posted (Claude writes here) |
| `sent/` | Posted notes are moved here (gitignored) |

## Security

- The bot **token is a secret.** `config.json` and `sent/` are gitignored, and
  the recommended location for creds is `~/.jaurx-telegram.json` (never in the repo).
- If a token ever leaks, message @BotFather → `/revoke` and make a new one.

## Notes

- No `npm install` needed — uses Node's built-in `https`.
- Messages over Telegram's 4096-char limit are split automatically.
- If a post fails (e.g. Mac offline), the note stays in `outbox/` and retries
  on the next run — nothing is lost. Errors show in
  `~/Library/Logs/jjr-telegram-notify.log`.
