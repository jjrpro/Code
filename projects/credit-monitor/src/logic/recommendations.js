'use strict';

const config = require('../config');
const { forCard: utilForCard, aggregate } = require('./utilization');
const { forCard: timingForCard } = require('./statement-timing');
const { monthsSince, nextOccurrence, daysUntil, toISODate } = require('./dates');

// The recommendation engine encodes the credit-improvement playbook into a
// prioritized, specific action list. Each recommendation carries an `impact`
// (how much it moves the score) and the FICO `factor` it maps to, so the list
// can be sorted by what actually moves the needle: payment history (35%) and
// utilization (30%) first.

const IMPACT_RANK = { high: 0, medium: 1, low: 2 };
const FACTOR_WEIGHT = config.ficoWeights;

function money(n) {
  return `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function build({ cards, inquiries, payments, options = {} }) {
  const targetPct = options.targetPct ?? config.targetUtilization;
  const azeoMode = options.azeoMode ?? false; // set true before an application/score pull
  const recs = [];
  let seq = 0;
  const add = (r) => recs.push({ id: ++seq, ...r });

  const active = cards.filter((c) => c.active);

  // ── 1. Pay on time, always — flag any card without autopay (35% factor) ──
  for (const c of active) {
    if (!c.autopay) {
      add({
        impact: 'high',
        factor: 'paymentHistory',
        category: 'Autopay',
        title: `Turn on autopay for ${c.nickname}`,
        detail: `${c.nickname} (${c.issuer}) has autopay OFF. Payment history is 35% of your score and a single missed payment can drop it 50–100+ points. Enable autopay for at least the minimum (${money(c.minimum_payment)}) as a safety net — you can still pay more manually before the statement closes.`,
        cardId: c.id,
      });
    }
  }

  // ── 2. Utilization — per-card, reported balance drives the score (30%) ──
  for (const c of active) {
    const u = utilForCard(c);
    const timing = timingForCard(c, { targetPct });
    if (u.currentColor === 'red') {
      add({
        impact: 'high',
        factor: 'amountsOwed',
        category: 'Utilization',
        title: `Pay down ${c.nickname} — utilization ${u.currentPct}%`,
        detail:
          `${c.nickname} is at ${u.currentPct}% (over 30% = red). ` +
          (timing.closingDate
            ? `Pay ${money(timing.plan.payAmount)} before the statement closes on ${timing.closingDate} (${timing.daysToClose} day(s) away) to drop reported utilization from ${timing.plan.fromPct}% to ${timing.plan.toPct}%.`
            : `Pay ${money(timing.plan.payAmount)} to drop utilization from ${timing.plan.fromPct}% to ${timing.plan.toPct}%. (Add a statement closing day to this card for exact timing.)`),
        cardId: c.id,
      });
    } else if (u.currentColor === 'yellow') {
      add({
        impact: 'medium',
        factor: 'amountsOwed',
        category: 'Utilization',
        title: `Optional: trim ${c.nickname} to single digits`,
        detail:
          `${c.nickname} is at ${u.currentPct}% (under 30%, but single digits is ideal). ` +
          (timing.closingDate
            ? `Pay ${money(timing.plan.payAmount)} before ${timing.closingDate} to report ~${targetPct}%.`
            : `Pay ${money(timing.plan.payAmount)} to report ~${targetPct}%.`),
        cardId: c.id,
      });
    }
  }

  // ── 3. Aggregate utilization (30%) ──
  const agg = aggregate(cards);
  if (agg.currentColor !== 'green') {
    const targetAggBalance = (targetPct / 100) * agg.totalLimit;
    const payDown = Math.max(0, agg.totalCurrentBalance - targetAggBalance);
    add({
      impact: agg.currentColor === 'red' ? 'high' : 'medium',
      factor: 'amountsOwed',
      category: 'Utilization',
      title: `Reduce overall utilization — currently ${agg.currentPct}%`,
      detail: `Across all cards you're using ${agg.currentPct}% of ${money(agg.totalLimit)} in limits. Paying about ${money(payDown)} total before statements close would bring aggregate utilization to ~${targetPct}%. Both per-card and aggregate utilization matter.`,
    });
  }

  // ── 4. Statement-close timing warnings (high balance + closing soon) ──
  for (const c of active) {
    const timing = timingForCard(c, { targetPct });
    if (timing.warn) {
      add({
        impact: 'high',
        factor: 'amountsOwed',
        category: 'Statement timing',
        title: `${c.nickname} statement closes in ${timing.daysToClose} day(s)`,
        detail: `${c.nickname} closes on ${timing.closingDate} and is currently above target. Pay ${money(timing.plan.payAmount)} BEFORE that date — the balance at close is what gets reported. Paying after close (but by the due date of ${timing.dueDate}) avoids interest but won't lower your reported utilization this cycle.`,
        cardId: c.id,
      });
    }
  }

  // ── 5. AZEO — All Zero Except One (before an application or score pull) ──
  if (azeoMode && active.length > 0) {
    // Keep a small balance on ONE card (lowest-limit card with a balance, or
    // lowest-limit overall), zero the rest.
    const carrier = [...active].sort((a, b) => a.credit_limit - b.credit_limit)[0];
    const smallBal = Math.max(5, Math.round((0.05 * carrier.credit_limit) / 5) * 5); // ~5%
    add({
      impact: 'high',
      factor: 'amountsOwed',
      category: 'AZEO',
      title: 'AZEO: prep cards before your application / score pull',
      detail: `Bring every card to $0 reported EXCEPT ${carrier.nickname}, which should report a small balance of about ${money(smallBal)} (~1–9% of its ${money(carrier.credit_limit)} limit). Reporting one tiny balance typically scores better than reporting $0 on everything. Time these so the right balances are present when each statement closes.`,
      cardId: carrier.id,
    });
  } else if (active.length > 0) {
    add({
      impact: 'low',
      factor: 'amountsOwed',
      category: 'AZEO',
      title: 'Planning a credit application? Use AZEO first',
      detail: 'Before a mortgage/auto/card application or a score pull, run "All Zero Except One": pay all cards to $0 reported except one carrying a small 1–9% balance. Toggle AZEO mode in the app to get an exact per-card plan.',
    });
  }

  // ── 6. Don't close old cards ──
  if (active.length > 0) {
    const withAge = active.filter((c) => c.date_opened);
    if (withAge.length > 0) {
      const oldest = withAge.sort((a, b) => (monthsSince(b.date_opened) || 0) - (monthsSince(a.date_opened) || 0))[0];
      const yrs = ((monthsSince(oldest.date_opened) || 0) / 12).toFixed(1);
      add({
        impact: 'low',
        factor: 'lengthOfHistory',
        category: 'Account age',
        title: `Keep ${oldest.nickname} open — it's your oldest card (${yrs} yr)`,
        detail: `Closing an old card shortens your average account age (15%) and removes its limit from your total available credit, which raises utilization (30%). Even if you stop using it, keep it open.`,
        cardId: oldest.id,
      });
    }
  }

  // ── 7. Keep unused cards active (avoid issuer-initiated closure) ──
  for (const c of active) {
    if (Number(c.current_balance) === 0 && Number(c.statement_balance) === 0) {
      add({
        impact: 'low',
        factor: 'lengthOfHistory',
        category: 'Account activity',
        title: `Keep ${c.nickname} active with a small recurring charge`,
        detail: `${c.nickname} shows no balance. Issuers sometimes close inactive cards, which would cut your available credit and average age. Put one small recurring charge (a streaming sub, ~$10) on it with autopay so it stays open and reports activity.`,
        cardId: c.id,
      });
    }
  }

  // ── 8. Limit hard inquiries — flag clustering ──
  const now = new Date();
  const hardLast90 = inquiries.filter((q) => q.hard && daysUntil(new Date(q.date)) >= -90 && new Date(q.date) <= now).length;
  const hardLast12mo = inquiries.filter((q) => {
    if (!q.hard) return false;
    const d = new Date(q.date);
    const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    return months >= 0 && months <= 12;
  }).length;
  if (hardLast90 >= 2 || hardLast12mo >= 4) {
    add({
      impact: 'medium',
      factor: 'newCredit',
      category: 'Inquiries',
      title: 'Slow down on credit applications',
      detail: `You have ${hardLast90} hard inquiry(ies) in the last 90 days and ${hardLast12mo} in the last 12 months. Clustered hard pulls signal risk and ding "new credit" (10%). Space applications at least 3–6 months apart (rate-shopping for a single auto/mortgage loan within ~14–45 days usually counts as one).`,
    });
  }

  // ── 9. Periodic credit-limit increase requests (lowers utilization) ──
  for (const c of active) {
    const age = monthsSince(c.date_opened);
    const u = utilForCard(c);
    if (age !== null && age >= 6 && u.currentColor !== 'green') {
      add({
        impact: 'medium',
        factor: 'amountsOwed',
        category: 'Limit increase',
        title: `Ask ${c.issuer} for a credit-limit increase on ${c.nickname}`,
        detail: `A higher limit instantly lowers utilization without paying anything down. ${c.nickname} has been open ${(age / 12).toFixed(1)} yr and is in good standing. Request an increase (about every 6 months). Note: some issuers do a HARD pull for CLI requests — ask whether it's a soft pull first.`,
        cardId: c.id,
      });
    }
  }

  // ── 10. Dispute report errors — standing checklist ──
  add({
    impact: 'low',
    factor: 'paymentHistory',
    category: 'Disputes',
    title: 'Check your reports for errors (free) and dispute any',
    detail:
      'Pull your free reports at annualcreditreport.com (the official free source for Equifax, Experian, TransUnion). Look for: accounts that aren\'t yours, wrong balances/limits, payments marked late that were on time, duplicate accounts, and stale collections. ' +
      'Dispute online at each bureau (equifax.com/personal/credit-report-services, experian.com/disputes, transunion.com/credit-disputes). Keep records; bureaus generally must respond within 30 days.',
  });

  // ── Sort by impact, then by FICO factor weight, then sequence ──
  recs.sort((a, b) => {
    const im = IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact];
    if (im !== 0) return im;
    const fw = (FACTOR_WEIGHT[b.factor] || 0) - (FACTOR_WEIGHT[a.factor] || 0);
    if (fw !== 0) return fw;
    return a.id - b.id;
  });
  recs.forEach((r, i) => (r.priority = i + 1));

  // ── Debt-paydown priority lists (two strategies, surfaced separately) ──
  const balances = active.filter((c) => Number(c.current_balance) > 0);
  const scoreFirst = [...balances]
    .map((c) => ({ ...c, util: utilForCard(c).currentPct }))
    .sort((a, b) => {
      // Target cards nearest/over 30% first (biggest utilization wins).
      const da = Math.abs(a.util - 30) - (a.util >= 30 ? 1000 : 0);
      const db = Math.abs(b.util - 30) - (b.util >= 30 ? 1000 : 0);
      return da - db;
    })
    .map((c) => ({ cardId: c.id, nickname: c.nickname, utilization: c.util, balance: c.current_balance }));
  const avalanche = [...balances]
    .sort((a, b) => b.apr - a.apr)
    .map((c) => ({ cardId: c.id, nickname: c.nickname, apr: c.apr, balance: c.current_balance }));

  return {
    recommendations: recs,
    paydownPriority: {
      scoreFirst, // best for raising your score fastest
      avalanche, // best for saving the most interest (highest APR first)
    },
    generatedAt: new Date().toISOString(),
    targetUtilization: targetPct,
    azeoMode,
  };
}

module.exports = { build };
