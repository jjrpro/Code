'use strict';

// Plaid (read-only) integration — STUBBED.
//
// TODO(plaid): This is a clean seam for optional, read-only account syncing.
// The app works fully without it (manual entry + CSV import). To enable:
//   1. `npm i plaid`
//   2. Set CM_PLAID_ENABLED=true and PLAID_CLIENT_ID / PLAID_SECRET / PLAID_ENV
//      in .env.
//   3. Implement the functions below against Plaid's Liabilities + Balances
//      endpoints (credit-card limits, balances, statement/due dates, APRs).
//      Map results onto the `cards` model (see src/models/cards.js).
//
// Access tokens, once obtained, MUST be encrypted at rest (use src/crypto.js)
// and stored in the `settings` table — never logged, never committed.

const config = require('../config');

function isEnabled() {
  return Boolean(config.plaid.enabled && config.plaid.clientId && config.plaid.secret);
}

function status() {
  return {
    enabled: isEnabled(),
    configured: Boolean(config.plaid.clientId && config.plaid.secret),
    env: config.plaid.env,
    note: isEnabled()
      ? 'Plaid is configured but the sync implementation is still a stub (see src/plaid/plaid.js TODO).'
      : 'Plaid disabled. App runs fully via manual entry + CSV import. Set CM_PLAID_ENABLED=true and keys to enable.',
  };
}

// eslint-disable-next-line no-unused-vars
async function createLinkToken() {
  throw new Error('Plaid not implemented — see src/plaid/plaid.js TODO(plaid).');
}

// eslint-disable-next-line no-unused-vars
async function exchangePublicToken(publicToken) {
  throw new Error('Plaid not implemented — see src/plaid/plaid.js TODO(plaid).');
}

// eslint-disable-next-line no-unused-vars
async function syncAccounts() {
  throw new Error('Plaid not implemented — see src/plaid/plaid.js TODO(plaid).');
}

module.exports = { isEnabled, status, createLinkToken, exchangePublicToken, syncAccounts };
