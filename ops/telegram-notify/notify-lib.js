// notify-lib.js — shared helpers for the Jaurx Telegram notifier.
// Zero dependencies (uses Node's built-in https). Runs on the Mac, not the cloud.
// Supports broadcasting to one OR several chat IDs.
'use strict';
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Normalize a chat-id value (string | number | array | comma-string) to string[].
function toChatIds(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v)
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

// Load { token, chatIds: [...] } from, in order:
//   1) env TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID (chat id may be comma-separated)
//   2) ~/.jaurx-telegram.json   (recommended — kept OUT of the synced repo)
//   3) ./config.json            (gitignored; fallback)
// In the JSON files, "chatId" may be a string OR an array; "chatIds" is also accepted.
function loadConfig() {
  let token = process.env.TELEGRAM_BOT_TOKEN || '';
  let chatIds = toChatIds(process.env.TELEGRAM_CHAT_ID);

  const candidates = [
    path.join(os.homedir(), '.jaurx-telegram.json'),
    path.join(__dirname, 'config.json'),
  ];
  for (const p of candidates) {
    if ((!token || chatIds.length === 0) && fs.existsSync(p)) {
      try {
        const f = JSON.parse(fs.readFileSync(p, 'utf8'));
        token = token || f.token || '';
        if (chatIds.length === 0) {
          chatIds = toChatIds(f.chatIds != null ? f.chatIds : f.chatId);
        }
      } catch (e) {
        console.error(`[notify] could not parse ${p}: ${e.message}`);
      }
    }
  }

  // de-dupe
  chatIds = [...new Set(chatIds)];

  if (!token || chatIds.length === 0) {
    throw new Error(
      'Missing Telegram token/chatId. Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID, ' +
      'or create ~/.jaurx-telegram.json with {"token":"...","chatId":["id1","id2"]}.'
    );
  }
  return { token, chatIds };
}

// Telegram caps messages at 4096 chars — split safely on line boundaries.
function chunk(text, max = 3900) {
  const out = [];
  let buf = '';
  for (const line of String(text).split('\n')) {
    if ((buf + '\n' + line).length > max) {
      if (buf) out.push(buf);
      buf = line.length > max ? line.slice(0, max) : line;
    } else {
      buf = buf ? buf + '\n' + line : line;
    }
  }
  if (buf) out.push(buf);
  return out.length ? out : [''];
}

function post(token, chatId, text) {
  const data = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  });
  const opts = {
    hostname: 'api.telegram.org',
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  };
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(body));
        else reject(new Error(`Telegram ${res.statusCode}: ${body}`));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Broadcast a message to every chat id, splitting long messages.
// Resolves if at least one chat received it; throws only if ALL chats failed
// (so e.g. a second account that hasn't pressed Start won't block the first).
async function sendMessage(cfg, text) {
  const parts = chunk(text);
  const sent = [];
  const failed = [];
  for (const chatId of cfg.chatIds) {
    try {
      for (const part of parts) await post(cfg.token, chatId, part);
      sent.push(chatId);
    } catch (e) {
      failed.push({ chatId, error: e.message });
    }
  }
  for (const f of failed) {
    console.error(`[notify] failed for chat ${f.chatId}: ${f.error}`);
  }
  if (sent.length === 0) {
    throw new Error(`All ${cfg.chatIds.length} chat(s) failed. First error: ${failed[0] ? failed[0].error : 'unknown'}`);
  }
  return { sent, failed };
}

module.exports = { loadConfig, sendMessage, chunk, toChatIds };
