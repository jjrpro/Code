'use strict';

// Backup & restore. Your data lives in one SQLite file on the host's disk — on
// a cheap cloud host that disk can be lost. This module:
//   - exports a full JSON snapshot (cards with last-4 decrypted, scores,
//     inquiries, payments, check-ins) you can download or restore from,
//   - keeps rotated snapshots on disk (CM_DATA_DIR/backups), and
//   - emails a copy OFF the server (if SMTP is configured) so a disk loss
//     never wipes your history.
//
// Restore remaps card IDs so payment links stay correct.

const fs = require('fs');
const path = require('path');
const db = require('../db');
const config = require('../config');
const cards = require('../models/cards');
const seed = require('../seed');
const email = require('../notify/email');

const VERSION = 1;

function stamp(d = new Date()) {
  return d.toISOString().replace(/:/g, '-').replace(/\..+$/, '').replace('T', '_');
}

// ── Export ──
function exportData() {
  return {
    app: 'credit-monitor',
    version: VERSION,
    exportedAt: new Date().toISOString(),
    cards: cards.list({ includeInactive: true }), // last4 decrypted (your own data)
    scores: db.prepare('SELECT * FROM scores ORDER BY date, id').all(),
    inquiries: db.prepare('SELECT * FROM inquiries ORDER BY date, id').all(),
    payments: db.prepare('SELECT * FROM payments ORDER BY date, id').all(),
    checkins: db.prepare('SELECT * FROM checkins ORDER BY date').all(),
  };
}

function exportJSON() {
  return JSON.stringify(exportData(), null, 2);
}

function counts(d) {
  return {
    cards: (d.cards || []).length,
    scores: (d.scores || []).length,
    inquiries: (d.inquiries || []).length,
    payments: (d.payments || []).length,
    checkins: (d.checkins || []).length,
  };
}

// ── Restore ──
function importData(data, { replace = true } = {}) {
  if (!data || data.app !== 'credit-monitor' || !Array.isArray(data.cards)) {
    const err = new Error('That file is not a Credit Monitor backup.');
    err.status = 400;
    throw err;
  }

  const insScore = db.prepare('INSERT INTO scores (date, score, source, bureau, note) VALUES (?,?,?,?,?)');
  const insInq = db.prepare('INSERT INTO inquiries (date, reason, bureau, hard) VALUES (?,?,?,?)');
  const insPay = db.prepare('INSERT INTO payments (card_id, date, amount, kind, on_time) VALUES (?,?,?,?,?)');
  const insChk = db.prepare(
    `INSERT OR REPLACE INTO checkins (date, agg_utilization, reported_utilization, composite, score, focus, answers, note)
     VALUES (?,?,?,?,?,?,?,?)`
  );

  const tx = db.transaction(() => {
    if (replace) seed.wipe();
    const idMap = {};
    for (const c of data.cards) {
      const created = cards.create(c); // re-encrypts last4, ignores id/timestamps
      if (c.id != null) idMap[c.id] = created.id;
    }
    for (const s of data.scores || []) insScore.run(s.date, s.score, s.source || null, s.bureau || null, s.note || null);
    for (const q of data.inquiries || []) insInq.run(q.date, q.reason || null, q.bureau || null, q.hard != null ? q.hard : 1);
    for (const p of data.payments || []) {
      const cardId = p.card_id != null && idMap[p.card_id] != null ? idMap[p.card_id] : null;
      insPay.run(cardId, p.date, p.amount, p.kind || null, p.on_time != null ? p.on_time : 1);
    }
    for (const k of data.checkins || []) {
      insChk.run(k.date, k.agg_utilization, k.reported_utilization, k.composite, k.score, k.focus || null, k.answers || null, k.note || null);
    }
  });
  tx();
  return counts(data);
}

// ── On-disk snapshots ──
function backupDir() {
  return path.join(config.dataDir, 'backups');
}

function rotate(dir, keep) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  while (files.length > keep) {
    fs.unlinkSync(path.join(dir, files.shift()));
  }
}

function writeSnapshot() {
  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true });
  const name = `credit-monitor-${stamp()}.json`;
  fs.writeFileSync(path.join(dir, name), exportJSON());
  rotate(dir, config.backup.keep);
  return name;
}

// ── Off-server copy (email) ──
async function emailBackup() {
  if (!email.isConfigured()) return { sent: false, reason: 'SMTP not configured' };
  const data = exportData();
  const c = counts(data);
  return email.send({
    subject: `Credit Monitor backup — ${new Date().toISOString().slice(0, 10)}`,
    text:
      `Attached is your Credit Monitor backup (${c.cards} cards, ${c.scores} scores, ${c.payments} payments).\n` +
      `Keep it somewhere safe. To restore, open the app → Backup & restore → Restore from backup.`,
    attachments: [
      { filename: `credit-monitor-${stamp()}.json`, content: exportJSON(), contentType: 'application/json' },
    ],
  });
}

async function runScheduledBackup() {
  const file = writeSnapshot();
  let mail = { sent: false, reason: 'SMTP not configured' };
  try {
    mail = await emailBackup();
  } catch (e) {
    mail = { sent: false, reason: e.message };
  }
  return { file, emailed: mail.sent, emailReason: mail.reason, at: new Date().toISOString() };
}

function status() {
  const dir = backupDir();
  let files = [];
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  } catch (_) {
    /* no backups yet */
  }
  const last = files.length ? files[files.length - 1] : null;
  let lastTime = null;
  if (last) {
    try {
      lastTime = fs.statSync(path.join(dir, last)).mtime.toISOString();
    } catch (_) { /* ignore */ }
  }
  return {
    count: files.length,
    last,
    lastTime,
    emailConfigured: email.isConfigured(),
    keep: config.backup.keep,
    enabled: config.backup.enabled,
  };
}

// Returns the current DB file path after folding the WAL in, so a raw download
// is consistent.
function checkpointDbFile() {
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (_) { /* best effort */ }
  return config.dbPath;
}

module.exports = {
  exportData,
  exportJSON,
  importData,
  writeSnapshot,
  emailBackup,
  runScheduledBackup,
  status,
  checkpointDbFile,
  stamp,
};
