#!/usr/bin/env node
// CLAURX — trade journal review. Reads trades.csv, prints coaching stats.
// Usage:  node review.mjs            (all trades)
//         node review.mjs MGC        (filter by instrument)
//         node review.mjs --since 2026-06-01
// No dependencies, no network. Honest math only — empty in, empty out.

import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const since = (() => {
  const i = args.indexOf("--since");
  return i >= 0 ? args[i + 1] : null;
})();
const instrument = args.find((a) => !a.startsWith("--") && a !== since)?.toUpperCase();

let raw;
try {
  raw = readFileSync(new URL("./trades.csv", import.meta.url), "utf8");
} catch {
  console.error("No trades.csv found next to review.mjs.");
  process.exit(1);
}

// minimal CSV parse (no embedded commas in our fields except notes, which is last)
const lines = raw.split(/\r?\n/).filter((l) => l.trim());
const header = lines.shift()?.split(",").map((h) => h.trim());
const cols = ["date", "instrument", "direction", "entry", "exit", "contracts", "pnl", "setup", "rule_followed", "notes"];
const idx = Object.fromEntries(cols.map((c) => [c, header.indexOf(c)]));

let trades = lines.map((line) => {
  // split into at most 10 fields so notes can contain commas
  const parts = line.split(",");
  const fixed = parts.slice(0, 9);
  const notes = parts.slice(9).join(",");
  const row = [...fixed, notes];
  return {
    date: row[idx.date]?.trim(),
    instrument: row[idx.instrument]?.trim().toUpperCase(),
    direction: row[idx.direction]?.trim().toLowerCase(),
    pnl: Number(row[idx.pnl]),
    setup: row[idx.setup]?.trim(),
    rule: /^y/i.test(row[idx.rule_followed]?.trim() || ""),
    notes: row[idx.notes]?.trim(),
  };
});

if (instrument) trades = trades.filter((t) => t.instrument === instrument);
if (since) trades = trades.filter((t) => t.date >= since);

if (!trades.length) {
  console.log("No trades logged yet" + (instrument ? ` for ${instrument}` : "") + ".");
  console.log("Tell CLAURX a trade and it'll append it — or add a row to trades.csv.");
  process.exit(0);
}

const m2 = (n) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
const wins = trades.filter((t) => t.pnl > 0);
const losses = trades.filter((t) => t.pnl < 0);
const total = trades.reduce((s, t) => s + t.pnl, 0);
const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
const avgWin = wins.length ? grossWin / wins.length : 0;
const avgLoss = losses.length ? grossLoss / losses.length : 0;
const pf = grossLoss ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
const ruled = trades.filter((t) => t.rule);
const broke = trades.filter((t) => !t.rule);
const ruledPnl = ruled.reduce((s, t) => s + t.pnl, 0);
const brokePnl = broke.reduce((s, t) => s + t.pnl, 0);

const L = [];
L.push(`CLAURX · Trade Review${instrument ? " · " + instrument : ""}${since ? " · since " + since : ""}`);
L.push("─".repeat(44));
L.push(`  Trades        ${trades.length}   (W ${wins.length} / L ${losses.length})`);
L.push(`  Win rate      ${((wins.length / trades.length) * 100).toFixed(0)}%`);
L.push(`  Net P&L       ${m2(total)}`);
L.push(`  Avg win       ${m2(avgWin)}    Avg loss  ${m2(-avgLoss)}`);
L.push(`  Profit factor ${pf === Infinity ? "∞" : pf.toFixed(2)}`);
L.push(`  Expectancy    ${m2(total / trades.length)} / trade`);
L.push("");
L.push("  Discipline (did you follow your rules?)");
L.push(`    Followed    ${ruled.length}/${trades.length} → ${m2(ruledPnl)}`);
L.push(`    Broke rules ${broke.length}/${trades.length} → ${m2(brokePnl)}`);
if (broke.length && brokePnl < ruledPnl / Math.max(1, ruled.length))
  L.push(`    ⚠ Rule-breaks are costing you. The data says: follow the plan.`);

// by instrument (when not filtered)
if (!instrument) {
  const by = {};
  for (const t of trades) (by[t.instrument] ||= []).push(t);
  L.push("");
  L.push("  By instrument");
  for (const [k, ts] of Object.entries(by)) {
    const p = ts.reduce((s, t) => s + t.pnl, 0);
    const w = ts.filter((t) => t.pnl > 0).length;
    L.push(`    ${k.padEnd(5)} ${ts.length}t  ${((w / ts.length) * 100).toFixed(0)}% win  ${m2(p)}`);
  }
}

console.log(L.join("\n"));
