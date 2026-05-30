# Jaurx Claude Bot

A Claude-powered Telegram assistant. You message **@JaurxDesignBot**, it asks
Claude, and replies — with context about your Staten Island web-design business.

> ⚠️ **Runs on your Mac, not the cloud** (the web sandbox can't reach Telegram or
> Anthropic). Single self-contained file — no `npm install`, no other files.

## One-time setup

1. **Get an Anthropic API key:** https://console.anthropic.com → **API keys** →
   **Create Key**. Add a little billing credit (each chat costs cents). The key
   looks like `sk-ant-api03-...`.
2. You already have your **Telegram bot token** from @BotFather (`8629...:AA...`).

## Run it (one line — paste your REAL token + key)

```bash
TELEGRAM_BOT_TOKEN='YOUR_BOT_TOKEN' ANTHROPIC_API_KEY='YOUR_ANTHROPIC_KEY' \
  node ~/Downloads/jaurx-claude-bot.js
```

You should see `Connected as @JaurxDesignBot`. Now message the bot in Telegram.

- Keep the Terminal window open to keep it running. **Ctrl+C** stops it.
- To keep running while the screen sleeps: prefix with `caffeinate -i`.
- Only your two accounts (chat IDs 5680523955 / 7797025333) can talk to it.

## Commands

- `/help` — intro
- `/reset` — clear the conversation history for that chat
- anything else — answered by Claude

## Settings (top of `jaurx-claude-bot.js`)

- `MODEL` — defaults to `claude-opus-4-8`. For cheaper/faster replies, change to
  `claude-haiku-4-5`.
- `ALLOWED_CHAT_IDS` — who may use the bot.
- `SYSTEM_PROMPT` — the bot's personality/knowledge.

## Notes

- **Cost:** each message is a Claude API call billed to your Anthropic account.
  Opus is the smartest but priciest; switch `MODEL` to Haiku to cut cost ~5x.
- **Keys are never stored in this file** — they come from the run command, so the
  file is safe to keep in the repo. Don't paste your key into the file and commit it.
- Conversation history is in memory only (cleared when you stop the bot or `/reset`).
