'use strict';

// Daily credit check-in ("survey"). Each day you:
//   - update your card balances (and optionally autopay/statement balance),
//   - log any payments you made, new hard inquiries, or a new credit score,
//   - flag whether you're about to apply for credit (turns on AZEO guidance).
// On submit we apply those updates, snapshot your utilization/score, record the
// check-in (one per day), and hand back "today's #1 move" + your streak + a
// progress trend built from your own daily inputs.

const db = require('../db');
const cards = require('../models/cards');
const scores = require('../models/scores');
const inquiries = require('../models/inquiries');
const payments = require('../models/payments');
const dashboard = require('./dashboard');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getCheckin(date) {
  return db.prepare('SELECT * FROM checkins WHERE date = ?').get(date) || null;
}

// Consecutive days (ending today or yesterday) with a completed check-in.
function streak() {
  const rows = db.prepare('SELECT date FROM checkins ORDER BY date DESC LIMIT 400').all();
  if (!rows.length) return 0;
  const have = new Set(rows.map((r) => r.date));
  let count = 0;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Allow the streak to be "alive" if today isn't done yet but yesterday was.
  if (!have.has(iso(d))) d.setDate(d.getDate() - 1);
  while (have.has(iso(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function iso(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// Trend series built from the daily check-ins (newest last).
function progress(limit = 60) {
  return db
    .prepare('SELECT date, agg_utilization, reported_utilization, composite, score FROM checkins ORDER BY date ASC LIMIT ?')
    .all(limit);
}

// The pre-filled survey for today: current balances to confirm/adjust, whether
// today is already done, the streak, and today's focus action.
function today(options = {}) {
  const date = todayStr();
  const existing = getCheckin(date);
  const list = cards.list().filter((c) => c.active);
  const dash = dashboard.build(options);
  const focus = dash.recommendations[0] || null;
  const highCount = dash.recommendations.filter((r) => r.impact === 'high').length;

  return {
    date,
    alreadyDone: !!existing,
    completedAt: existing ? existing.created_at : null,
    streak: streak(),
    cards: list.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      issuer: c.issuer,
      current_balance: c.current_balance,
      statement_balance: c.statement_balance,
      credit_limit: c.credit_limit,
      autopay: c.autopay,
      utilization: dash.cards.find((x) => x.id === c.id)?.utilization || null,
    })),
    focus,
    highCount,
    summary: {
      aggUtilization: dash.aggregate.currentPct,
      aggColor: dash.aggregate.currentColor,
      reportedUtilization: dash.aggregate.reportedPct,
      composite: dash.factors.composite,
      score: dash.scoreLatest ? dash.scoreLatest.score : null,
    },
    progress: progress(),
  };
}

// Apply a submitted survey and record the check-in.
// answers = {
//   date?, balances:{cardId:amount}, statementBalances:{cardId:amount},
//   autopay:{cardId:0|1}, payments:[{card_id,amount,on_time}],
//   inquiry:{date,reason,bureau}|null, newAccount:bool,
//   score:{date,score,source,bureau}|null, upcomingApplication:bool, note
// }
function submit(answers = {}) {
  const date = answers.date || todayStr();

  const tx = db.transaction(() => {
    // 1. Balance / statement / autopay updates per card.
    for (const [id, val] of Object.entries(answers.balances || {})) {
      if (val !== '' && val !== null && val !== undefined) cards.update(Number(id), { current_balance: Number(val) });
    }
    for (const [id, val] of Object.entries(answers.statementBalances || {})) {
      if (val !== '' && val !== null && val !== undefined) cards.update(Number(id), { statement_balance: Number(val) });
    }
    for (const [id, val] of Object.entries(answers.autopay || {})) {
      cards.update(Number(id), { autopay: val ? 1 : 0 });
    }

    // 2. Payments made since last check-in.
    for (const p of answers.payments || []) {
      if (p && p.amount) {
        payments.create({
          card_id: p.card_id ? Number(p.card_id) : null,
          date: p.date || date,
          amount: Number(p.amount),
          kind: p.kind || 'custom',
          on_time: p.on_time === undefined ? 1 : p.on_time ? 1 : 0,
        });
      }
    }

    // 3. New hard inquiry.
    if (answers.inquiry && (answers.inquiry.reason || answers.inquiry.bureau)) {
      inquiries.create({
        date: answers.inquiry.date || date,
        reason: answers.inquiry.reason || null,
        bureau: answers.inquiry.bureau || null,
        hard: 1,
      });
    }

    // 4. New score.
    if (answers.score && answers.score.score) {
      scores.create({
        date: answers.score.date || date,
        score: Number(answers.score.score),
        source: answers.score.source || null,
        bureau: answers.score.bureau || null,
      });
    }
  });
  tx();

  // 5. Recompute and snapshot (AZEO on if an application is coming up).
  const dash = dashboard.build({ ...answers.options, azeoMode: !!answers.upcomingApplication });
  const focus = dash.recommendations[0] || null;
  const score = dash.scoreLatest ? dash.scoreLatest.score : null;

  db.prepare(
    `INSERT INTO checkins (date, agg_utilization, reported_utilization, composite, score, focus, answers, note)
     VALUES (@date, @agg, @rep, @composite, @score, @focus, @answers, @note)
     ON CONFLICT(date) DO UPDATE SET
       agg_utilization=@agg, reported_utilization=@rep, composite=@composite,
       score=@score, focus=@focus, answers=@answers, note=@note`
  ).run({
    date,
    agg: dash.aggregate.currentPct,
    rep: dash.aggregate.reportedPct,
    composite: dash.factors.composite,
    score,
    focus: focus ? focus.title : null,
    answers: JSON.stringify(answers),
    note: answers.note || null,
  });

  return {
    ok: true,
    date,
    streak: streak(),
    focus,
    upcomingApplication: !!answers.upcomingApplication,
    summary: {
      aggUtilization: dash.aggregate.currentPct,
      aggColor: dash.aggregate.currentColor,
      reportedUtilization: dash.aggregate.reportedPct,
      composite: dash.factors.composite,
      score,
    },
    topActions: dash.recommendations.slice(0, 5),
    progress: progress(),
  };
}

module.exports = { today, submit, streak, progress, getCheckin };
