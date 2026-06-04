'use strict';

// Central config + feature flags, loaded from environment (.env via dotenv).
// Everything has a default so the app runs with no .env at all.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function bool(v, dflt) {
  if (v === undefined || v === '') return dflt;
  return /^(1|true|yes|on)$/i.test(String(v).trim());
}
function num(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

const ROOT = path.join(__dirname, '..');

const config = {
  root: ROOT,
  dataDir: path.join(ROOT, 'data'),
  dbPath: path.join(ROOT, 'data', 'credit-monitor.db'),

  port: num(process.env.PORT, 4600),
  host: process.env.HOST || '127.0.0.1',

  encryptionKey: (process.env.CM_ENCRYPTION_KEY || '').trim(),

  // Recommendation / timing tunables
  targetUtilization: num(process.env.CM_TARGET_UTILIZATION, 9), // percent
  statementWarnDays: num(process.env.CM_STATEMENT_WARN_DAYS, 7),

  // Utilization color thresholds (percent)
  thresholds: { green: 10, yellow: 30 },

  // FICO factor weights (must sum to 100)
  ficoWeights: {
    paymentHistory: 35,
    amountsOwed: 30,
    lengthOfHistory: 15,
    newCredit: 10,
    creditMix: 10,
  },

  email: {
    host: process.env.SMTP_HOST || '',
    port: num(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.DIGEST_FROM || 'Credit Monitor <no-reply@localhost>',
    to: process.env.DIGEST_TO || '',
  },

  scheduler: {
    enabled: bool(process.env.CM_SCHEDULE_ENABLED, true),
    digestCron: process.env.CM_DIGEST_CRON || '0 8 * * *',
    weeklyCron: process.env.CM_WEEKLY_CRON || '5 8 * * 1',
  },

  desktopNotifications: bool(process.env.CM_DESKTOP_NOTIFICATIONS, true),

  plaid: {
    enabled: bool(process.env.CM_PLAID_ENABLED, false),
    clientId: process.env.PLAID_CLIENT_ID || '',
    secret: process.env.PLAID_SECRET || '',
    env: process.env.PLAID_ENV || 'sandbox',
  },
};

module.exports = config;
