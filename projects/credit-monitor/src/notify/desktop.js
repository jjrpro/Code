'use strict';

// Desktop notifications via the optional `node-notifier` dependency.
// Lazy-required so a missing optional dep never crashes the app.

const config = require('../config');

let notifier = null;
let triedLoad = false;

function load() {
  if (triedLoad) return notifier;
  triedLoad = true;
  try {
    // eslint-disable-next-line global-require
    notifier = require('node-notifier');
  } catch (_) {
    notifier = null;
  }
  return notifier;
}

function notify({ title, message }) {
  if (!config.desktopNotifications) return { sent: false, reason: 'disabled' };
  const n = load();
  if (!n) return { sent: false, reason: 'node-notifier not installed (npm i node-notifier)' };
  try {
    n.notify({ title: title || 'Credit Monitor', message: message || '', sound: false });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e.message };
  }
}

module.exports = { notify };
