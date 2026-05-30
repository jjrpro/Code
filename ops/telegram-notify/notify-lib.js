// notify-lib.js — shared helpers for the Jaurx Telegram notifier.
// Zero dependencies (built-in https/fs). Runs on the Mac, not the cloud.
// Supports broadcasting text AND file attachments to one or several chat IDs.
'use strict';
const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Normalize a chat-id value (string | number | array | comma-string) to string[].
function toChatIds(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  return String(v).split(',').map((x) => x.trim()).filter(Boolean);
}

// Load { token, chatIds:[...] } from env, then ~/.jaurx-telegram.json, then ./config.json.
// In the JSON files, "chatId" may be a string OR array; "chatIds" also accepted.
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
        if (chatIds.length === 0) chatIds = toChatIds(f.chatIds != null ? f.chatIds : f.chatId);
      } catch (e) {
        console.error(`[notify] could not parse ${p}: ${e.message}`);
      }
    }
  }
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

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', (d) => (b += d));
      res.on('end', () => {
        if (res.statusCode === 200) resolve(JSON.parse(b));
        else reject(new Error(`Telegram ${res.statusCode}: ${b}`));
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function postText(token, chatId, text) {
  const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false });
  return request(
    {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    },
    data
  );
}

function guessType(filename) {
  const ext = path.extname(filename).toLowerCase();
  return (
    {
      '.html': 'text/html', '.htm': 'text/html', '.md': 'text/markdown', '.txt': 'text/plain',
      '.csv': 'text/csv', '.json': 'application/json', '.pdf': 'application/pdf',
      '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.zip': 'application/zip',
    }[ext] || 'application/octet-stream'
  );
}

function buildMultipart(fields, file) {
  const boundary = '----JaurxNotify' + Math.random().toString(16).slice(2);
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${file.filename}"\r\n` +
      `Content-Type: ${file.contentType}\r\n\r\n`
    )
  );
  parts.push(file.data);
  parts.push(Buffer.from('\r\n'));
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(parts) };
}

function postDocument(token, chatId, filePath, caption) {
  const data = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const fields = { chat_id: String(chatId) };
  if (caption) {
    fields.caption = caption;
    fields.parse_mode = 'Markdown';
  }
  const { boundary, body } = buildMultipart(fields, { filename, contentType: guessType(filename), data });
  return request(
    {
      hostname: 'api.telegram.org',
      path: `/bot${token}/sendDocument`,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
    },
    body
  );
}

// Generic broadcaster: resolves if >=1 chat succeeds, throws only if ALL fail.
async function broadcast(cfg, sendOne) {
  const sent = [];
  const failed = [];
  for (const chatId of cfg.chatIds) {
    try {
      await sendOne(chatId);
      sent.push(chatId);
    } catch (e) {
      failed.push({ chatId, error: e.message });
    }
  }
  for (const f of failed) console.error(`[notify] failed for chat ${f.chatId}: ${f.error}`);
  if (sent.length === 0) {
    throw new Error(`All ${cfg.chatIds.length} chat(s) failed. First error: ${failed[0] ? failed[0].error : 'unknown'}`);
  }
  return { sent, failed };
}

// Broadcast a text message to every chat id (auto-splitting long messages).
function sendMessage(cfg, text) {
  const parts = chunk(text);
  return broadcast(cfg, async (chatId) => {
    for (const part of parts) await postText(cfg.token, chatId, part);
  });
}

// Broadcast a file attachment (with optional caption) to every chat id.
function sendFile(cfg, filePath, caption) {
  if (!fs.existsSync(filePath)) throw new Error(`attachment not found: ${filePath}`);
  return broadcast(cfg, (chatId) => postDocument(cfg.token, chatId, filePath, caption));
}

module.exports = { loadConfig, sendMessage, sendFile, chunk, toChatIds };
