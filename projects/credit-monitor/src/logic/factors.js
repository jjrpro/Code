'use strict';

const config = require('../config');
const { aggregate } = require('./utilization');
const { monthsSince } = require('./dates');

// Approximate the five FICO factor categories from the data we actually have.
// Each factor gets a strength score 0-100 ("how good is this area for you")
// plus a status band and a plain-English note. This is an ESTIMATE for
// guidance, not your real FICO score — see notes.
//
// Weights (FICO): payment history 35, amounts owed 30, length 15,
// new credit 10, credit mix 10.

function band(strength) {
  if (strength >= 80) return 'strong';
  if (strength >= 55) return 'ok';
  return 'weak';
}

function paymentHistory(payments) {
  const { total, onTime } = payments;
  if (total === 0) {
    return {
      strength: 70,
      status: 'ok',
      note: 'No payment history logged yet. Log payments (or enable autopay) so this can be tracked — it is the single biggest factor.',
      data: { total, onTime },
    };
  }
  const ratio = onTime / total;
  // On-time payments dominate; even one late payment hurts meaningfully.
  const strength = Math.round(ratio * 100);
  let note;
  if (ratio === 1) note = `All ${total} logged payments were on time. Keep it perfect — this is 35% of your score.`;
  else note = `${total - onTime} of ${total} logged payments were late. Late payments are the heaviest drag; get every card on autopay for at least the minimum.`;
  return { strength, status: band(strength), note, data: { total, onTime } };
}

function amountsOwed(cards) {
  const agg = aggregate(cards);
  const u = agg.reportedPct; // reported drives the score
  // 0% util ~ 100 strength; 30% ~ ~55; >50% ~ weak.
  let strength;
  if (u <= 1) strength = 95; // tiny reported balance is ideal (better than 0 for some models)
  else if (u <= 10) strength = 90;
  else if (u <= 30) strength = 70 - (u - 10); // 70 down to ~50
  else strength = Math.max(10, 50 - (u - 30)); // falls off fast above 30
  strength = Math.round(strength);
  const note =
    u <= 10
      ? `Aggregate reported utilization is ${u}% — excellent. Keep it in single digits.`
      : u <= 30
      ? `Aggregate reported utilization is ${u}%. Under 30% is "okay", but single digits is ideal — pay down before statements close.`
      : `Aggregate reported utilization is ${u}% — this is hurting you. Bringing it under 30% (ideally under 10%) is your highest-impact move after on-time payments.`;
  return { strength, status: band(strength), note, data: { aggregateReportedPct: u } };
}

function lengthOfHistory(cards) {
  const active = cards.filter((c) => c.date_opened);
  if (active.length === 0) {
    return { strength: 60, status: 'ok', note: 'No account-open dates recorded. Add them to track average age.', data: {} };
  }
  const ages = active.map((c) => monthsSince(c.date_opened)).filter((m) => m !== null);
  const avg = ages.reduce((a, b) => a + b, 0) / ages.length;
  const oldest = Math.max(...ages);
  const avgYears = avg / 12;
  // ~7+ yr average is strong; ~2 yr is weak.
  let strength = Math.round(Math.min(100, (avgYears / 7) * 100));
  strength = Math.max(20, strength);
  const note = `Average account age ≈ ${avgYears.toFixed(1)} yr (oldest ≈ ${(oldest / 12).toFixed(1)} yr). Don't close old cards — that shortens this and raises utilization.`;
  return { strength, status: band(strength), note, data: { avgMonths: Math.round(avg), oldestMonths: oldest } };
}

function newCredit(inquiries, cards) {
  const now = new Date();
  const recentHard = inquiries.filter((q) => {
    if (!q.hard) return false;
    const d = new Date(q.date);
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return months <= 12;
  }).length;
  const recentlyOpened = cards.filter((c) => {
    const m = monthsSince(c.date_opened);
    return m !== null && m <= 12;
  }).length;
  const signals = recentHard + recentlyOpened;
  // 0 = strong, each recent event chips away.
  const strength = Math.max(20, 100 - signals * 18);
  const note =
    signals === 0
      ? 'No hard inquiries or new accounts in the last 12 months — good. Space out applications.'
      : `${recentHard} hard inquiry(ies) and ${recentlyOpened} new account(s) in the last 12 months. Avoid clustering applications; each hard pull dings this for ~12 months.`;
  return { strength, status: band(strength), note, data: { recentHard, recentlyOpened } };
}

function creditMix(cards) {
  // We only track revolving cards here, so this is a limited view.
  const count = cards.filter((c) => c.active).length;
  const strength = count >= 3 ? 70 : 60;
  return {
    strength,
    status: band(strength),
    note: 'This app only tracks credit cards (revolving). A healthy mix also includes installment loans (auto/mortgage/student). Treat this factor as informational.',
    data: { cardCount: count },
  };
}

function breakdown({ cards, payments, inquiries }) {
  const w = config.ficoWeights;
  const factors = {
    paymentHistory: { weight: w.paymentHistory, ...paymentHistory(payments) },
    amountsOwed: { weight: w.amountsOwed, ...amountsOwed(cards) },
    lengthOfHistory: { weight: w.lengthOfHistory, ...lengthOfHistory(cards) },
    newCredit: { weight: w.newCredit, ...newCredit(inquiries, cards) },
    creditMix: { weight: w.creditMix, ...creditMix(cards) },
  };
  // Weighted composite (0-100) — a relative health indicator, NOT a FICO score.
  let composite = 0;
  for (const k of Object.keys(factors)) {
    composite += (factors[k].strength * factors[k].weight) / 100;
  }
  return { factors, composite: Math.round(composite) };
}

module.exports = { breakdown };
