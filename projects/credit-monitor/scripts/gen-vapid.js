'use strict';

// Generates a VAPID key pair for web-push phone alerts.
// Run: npm run vapid    →  paste the two lines into your environment.

const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

// eslint-disable-next-line no-console
console.log(`
VAPID keys generated. Add these to your environment (Render env vars or .env):

CM_VAPID_PUBLIC=${keys.publicKey}
CM_VAPID_PRIVATE=${keys.privateKey}
CM_VAPID_SUBJECT=mailto:admin@jjrproconsultants.com

Keep CM_VAPID_PRIVATE secret. If you change these, devices must re-enable alerts.
`);
