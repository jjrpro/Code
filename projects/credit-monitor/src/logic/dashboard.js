'use strict';

// Assembles the full computed payload used by the dashboard API, the digest
// email, and the sample-output script. One place that ties together
// utilization, statement timing, the FICO factor breakdown, the calendar, and
// the recommendation engine.

const cardsModel = require('../models/cards');
const scoresModel = require('../models/scores');
const inquiriesModel = require('../models/inquiries');
const paymentsModel = require('../models/payments');

const utilization = require('./utilization');
const timing = require('./statement-timing');
const factors = require('./factors');
const recommendations = require('./recommendations');
const { nextOccurrence, daysUntil, toISODate } = require('./dates');

function build(options = {}) {
  const cards = cardsModel.list();
  const scores = scoresModel.list();
  const inquiries = inquiriesModel.list();
  const paymentSummary = paymentsModel.historySummary();

  const enrichedCards = cards.map((c) => ({
    ...c,
    utilization: utilization.forCard(c),
    timing: timing.forCard(c, { targetPct: options.targetPct }),
  }));

  const agg = utilization.aggregate(cards);

  const factorBreakdown = factors.breakdown({
    cards,
    payments: paymentSummary,
    inquiries,
  });

  const recs = recommendations.build({
    cards,
    inquiries,
    payments: paymentSummary,
    options,
  });

  return {
    asOf: new Date().toISOString(),
    cards: enrichedCards,
    aggregate: agg,
    scores,
    scoreLatest: scores.length ? scores[scores.length - 1] : null,
    inquiries,
    factors: factorBreakdown,
    calendar: buildCalendar(cards),
    recommendations: recs.recommendations,
    paydownPriority: recs.paydownPriority,
    options: { targetUtilization: recs.targetUtilization, azeoMode: recs.azeoMode },
  };
}

// Upcoming statement-close and payment-due events with countdowns, sorted.
function buildCalendar(cards) {
  const events = [];
  for (const c of cards.filter((x) => x.active)) {
    if (c.closing_day) {
      const d = nextOccurrence(c.closing_day);
      events.push({
        cardId: c.id,
        nickname: c.nickname,
        type: 'statement-close',
        date: toISODate(d),
        daysAway: daysUntil(d),
        autopay: !!c.autopay,
      });
    }
    if (c.due_day) {
      const d = nextOccurrence(c.due_day);
      events.push({
        cardId: c.id,
        nickname: c.nickname,
        type: 'payment-due',
        date: toISODate(d),
        daysAway: daysUntil(d),
        minimumPayment: c.minimum_payment,
        autopay: !!c.autopay,
      });
    }
  }
  events.sort((a, b) => a.daysAway - b.daysAway);
  return events;
}

module.exports = { build };
