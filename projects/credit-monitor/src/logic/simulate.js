'use strict';

// "What-if" payment simulator. Given planned payments per card, project what
// your utilization and health indicator become — using the SAME math as the
// dashboard so the numbers line up. Assumes a planned payment is made before
// the statement closes, so it lowers both the current balance and the balance
// that gets reported to the bureaus (which is what actually drives the score).

const cardsModel = require('../models/cards');
const inquiriesModel = require('../models/inquiries');
const paymentsModel = require('../models/payments');
const config = require('../config');

const utilization = require('./utilization');
const factors = require('./factors');

function snapshot(cards, payments, inquiries) {
  const agg = utilization.aggregate(cards);
  const { composite } = factors.breakdown({ cards, payments, inquiries });
  return {
    currentPct: agg.currentPct,
    reportedPct: agg.reportedPct,
    reportedColor: agg.reportedColor,
    currentColor: agg.currentColor,
    totalCurrentBalance: agg.totalCurrentBalance,
    totalStatementBalance: agg.totalStatementBalance,
    totalLimit: agg.totalLimit,
    health: composite,
  };
}

// adjustments: [{ id, payment }] or [{ id, current_balance, statement_balance }]
function simulate(adjustments = [], options = {}) {
  const target = Number(options.target) || config.targetUtilization;
  const cards = cardsModel.list();
  const payments = paymentsModel.historySummary();
  const inquiries = inquiriesModel.list();

  const adjById = new Map();
  for (const a of adjustments) if (a && a.id != null) adjById.set(Number(a.id), a);

  let totalPaid = 0;
  const adjusted = cards.map((c) => {
    const a = adjById.get(c.id);
    if (!a) return { ...c };
    const next = { ...c };
    if (a.payment != null && a.payment !== '') {
      const pay = Math.max(0, Number(a.payment) || 0);
      totalPaid += Math.min(pay, c.current_balance + Math.max(0, c.statement_balance - c.current_balance));
      next.current_balance = Math.max(0, (Number(c.current_balance) || 0) - pay);
      next.statement_balance = Math.max(0, (Number(c.statement_balance) || 0) - pay);
    } else {
      if (a.current_balance != null) next.current_balance = Math.max(0, Number(a.current_balance) || 0);
      if (a.statement_balance != null) next.statement_balance = Math.max(0, Number(a.statement_balance) || 0);
    }
    return next;
  });

  const before = snapshot(cards, payments, inquiries);
  const after = snapshot(adjusted, payments, inquiries);

  const perCard = cards.map((c, i) => {
    const a = adjById.get(c.id);
    return {
      id: c.id,
      nickname: c.nickname,
      payment: a && a.payment != null ? Number(a.payment) || 0 : 0,
      before: utilization.forCard(c),
      after: utilization.forCard(adjusted[i]),
      newStatementBalance: adjusted[i].statement_balance,
    };
  });

  return {
    target,
    totalPaid,
    before,
    after,
    meetsTarget: after.reportedPct <= target,
    delta: {
      reportedPct: utilization.round1(after.reportedPct - before.reportedPct),
      currentPct: utilization.round1(after.currentPct - before.currentPct),
      health: after.health - before.health,
    },
    cards: perCard,
  };
}

module.exports = { simulate };
