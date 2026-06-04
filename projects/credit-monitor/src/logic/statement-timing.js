'use strict';

const config = require('../config');
const { nextOccurrence, daysUntil, toISODate } = require('./dates');
const { pct } = require('./utilization');

// The single most actionable lever in this app: pay BEFORE the statement
// closing date (not just the due date), because the statement balance is what
// most issuers report to the bureaus — and that's what your utilization is
// computed from.
//
// For each card we compute:
//   - the next closing date + due date and countdowns
//   - how much to pay before close to hit a target utilization
//   - whether to warn now (high balance + closing soon)

// Amount to pay so the reported balance lands at `targetPct` of the limit.
function payToHitTarget(card, targetPct = config.targetUtilization) {
  const limit = Number(card.credit_limit) || 0;
  const balance = Number(card.current_balance) || 0;
  if (limit <= 0) return { payAmount: 0, targetBalance: 0, achievable: false };
  const targetBalance = (targetPct / 100) * limit;
  const payAmount = Math.max(0, balance - targetBalance);
  return {
    payAmount: round2(payAmount),
    targetBalance: round2(targetBalance),
    fromPct: round1(pct(balance, limit)),
    toPct: round1(pct(Math.max(balance - payAmount, 0), limit)),
    achievable: true,
  };
}

function forCard(card, { targetPct = config.targetUtilization } = {}) {
  const closing = nextOccurrence(card.closing_day);
  const due = nextOccurrence(card.due_day);
  const daysToClose = closing ? daysUntil(closing) : null;
  const daysToDue = due ? daysUntil(due) : null;

  const limit = Number(card.credit_limit) || 0;
  const currentPct = pct(card.current_balance, limit);

  const plan = payToHitTarget(card, targetPct);

  // Warn when the card is over the yellow line AND closes within the window.
  const warn =
    closing !== null &&
    daysToClose !== null &&
    daysToClose <= config.statementWarnDays &&
    currentPct > config.thresholds.green &&
    plan.payAmount > 0;

  return {
    closingDate: toISODate(closing),
    dueDate: toISODate(due),
    daysToClose,
    daysToDue,
    plan,
    warn,
  };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { payToHitTarget, forCard };
