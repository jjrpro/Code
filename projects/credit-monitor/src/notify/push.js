'use strict';

// Web-push (VAPID) phone alerts. Browsers/PWAs that opt in store a push
// subscription here; the daily digest (and the test button) deliver a
// notification to every saved device. Works only over HTTPS (a deployed host or
// an installed PWA) — set CM_VAPID_PUBLIC / CM_VAPID_PRIVATE (run `npm run
// vapid`). If unset, this is a no-op and the rest of the app is unaffected.

const webpush = require('web-push');
const db = require('../db');
const config = require('../config');

let configured = false;
function ensure() {
  if (configured) return true;
  if (!config.vapid.publicKey || !config.vapid.privateKey) return false;
  webpush.setVapidDetails(config.vapid.subject, config.vapid.publicKey, config.vapid.privateKey);
  configured = true;
  return true;
}

function isConfigured() {
  return Boolean(config.vapid.publicKey && config.vapid.privateKey);
}

function publicKey() {
  return config.vapid.publicKey || null;
}

function subscribe(sub) {
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    const err = new Error('Invalid push subscription.');
    err.status = 400;
    throw err;
  }
  db.prepare(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES (?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(sub.endpoint, sub.keys.p256dh, sub.keys.auth);
  return { ok: true };
}

function unsubscribe(endpoint) {
  if (!endpoint) return { ok: true, removed: 0 };
  const r = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  return { ok: true, removed: r.changes };
}

function count() {
  return db.prepare('SELECT COUNT(*) AS n FROM push_subscriptions').get().n;
}

// Called by the notification orchestrator with { title, message }.
async function send({ title, message, data } = {}) {
  if (!ensure()) return { sent: false, reason: 'push not configured (run npm run vapid, set CM_VAPID_*)' };
  const subs = db.prepare('SELECT * FROM push_subscriptions').all();
  if (subs.length === 0) return { sent: false, reason: 'no devices subscribed' };

  const payload = JSON.stringify({
    title: title || 'Credit Monitor',
    body: message || '',
    url: (data && data.url) || '/',
  });

  let ok = 0;
  let removed = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        ok += 1;
      } catch (e) {
        // 404/410 mean the subscription is dead — prune it.
        if (e && (e.statusCode === 404 || e.statusCode === 410)) {
          db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(s.endpoint);
          removed += 1;
        }
      }
    })
  );
  return { sent: ok > 0, count: ok, pruned: removed, devices: subs.length };
}

module.exports = { send, isConfigured, publicKey, subscribe, unsubscribe, count };
