#!/usr/bin/env node
// notify.js — push a one-off message (and/or file) to the Jaurx Telegram chat(s).
// Run on the Mac (the cloud sandbox can't reach Telegram).
//
// Usage:
//   node notify.js "✅ Deployed Top Notch: https://topnotchbarbershop.netlify.app"
//   node notify.js --file ./PREVIEW-LINKS.html "📎 All site previews"
//   echo "multi-line message" | node notify.js
'use strict';
const { loadConfig, sendMessage, sendFile } = require('./notify-lib');

async function main() {
  const argv = process.argv.slice(2);

  // Optional --file <path>
  let filePath = null;
  const fi = argv.indexOf('--file');
  if (fi !== -1) {
    filePath = argv[fi + 1];
    argv.splice(fi, 2);
  }

  let text = argv.join(' ').trim();
  if (!text && !filePath && !process.stdin.isTTY) {
    text = await new Promise((resolve) => {
      let buf = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (d) => (buf += d));
      process.stdin.on('end', () => resolve(buf.trim()));
    });
  }

  if (!text && !filePath) {
    console.error('Usage: node notify.js "message"   |   node notify.js --file <path> "caption"');
    process.exit(1);
  }

  const cfg = loadConfig();
  if (text && !filePath) await sendMessage(cfg, text);
  if (filePath) await sendFile(cfg, filePath, text || null);
  console.log('Sent to Telegram ✓');
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
