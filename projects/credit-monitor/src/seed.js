'use strict';

// Realistic sample data so the dashboard looks real on first run and the
// recommendation engine has something interesting to chew on (a couple of
// red/over-limit cards, a yellow card with autopay off, an old green card, an
// unused zero-balance card, a rising score trend, recent clustered inquiries).
//
// Usage:
//   node src/seed.js            # seed only if DB is empty
//   node src/seed.js --reset    # wipe and reload sample data

const db = require('./db');
const cards = require('./models/cards');
const scores = require('./models/scores');
const inquiries = require('./models/inquiries');
const payments = require('./models/payments');

const SAMPLE_CARDS = [
  { issuer: 'Chase', nickname: 'Sapphire Preferred', last4: '4821', credit_limit: 12000, current_balance: 4920, statement_balance: 4920, closing_day: 18, due_day: 13, minimum_payment: 98, apr: 24.99, date_opened: '2017-03-10', autopay: 1 },
  { issuer: 'American Express', nickname: 'Amex Gold', last4: '1007', credit_limit: 8000, current_balance: 1520, statement_balance: 1520, closing_day: 7, due_day: 2, minimum_payment: 40, apr: 27.24, date_opened: '2020-08-01', autopay: 0 },
  { issuer: 'Citi', nickname: 'Double Cash', last4: '9930', credit_limit: 6000, current_balance: 120, statement_balance: 120, closing_day: 25, due_day: 20, minimum_payment: 25, apr: 22.99, date_opened: '2014-06-15', autopay: 1 },
  { issuer: 'Capital One', nickname: 'Quicksilver', last4: '3345', credit_limit: 3000, current_balance: 0, statement_balance: 0, closing_day: 12, due_day: 8, minimum_payment: 0, apr: 26.99, date_opened: '2022-11-20', autopay: 0 },
  { issuer: 'Discover', nickname: 'Discover it', last4: '7782', credit_limit: 5000, current_balance: 2600, statement_balance: 2600, closing_day: 28, due_day: 23, minimum_payment: 70, apr: 25.99, date_opened: '2021-02-10', autopay: 1 },
];

const SAMPLE_SCORES = [
  { date: '2025-12-01', score: 688, source: 'Credit Karma', bureau: 'TransUnion (VantageScore 3.0)' },
  { date: '2026-01-01', score: 695, source: 'Credit Karma', bureau: 'TransUnion (VantageScore 3.0)' },
  { date: '2026-02-01', score: 701, source: 'Experian', bureau: 'Experian (FICO 8)' },
  { date: '2026-03-01', score: 699, source: 'Experian', bureau: 'Experian (FICO 8)' },
  { date: '2026-04-01', score: 710, source: 'Amex MyCredit', bureau: 'Experian (FICO 8)' },
  { date: '2026-05-01', score: 718, source: 'Experian', bureau: 'Experian (FICO 8)' },
];

const SAMPLE_INQUIRIES = [
  { date: '2026-05-20', reason: 'Auto loan application', bureau: 'Experian', hard: 1 },
  { date: '2026-04-15', reason: 'Credit card application (Discover)', bureau: 'Equifax', hard: 1 },
  { date: '2025-09-02', reason: 'Apartment rental screening', bureau: 'TransUnion', hard: 0 },
];

// nickname -> payment rows (one is late, to exercise payment-history factor)
const SAMPLE_PAYMENTS = [
  { nickname: 'Sapphire Preferred', date: '2026-05-13', amount: 600, kind: 'custom', on_time: 1 },
  { nickname: 'Amex Gold', date: '2026-05-02', amount: 1520, kind: 'statement', on_time: 1 },
  { nickname: 'Citi Double Cash', date: '2026-05-20', amount: 250, kind: 'statement', on_time: 1 },
  { nickname: 'Discover it', date: '2026-05-23', amount: 70, kind: 'minimum', on_time: 1 },
  { nickname: 'Discover it', date: '2026-03-26', amount: 70, kind: 'minimum', on_time: 0 }, // late
  { nickname: 'Sapphire Preferred', date: '2026-04-13', amount: 500, kind: 'custom', on_time: 1 },
];

function isEmpty() {
  return db.prepare('SELECT COUNT(*) AS n FROM cards').get().n === 0;
}

function wipe() {
  db.exec('DELETE FROM payments; DELETE FROM cards; DELETE FROM scores; DELETE FROM inquiries; DELETE FROM checkins;');
  // Reset auto-increment counters so a fresh start begins at id 1.
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('cards','scores','inquiries','payments','checkins');");
}

function load() {
  const byNickname = {};
  for (const c of SAMPLE_CARDS) {
    const created = cards.create(c);
    byNickname[c.nickname] = created.id;
  }
  for (const s of SAMPLE_SCORES) scores.create(s);
  for (const q of SAMPLE_INQUIRIES) inquiries.create(q);
  for (const p of SAMPLE_PAYMENTS) {
    payments.create({ card_id: byNickname[p.nickname] || null, date: p.date, amount: p.amount, kind: p.kind, on_time: p.on_time });
  }
}

// Called by the server on boot. Returns true if it seeded.
function maybeSeed() {
  if (!isEmpty()) return false;
  load();
  return true;
}

function run() {
  const reset = process.argv.includes('--reset');
  if (reset) {
    wipe();
    load();
    // eslint-disable-next-line no-console
    console.log('[seed] reset complete — sample data reloaded.');
  } else if (isEmpty()) {
    load();
    console.log('[seed] sample data loaded.');
  } else {
    console.log('[seed] database not empty — nothing to do. Use --reset to overwrite.');
  }
}

if (require.main === module) run();

module.exports = { maybeSeed, load, wipe, isEmpty };
