// notify-lib.js — shared helpers for the Jaurx Telegram notifier.
// Zero dependencies (uses Node's built-in https). Runs on the Mac, not the cloud.
'use strict';
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Load { token, chatId } from, in order:
//   1) env TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID
//   2) ~/.jaurx-telegram.json   (recommended — kept OUT of the synced repo)
//   3) ./config.json            (gitignored; fallback)
function loadConfig() {
  let token = process.env.TELEGRAM_BOT_TOKEN || '';
  let chatId = process.env.TELEGRAM_CHAT_ID || '';

  const candidates = [
    path.join(os.homedir(), '.jaurx-telegram.json'),
    path.join(__dirname, 'config.json'),
  ];
  for (const p of candidates) {
    if ((!token || !chatId) && fs.existsSync(p)) {
      try {
        const f = JSON.parse(fs.readFileSync(p, 'utf8'));
        token = token || f.token || '';
        chatId = chatId || f.chatId || '';
      } catch (e) {
        console.error(`[notify] could not parse ${p}: ${e.message}`);
      }
    }
  }
  if (!token || !chatId) {
    throw new Error(
      'Missing Telegram token/chatId. Set TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID, ' +
      'or create ~/.jaurx-telegram.json with {"token":"...","chatId":"..."}.'
    );
  }
  return { token, chatId };
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

function post(cfg, text) {
  const data = JSON.stringify({
    chat_id: cfg.chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: false,
  });
  const opts = {
    hostname: 'api.telegram.org',
    path: `/bot${cfg.token}/sendMessage`,
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

// Send a message, automatically splitting if it's too long.
async function sendMessage(cfg, text) {
  const parts = chunk(text);
  const results = [];
  for (const part of parts) results.push(await post(cfg, part));
  return results;
}

module.exports = { loadConfig, sendMessage, chunk };
