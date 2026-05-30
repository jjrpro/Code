#!/usr/bin/env node
/* =============================================================================
   jaurx-notify.js  —  SELF-CONTAINED Telegram sender (no other files needed)
   =============================================================================
   WHY THIS EXISTS: the earlier version was split across files and depended on a
   repo/vault sync. This one is a single file with everything inside it.

   HOW TO USE (Mac):
     1) Put this file and PREVIEW-LINKS.html in the SAME folder (e.g. Downloads).
     2) Paste your bot token below where it says PASTE_YOUR_BOT_TOKEN_HERE.
     3) Run:   node ~/Downloads/jaurx-notify.js
        -> sends the breakdown message + attaches PREVIEW-LINKS.html to both chats.

   Other ways to run it:
     node jaurx-notify.js "any custom message"
     node jaurx-notify.js --file /path/to/file.pdf "caption"
   ============================================================================= */
'use strict';
const https = require('https');
const fs = require('fs');
const path = require('path');

// ---------------------- CONFIG: edit these two lines -------------------------
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'PASTE_YOUR_BOT_TOKEN_HERE';
const CHAT_IDS  = ['5680523955', '7797025333'];   // both accounts
// -----------------------------------------------------------------------------

// Default message (the daily breakdown) — used if you don't pass your own text.
const DEFAULT_MESSAGE =
`📊 *Jaurx Web Design — Today's Build (2026-05-30)*

Built *8* website mockups for Staten Island businesses with no website. *3 are live & pitched*, 5 built and ready to deploy.

✅ *LIVE & pitched:*
1. 💈 Top Notch Barber — topnotchbarbershop.netlify.app
2. 🥐 Annadale Bakery — annadalebakery.netlify.app
3. 👗 A Very Chic Boutique — a-very-chic-boutique.netlify.app

🟡 *Built, ready to deploy:*
4. 💅 Eltingville Nail Salon
5. 🥯 M & M Deli & Bagels
6. ✂️ Maria Alterations & Tailoring
7. 🍪 Cookies N Cream
8. 🥩 Regina Annadale Meat Market

📎 Full clickable breakdown attached below.`;

// Default attachment: PREVIEW-LINKS.html sitting next to this script.
const DEFAULT_ATTACHMENT = path.join(__dirname, 'PREVIEW-LINKS.html');

function request(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let b = '';
      res.on('data', (d) => (b += d));
      res.on('end', () => (res.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(`HTTP ${res.statusCode}: ${b}`))));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function sendMessage(chatId, text) {
  const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', disable_web_page_preview: false });
  return request({
    hostname: 'api.telegram.org', path: `/bot${BOT_TOKEN}/sendMessage`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
  }, data);
}

function sendDocument(chatId, filePath, caption) {
  const fileData = fs.readFileSync(filePath);
  const boundary = '----jaurx' + Math.random().toString(16).slice(2);
  const head = [];
  head.push(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chatId}\r\n`);
  if (caption) head.push(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`);
  head.push(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${path.basename(filePath)}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
  const body = Buffer.concat([Buffer.from(head.join('')), fileData, Buffer.from(`\r\n--${boundary}--\r\n`)]);
  return request({
    hostname: 'api.telegram.org', path: `/bot${BOT_TOKEN}/sendDocument`, method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
  }, body);
}

async function main() {
  if (!BOT_TOKEN || BOT_TOKEN === 'PASTE_YOUR_BOT_TOKEN_HERE') {
    console.error('❌ Edit this file and paste your bot token into BOT_TOKEN at the top (or set TELEGRAM_BOT_TOKEN).');
    process.exit(1);
  }

  // Parse optional CLI: [--file <path>] [message words...]
  const argv = process.argv.slice(2);
  let filePath = null;
  const fi = argv.indexOf('--file');
  if (fi !== -1) { filePath = argv[fi + 1]; argv.splice(fi, 2); }
  const customText = argv.join(' ').trim();

  const message = customText || DEFAULT_MESSAGE;
  const attachment = filePath || (fs.existsSync(DEFAULT_ATTACHMENT) ? DEFAULT_ATTACHMENT : null);

  let ok = 0, fail = 0;
  for (const chatId of CHAT_IDS) {
    try {
      await sendMessage(chatId, message);
      if (attachment) await sendDocument(chatId, attachment, '📎 PREVIEW-LINKS.html — open in a browser, tap any link');
      console.log(`✓ sent to ${chatId}`);
      ok++;
    } catch (e) {
      console.error(`✗ ${chatId}: ${e.message}`);
      fail++;
    }
  }
  if (attachment) console.log(`(attached: ${attachment})`);
  else console.log('(no attachment found — sent text only. Put PREVIEW-LINKS.html next to this script to attach it.)');
  console.log(`Done. ${ok} sent, ${fail} failed.`);
  if (ok === 0) process.exit(1);
}

main().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
