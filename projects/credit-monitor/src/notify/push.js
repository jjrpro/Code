'use strict';

// Mobile push notification hook — intentionally a clean stub.
//
// TODO(push): Wire a real provider here (e.g. ntfy.sh, Pushover, Firebase
// Cloud Messaging, or Expo push). The notification layer calls send() with a
// normalized payload; implement the provider call below and flip it on via a
// config flag + env vars. Keeping this isolated means the rest of the app
// (digest, scheduler) doesn't change when push is added.

async function send({ title, message, data } = {}) {
  // No-op until a provider is configured.
  return { sent: false, reason: 'push not configured (see src/notify/push.js TODO)' };
}

function isConfigured() {
  return false;
}

module.exports = { send, isConfigured };
