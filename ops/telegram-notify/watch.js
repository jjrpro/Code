#!/usr/bin/env node
// watch.js — post any new notes in ./outbox to Telegram, then move them to ./sent.
// Designed to run every 60s on the Mac via a LaunchAgent (see install-mac-notify.sh).
//
// How the pipeline works:
//   1) Claude (web session) drops a .md note into ops/telegram-notify/outbox/
//   2) Your repo/vault sync pulls it down to the Mac (~60s)
//   3) This watcher posts each note to your Telegram chat, then moves it to sent/
//
// Idempotent + safe: only posts files in outbox/, moves them after a successful send.
'use strict';
const fs = require('fs');
const path = require('path');
const { loadConfig, sendMessage } = require('./notify-lib');

const OUTBOX = path.join(__dirname, 'outbox');
const SENT = path.join(__dirname, 'sent');

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

async function main() {
  if (!fs.existsSync(OUTBOX)) return; // nothing to do
  fs.mkdirSync(SENT, { recursive: true });

  const files = fs
    .readdirSync(OUTBOX)
    .filter((f) => /\.(md|txt)$/i.test(f) && !f.startsWith('.'))
    .sort(); // chronological if named with timestamps

  if (files.length === 0) return;

  const cfg = loadConfig();

  for (const file of files) {
    const src = path.join(OUTBOX, file);
    const text = fs.readFileSync(src, 'utf8').trim();
    if (!text) {
      fs.renameSync(src, path.join(SENT, file));
      continue;
    }
    try {
      await sendMessage(cfg, text);
      fs.renameSync(src, path.join(SENT, file));
      console.log(`[${ts()}] posted + archived ${file}`);
    } catch (e) {
      // Leave the file in outbox so it retries next run; surface the error.
      console.error(`[${ts()}] FAILED ${file}: ${e.message}`);
      break; // stop on first failure (likely auth/network) to avoid spamming errors
    }
  }
}

main().catch((e) => {
  console.error(`[${ts()}] watcher error: ${e.message}`);
  process.exit(1);
});
