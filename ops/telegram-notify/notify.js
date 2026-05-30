#!/usr/bin/env node
// notify.js — push a one-off message to the Jaurx Telegram chat.
// Run on the Mac (the cloud sandbox can't reach Telegram).
//
// Usage:
//   node notify.js "✅ Deployed Top Notch: https://topnotchbarbershop.netlify.app"
//   echo "multi-line message" | node notify.js
'use strict';
const { loadConfig, sendMessage } = require('./notify-lib');

async function main() {
  let text = process.argv.slice(2).join(' ').trim();

  // Allow piping text in via stdin if no args given.
  if (!text && !process.stdin.isTTY) {
    text = await new Promise((resolve) => {
      let buf = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (d) => (buf += d));
      process.stdin.on('end', () => resolve(buf.trim()));
    });
  }

  if (!text) {
    console.error('Usage: node notify.js "your message"  (or pipe text via stdin)');
    process.exit(1);
  }

  const cfg = loadConfig();
  await sendMessage(cfg, text);
  console.log('Sent to Telegram ✓');
}

main().catch((e) => {
  console.error('Failed:', e.message);
  process.exit(1);
});
