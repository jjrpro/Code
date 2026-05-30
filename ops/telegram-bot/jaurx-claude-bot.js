#!/usr/bin/env node
/* =============================================================================
   jaurx-claude-bot.js — a Claude-powered Telegram bot (single self-contained file)
   =============================================================================
   You message @JaurxDesignBot in Telegram → this program asks Claude → replies.
   Runs on your Mac (this can't run in the cloud — no Telegram/Anthropic egress there).

   PREREQS:
     1) Node.js (you have it).
     2) An Anthropic API key — make one at https://console.anthropic.com
        → API keys → Create Key. Add a little billing credit (chats cost cents).
        A real key looks like:  sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx
     3) Your Telegram bot token (from @BotFather, format 8629...:AA...).

   RUN IT (one line — paste your REAL token + key; nothing to edit in this file):
     TELEGRAM_BOT_TOKEN='YOUR_BOT_TOKEN' ANTHROPIC_API_KEY='YOUR_ANTHROPIC_KEY' \
       node ~/Downloads/jaurx-claude-bot.js

   Then open @JaurxDesignBot in Telegram and send a message.
   Leave the Terminal window open to keep it running. Ctrl+C to stop.
   (To keep it alive when your screen sleeps: prefix with `caffeinate -i`.)
   ============================================================================= */
'use strict';
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ---- credentials (from env, or ~/.jaurx-telegram.json for the bot token) ----
function fromJson(file, key) {
  try {
    const p = path.join(os.homedir(), file);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))[key];
  } catch (_) {}
  return undefined;
}
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || fromJson('.jaurx-telegram.json', 'token');
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || fromJson('.jaurx-bot.json', 'anthropicKey');

// Only these chats may talk to the bot (your two accounts). Not secret.
const ALLOWED_CHAT_IDS = ['5680523955', '7797025333'];

// Model + behavior. Change MODEL to 'claude-haiku-4-5' for cheaper/faster replies.
const MODEL = 'claude-opus-4-8';
const MAX_TOKENS = 2048;
const MAX_HISTORY = 20; // messages kept per chat

const SYSTEM_PROMPT =
`You are Jaurx Assistant, a sharp, friendly helper for JR (John) on Telegram.
You help him run a local web-design side business on Staten Island: building simple
1-page websites for small businesses that have none, then pitching the owners via
Instagram DM, phone, or walk-in. Pricing: $400 one-time build, or $400 + $40/month
"Care Plan" (hosting + edits). Sites are deployed free on Netlify; domains via
Namecheap (~$12/yr, registered in the client's name). He's not a developer — give
him clear, paste-ready, practical answers. Be concise and useful. You can also help
with anything else he asks. If you don't know something current, say so.`;

if (!TELEGRAM_TOKEN || !ANTHROPIC_KEY) {
  console.error('❌ Missing credentials.\n' +
    '   Run it like this (paste your REAL token + key):\n' +
    "   TELEGRAM_BOT_TOKEN='8629...:AA...' ANTHROPIC_API_KEY='sk-ant-...' node " + __filename);
  process.exit(1);
}

// ---------------------------- tiny HTTPS helpers -----------------------------
function httpsRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', (d) => (b += d));
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    if (opts.timeoutMs) req.setTimeout(opts.timeoutMs, () => req.destroy(new Error('timeout')));
    if (body) req.write(body);
    req.end();
  });
}

// ------------------------------- Telegram ------------------------------------
async function tg(method, params, timeoutMs) {
  const data = JSON.stringify(params);
  const res = await httpsRequest(
    {
      hostname: 'api.telegram.org',
      path: `/bot${TELEGRAM_TOKEN}/${method}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeoutMs,
    },
    data
  );
  return JSON.parse(res.body);
}

async function sendChunked(chatId, text) {
  // Telegram caps messages at 4096 chars.
  const max = 3900;
  for (let i = 0; i < text.length; i += max) {
    await tg('sendMessage', { chat_id: chatId, text: text.slice(i, i + max) });
  }
}

// -------------------------------- Claude -------------------------------------
async function askClaude(messages) {
  const payload = JSON.stringify({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages,
  });
  const res = await httpsRequest(
    {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeoutMs: 120000,
    },
    payload
  );
  if (res.status !== 200) {
    throw new Error(`Anthropic ${res.status}: ${res.body.slice(0, 300)}`);
  }
  const data = JSON.parse(res.body);
  return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
    || '(no response)';
}

// ------------------------------ conversation ---------------------------------
const histories = new Map(); // chatId -> [{role, content}]

function getHistory(chatId) {
  if (!histories.has(chatId)) histories.set(chatId, []);
  return histories.get(chatId);
}

async function handleMessage(chatId, text) {
  if (!ALLOWED_CHAT_IDS.includes(String(chatId))) return; // ignore strangers

  const trimmed = text.trim();
  if (trimmed === '/start' || trimmed === '/help') {
    return sendChunked(chatId,
      "👋 I'm Jaurx Assistant, powered by Claude. Ask me anything — sites to pitch, " +
      "what to say to an owner, deploy steps, or general questions.\n\n/reset — clear our chat history");
  }
  if (trimmed === '/reset') {
    histories.set(chatId, []);
    return sendChunked(chatId, '🧹 Cleared. Fresh start.');
  }

  const history = getHistory(chatId);
  history.push({ role: 'user', content: trimmed });

  tg('sendChatAction', { chat_id: chatId, action: 'typing' }).catch(() => {});

  try {
    const reply = await askClaude(history);
    history.push({ role: 'assistant', content: reply });
    // trim history
    while (history.length > MAX_HISTORY) history.shift();
    await sendChunked(chatId, reply);
  } catch (e) {
    console.error('Claude error:', e.message);
    history.pop(); // drop the user turn we couldn't answer
    await sendChunked(chatId, '⚠️ Error talking to Claude: ' + e.message);
  }
}

// ------------------------------- main loop -----------------------------------
async function main() {
  console.log('🤖 jaurx-claude-bot running. Model:', MODEL);
  console.log('   Allowed chats:', ALLOWED_CHAT_IDS.join(', '));
  console.log('   Message @JaurxDesignBot in Telegram. Ctrl+C to stop.\n');

  // sanity: confirm the bot token works
  const me = await tg('getMe', {});
  if (!me.ok) { console.error('❌ Bad bot token:', JSON.stringify(me)); process.exit(1); }
  console.log('   Connected as @' + me.result.username);

  let offset = 0;
  // drain any backlog so we don't reply to old messages on startup
  const init = await tg('getUpdates', { timeout: 0, offset: -1 });
  if (init.ok && init.result.length) offset = init.result[init.result.length - 1].update_id + 1;

  while (true) {
    try {
      const res = await tg('getUpdates', { timeout: 50, offset, allowed_updates: ['message'] }, 60000);
      if (!res.ok) { await sleep(2000); continue; }
      for (const u of res.result) {
        offset = u.update_id + 1;
        const msg = u.message;
        if (msg && typeof msg.text === 'string') {
          handleMessage(msg.chat.id, msg.text);
        }
      }
    } catch (e) {
      console.error('poll error:', e.message);
      await sleep(2000);
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
main().catch((e) => { console.error('Fatal:', e.message); process.exit(1); });
