'use strict';

const config = require('../config');

// Utilization = balance / limit, expressed as a percentage.
// Two flavors matter:
//   - "current" utilization (current_balance) — what you owe right now
//   - "reported" utilization (statement_balance) — what most issuers report
//     to the bureaus, and therefore what actually drives your score.

function pct(balance, limit) {
  if (!limit || limit <= 0) return 0;
  return (balance / limit) * 100;
}

// Map a utilization percentage to a traffic-light color band.
//   green  < 10%
//   yellow 10–30%
//   red    > 30%
function colorFor(utilPct) {
  const { green, yellow } = config.thresholds;
  if (utilPct < green) return 'green';
  if (utilPct <= yellow) return 'yellow';
  return 'red';
}

function forCard(card) {
  const current = pct(card.current_balance, card.credit_limit);
  const reported = pct(card.statement_balance, card.credit_limit);
  return {
    currentPct: round1(current),
    reportedPct: round1(reported),
    currentColor: colorFor(current),
    reportedColor: colorFor(reported),
  };
}

function aggregate(cards) {
  const active = cards.filter((c) => c.active);
  const totalLimit = sum(active, 'credit_limit');
  const totalCurrent = sum(active, 'current_balance');
  const totalStatement = sum(active, 'statement_balance');
  const current = pct(totalCurrent, totalLimit);
  const reported = pct(totalStatement, totalLimit);
  return {
    totalLimit,
    totalCurrentBalance: totalCurrent,
    totalStatementBalance: totalStatement,
    currentPct: round1(current),
    reportedPct: round1(reported),
    currentColor: colorFor(current),
    reportedColor: colorFor(reported),
  };
}

function sum(arr, key) {
  return arr.reduce((acc, x) => acc + (Number(x[key]) || 0), 0);
}
function round1(n) {
  return Math.round(n * 10) / 10;
}

module.exports = { pct, colorFor, forCard, aggregate, round1 };
