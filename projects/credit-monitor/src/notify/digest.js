'use strict';

// Builds the summary + action-item digest from the dashboard payload.
// Produces both plain text (console / email fallback) and HTML (email).

const dashboard = require('../logic/dashboard');
const survey = require('../logic/daily-survey');

function money(n) {
  return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function build(options = {}) {
  const data = dashboard.build(options);
  const agg = data.aggregate;
  const topRecs = data.recommendations.slice(0, 8);
  const upcoming = data.calendar.filter((e) => e.daysAway >= 0 && e.daysAway <= 14);
  const today = new Date().toISOString().slice(0, 10);
  const checkedInToday = !!survey.getCheckin(today);
  const streak = survey.streak();

  const subject = `Credit Monitor — ${todayStr()} — util ${agg.currentPct}% (${agg.currentColor})${
    data.scoreLatest ? `, score ${data.scoreLatest.score}` : ''
  }`;

  // ---- plain text ----
  const lines = [];
  lines.push(`CREDIT MONITOR DIGEST — ${todayStr()}`);
  lines.push('='.repeat(48));
  lines.push('');
  lines.push(`Overall utilization (current):  ${agg.currentPct}%  [${agg.currentColor}]`);
  lines.push(`Overall utilization (reported): ${agg.reportedPct}%  [${agg.reportedColor}]`);
  lines.push(`Total balance / limit: ${money(agg.totalCurrentBalance)} / ${money(agg.totalLimit)}`);
  if (data.scoreLatest) {
    lines.push(`Latest logged score: ${data.scoreLatest.score} (${data.scoreLatest.source || 'n/a'}, ${data.scoreLatest.date})`);
  }
  lines.push(`Health indicator: ${data.factors.composite}/100 (estimate, not a FICO score)`);
  lines.push('');
  lines.push(
    checkedInToday
      ? `✓ Daily check-in done — ${streak}-day streak. Nice.`
      : `👉 You haven't done today's credit check-in yet (streak: ${streak}). Open the app and update your balances.`
  );
  lines.push('');

  if (upcoming.length) {
    lines.push('UPCOMING (next 14 days):');
    for (const e of upcoming) {
      const label = e.type === 'statement-close' ? 'closes' : 'payment due';
      const ap = e.type === 'payment-due' && !e.autopay ? '  ⚠ NO AUTOPAY' : '';
      lines.push(`  • ${e.date} (${e.daysAway}d) — ${e.nickname} ${label}${ap}`);
    }
    lines.push('');
  }

  lines.push('TOP ACTION ITEMS:');
  if (topRecs.length === 0) {
    lines.push('  ✓ Nothing urgent — you look in good shape.');
  } else {
    topRecs.forEach((r) => {
      lines.push(`  ${r.priority}. [${r.impact.toUpperCase()}] ${r.title}`);
      lines.push(`     ${r.detail}`);
    });
  }
  lines.push('');
  lines.push('— Credit Monitor (local). Open the dashboard for full detail.');
  const text = lines.join('\n');

  // ---- html ----
  const html = renderHtml({ data, agg, topRecs, upcoming, checkedInToday, streak });

  return { subject, text, html, data };
}

function renderHtml({ data, agg, topRecs, upcoming, checkedInToday, streak }) {
  const colorHex = { green: '#1a9850', yellow: '#f0a202', red: '#d7301f' };
  const checkinBanner = checkedInToday
    ? `<div style="background:#e8f6ee;border:1px solid #bfe6cd;border-radius:8px;padding:10px 14px;margin:12px 0;color:#1a7d44">✓ Daily check-in done — <strong>${streak}-day streak</strong>.</div>`
    : `<div style="background:#fdecea;border:1px solid #f6c9c2;border-radius:8px;padding:10px 14px;margin:12px 0;color:#b3402f">👉 You haven't done today's credit check-in yet (streak: ${streak}). Open the app and update your balances.</div>`;
  const recHtml = topRecs.length
    ? topRecs
        .map(
          (r) => `<li style="margin:0 0 10px"><strong>[${r.impact.toUpperCase()}]</strong> ${esc(r.title)}<br>
            <span style="color:#444;font-size:13px">${esc(r.detail)}</span></li>`
        )
        .join('')
    : '<li>✓ Nothing urgent — you look in good shape.</li>';
  const upHtml = upcoming.length
    ? upcoming
        .map((e) => {
          const label = e.type === 'statement-close' ? 'closes' : 'payment due';
          const warn = e.type === 'payment-due' && !e.autopay ? ' <span style="color:#d7301f">⚠ no autopay</span>' : '';
          return `<li>${e.date} (${e.daysAway}d) — <strong>${esc(e.nickname)}</strong> ${label}${warn}</li>`;
        })
        .join('')
    : '<li>Nothing in the next 14 days.</li>';

  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a1a;max-width:680px;margin:auto">
  <h2 style="margin-bottom:4px">Credit Monitor — ${todayStr()}</h2>
  <p style="margin-top:0;color:#666">Local-first credit health digest</p>
  ${checkinBanner}
  <div style="background:#f6f7f9;border-radius:10px;padding:16px;margin:12px 0">
    <div style="font-size:15px">Overall utilization (current):
      <strong style="color:${colorHex[agg.currentColor]}">${agg.currentPct}%</strong></div>
    <div style="font-size:15px">Reported to bureaus:
      <strong style="color:${colorHex[agg.reportedColor]}">${agg.reportedPct}%</strong></div>
    <div style="font-size:13px;color:#555;margin-top:6px">Balance ${money(agg.totalCurrentBalance)} of ${money(agg.totalLimit)} limit
      ${data.scoreLatest ? `· Latest score <strong>${data.scoreLatest.score}</strong> (${esc(data.scoreLatest.source || '')})` : ''}
      · Health ${data.factors.composite}/100</div>
  </div>
  <h3>Upcoming (14 days)</h3>
  <ul style="font-size:14px">${upHtml}</ul>
  <h3>Top action items</h3>
  <ol style="padding-left:18px">${recHtml}</ol>
  <p style="color:#999;font-size:12px;margin-top:24px">Estimates for guidance only — not a FICO score and not financial advice.</p>
  </body></html>`;
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = { build };
