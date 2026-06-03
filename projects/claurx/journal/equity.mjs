#!/usr/bin/env node
// CLAURX — trading status / equity tracker. Reads trades.csv, shows today's
// P&L vs your daily target + a running equity curve. No broker login, no
// network. Your numbers in, honest scoreboard out. Pairs with review.mjs.
//
// Usage:  node equity.mjs                 (full status)
//         node equity.mjs MGC             (filter by instrument)
//         node equity.mjs --since 2026-06-01
//         node equity.mjs --target 500    (override daily $/day goal)
//         node equity.mjs --start 1500    (absolute equity off a live balance)
//
// Config defaults live in config.json (daily_target, starting_balance).

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const since = flag("--since");
const targetArg = flag("--target");
const startArg = flag("--start");
const instrument = args
  .find((a, i) => !a.startsWith("--") && args[i - 1] !== "--since" && args[i - 1] !== "--target" && args[i - 1] !== "--start")
  ?.toUpperCase();

// ---- config ----
let cfg = { daily_target: 500, starting_balance: null };
try {
  cfg = { ...cfg, ...JSON.parse(readFileSync(new URL("./config.json", import.meta.url), "utf8")) };
} catch {
  /* defaults are fine */
}
const target = Number(targetArg ?? cfg.daily_target) || 500;
const startBalRaw = startArg ?? cfg.starting_balance;
const startBal = startBalRaw === null || startBalRaw === undefined || startBalRaw === "" ? null : Number(startBalRaw);

// ---- load trades (same shape as review.mjs) ----
let raw;
try {
  raw = readFileSync(new URL("./trades.csv", import.meta.url), "utf8");
} catch {
  console.error("No trades.csv found next to equity.mjs.");
  process.exit(1);
}

const lines = raw.split(/\r?\n/).filter((l) => l.trim());
const header = lines.shift()?.split(",").map((h) => h.trim());
const cols = ["date", "instrument", "direction", "entry", "exit", "contracts", "pnl", "setup", "rule_followed", "notes"];
const idx = Object.fromEntries(cols.map((c) => [c, header.indexOf(c)]));

let trades = lines.map((line) => {
  const parts = line.split(",");
  const row = [...parts.slice(0, 9), parts.slice(9).join(",")];
  return {
    date: row[idx.date]?.trim(),
    instrument: row[idx.instrument]?.trim().toUpperCase(),
    pnl: Number(row[idx.pnl]),
  };
});

if (instrument) trades = trades.filter((t) => t.instrument === instrument);
if (since) trades = trades.filter((t) => t.date >= since);

const m2 = (n) => `${n < 0 ? "-" : "+"}$${Math.abs(n).toFixed(2)}`;
const today = new Date().toISOString().slice(0, 10);

const L = [];
L.push(`CLAURX · Trading Status${instrument ? " · " + instrument : ""}   ${today}`);
L.push("─".repeat(48));

if (!trades.length) {
  L.push(`  No trades logged yet${instrument ? " for " + instrument : ""}.`);
  L.push(`  Tell CLAURX a trade and the scoreboard fills in live.`);
  L.push("");
  L.push(`  Daily target  $${target.toFixed(0)}/day`);
  if (startBal !== null) L.push(`  Account       $${startBal.toFixed(2)}`);
  console.log(L.join("\n"));
  process.exit(0);
}

// ---- aggregate by day ----
const byDay = new Map();
for (const t of trades) {
  if (!t.date) continue;
  const d = byDay.get(t.date) || { pnl: 0, n: 0, w: 0, l: 0 };
  d.pnl += t.pnl;
  d.n += 1;
  if (t.pnl > 0) d.w += 1;
  else if (t.pnl < 0) d.l += 1;
  byDay.set(t.date, d);
}
const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));

// running cumulative for equity curve
let run = 0;
const curve = days.map(([date, d]) => {
  run += d.pnl;
  return { date, day: d.pnl, cum: run, n: d.n, w: d.w, l: d.l };
});

const totalPnl = run;
const todayRow = byDay.get(today) || { pnl: 0, n: 0, w: 0, l: 0 };

// ---- TODAY vs target ----
const pct = Math.max(0, Math.min(1, todayRow.pnl / target));
const barW = 20;
const filled = Math.round(pct * barW);
const bar = "█".repeat(filled) + "░".repeat(barW - filled);
const toGo = target - todayRow.pnl;

L.push("  TODAY");
L.push(`    Net P&L     ${m2(todayRow.pnl)}        Target  $${target.toFixed(0)}/day`);
L.push(`    Progress    [${bar}] ${(pct * 100).toFixed(0)}%`);
if (todayRow.pnl >= target) L.push(`                ✔ target hit — +${m2(todayRow.pnl - target).slice(1)} over. Protect it; don't give it back.`);
else if (todayRow.n > 0) L.push(`                ${m2(toGo).replace("+", "")} to go`);
else L.push(`                no trades logged today yet`);
L.push(`    Trades      ${todayRow.n}   (W ${todayRow.w} / L ${todayRow.l})`);
L.push("");

// ---- EQUITY CURVE ----
L.push("  EQUITY CURVE  (cumulative net P&L by day)");
const cumVals = curve.map((c) => c.cum);
const lo = Math.min(0, ...cumVals);
const hi = Math.max(0, ...cumVals);
const span = hi - lo || 1;
const spark = "▁▂▃▄▅▆▇█";
for (const c of curve) {
  const norm = (c.cum - lo) / span;
  const ch = spark[Math.max(0, Math.min(spark.length - 1, Math.round(norm * (spark.length - 1))))];
  const mark = c.date === today ? "‹today" : "";
  L.push(`    ${c.date}  ${m2(c.day).padStart(9)}   cum ${m2(c.cum).padStart(9)}  ${ch} ${mark}`);
}
L.push("");

// ---- ACCOUNT / TOTALS ----
const tradingDays = days.length;
const avgDay = totalPnl / tradingDays;
const greenDays = curve.filter((c) => c.day > 0).length;
L.push("  TOTALS");
L.push(`    Net P&L       ${m2(totalPnl)} over ${tradingDays} day${tradingDays === 1 ? "" : "s"}`);
L.push(`    Avg / day     ${m2(avgDay)}   (target $${target.toFixed(0)})`);
L.push(`    Green days    ${greenDays}/${tradingDays}`);
if (startBal !== null) {
  L.push(`    Account       $${(startBal + totalPnl).toFixed(2)}   (start $${startBal.toFixed(2)} ${m2(totalPnl)})`);
}

console.log(L.join("\n"));
