'use strict';

// Prints the recommendation engine's output against whatever is in the DB.
// Used to generate the sample-output deliverable. Pass --azeo to see the
// AZEO (All Zero Except One) pre-application plan.
//   node scripts/print-recommendations.js [--azeo]

const dashboard = require('../src/logic/dashboard');

const azeo = process.argv.includes('--azeo');
const d = dashboard.build({ azeoMode: azeo });

const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

console.log('CREDIT MONITOR — SAMPLE RECOMMENDATION OUTPUT');
console.log('Generated:', d.asOf);
console.log('='.repeat(70));
console.log('');
console.log('SNAPSHOT');
console.log(`  Aggregate utilization (current):  ${d.aggregate.currentPct}%  [${d.aggregate.currentColor}]`);
console.log(`  Aggregate utilization (reported): ${d.aggregate.reportedPct}%  [${d.aggregate.reportedColor}]`);
console.log(`  Total balance / limit: ${money(d.aggregate.totalCurrentBalance)} / ${money(d.aggregate.totalLimit)}`);
console.log(`  Latest score: ${d.scoreLatest ? `${d.scoreLatest.score} (${d.scoreLatest.source}, ${d.scoreLatest.date})` : 'none logged'}`);
console.log(`  Health indicator (estimate): ${d.factors.composite}/100`);
console.log('');

console.log('PER-CARD');
for (const c of d.cards) {
  console.log(`  • ${c.nickname} (${c.issuer}) — ${c.utilization.currentPct}% [${c.utilization.currentColor}]` +
    ` | bal ${money(c.current_balance)} / ${money(c.credit_limit)}` +
    ` | autopay ${c.autopay ? 'ON' : 'OFF'}` +
    (c.timing.closingDate ? ` | closes ${c.timing.closingDate} (${c.timing.daysToClose}d)` : ''));
}
console.log('');

console.log('FICO FACTOR BREAKDOWN (estimate)');
for (const [k, f] of Object.entries(d.factors.factors)) {
  console.log(`  • ${k} (${f.weight}%): ${f.strength}/100 [${f.status}]`);
  console.log(`      ${f.note}`);
}
console.log('');

console.log(`PRIORITIZED ACTIONS${azeo ? ' (AZEO mode ON)' : ''}`);
for (const r of d.recommendations) {
  console.log(`  ${r.priority}. [${r.impact.toUpperCase()} · ${r.category}] ${r.title}`);
  console.log(`     ${r.detail}`);
}
console.log('');

console.log('DEBT-PAYDOWN PRIORITY');
console.log('  Score-first (target ~30%+ utilization cards):');
d.paydownPriority.scoreFirst.forEach((c, i) =>
  console.log(`    ${i + 1}. ${c.nickname} — ${c.utilization}% util, bal ${money(c.balance)}`));
console.log('  Avalanche (highest APR first, saves the most interest):');
d.paydownPriority.avalanche.forEach((c, i) =>
  console.log(`    ${i + 1}. ${c.nickname} — ${c.apr}% APR, bal ${money(c.balance)}`));
