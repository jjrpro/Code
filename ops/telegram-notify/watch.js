#!/usr/bin/env node
// watch.js — post any new notes in ./outbox to Telegram, then move them to ./sent.
// Runs every 60s on the Mac via a LaunchAgent (see install-mac-notify.sh).
//
// Note format: plain markdown text. An optional attachment is declared with a
// line anywhere in the note:
//     ATTACH: projects/si-web-design/PREVIEW-LINKS.html   (path relative to repo root)
// The watcher strips ATTACH lines, posts the remaining text, then sends each file.
'use strict';
const fs = require('fs');
const path = require('path');
const { loadConfig, sendMessage, sendFile } = require('./notify-lib');

const OUTBOX = path.join(__dirname, 'outbox');
const SENT = path.join(__dirname, 'sent');
const REPO_ROOT = path.resolve(__dirname, '..', '..'); // ops/telegram-notify -> repo root

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

function parseNote(raw) {
  const attachments = [];
  const textLines = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*ATTACH:\s*(.+?)\s*$/i);
    if (m) attachments.push(m[1]);
    else textLines.push(line);
  }
  return { text: textLines.join('\n').trim(), attachments };
}

async function main() {
  if (!fs.existsSync(OUTBOX)) return;
  fs.mkdirSync(SENT, { recursive: true });

  const files = fs.readdirSync(OUTBOX).filter((f) => /\.(md|txt)$/i.test(f) && !f.startsWith('.')).sort();
  if (files.length === 0) return;

  const cfg = loadConfig();

  for (const file of files) {
    const src = path.join(OUTBOX, file);
    const { text, attachments } = parseNote(fs.readFileSync(src, 'utf8'));
    if (!text && attachments.length === 0) {
      fs.renameSync(src, path.join(SENT, file));
      continue;
    }
    try {
      if (text) await sendMessage(cfg, text);
      for (const rel of attachments) {
        const abs = path.isAbsolute(rel) ? rel : path.join(REPO_ROOT, rel);
        if (!fs.existsSync(abs)) {
          console.error(`[${ts()}] attachment missing, skipping: ${rel}`);
          continue; // don't block archiving on a missing file
        }
        await sendFile(cfg, abs, `📎 ${path.basename(abs)}`);
      }
      fs.renameSync(src, path.join(SENT, file));
      console.log(`[${ts()}] posted + archived ${file}`);
    } catch (e) {
      console.error(`[${ts()}] FAILED ${file}: ${e.message}`);
      break; // likely auth/network — leave in outbox to retry, stop this run
    }
  }
}

main().catch((e) => {
  console.error(`[${ts()}] watcher error: ${e.message}`);
  process.exit(1);
});
