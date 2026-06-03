#!/usr/bin/env node
// CLAURX — daily briefing generator (the 11AM / evening recap).
// Composes a butler-voice briefing from sources that are actually connected.
// HONEST BY DESIGN: any source not wired renders "not connected" — CLAURX
// never invents a number it can't pull. Trading + open-loops run fully
// offline today; weather/news/calendar/store light up when keys land on the
// always-on host. No external deps.
//
// Usage:  node briefing.mjs                 (morning briefing)
//         node briefing.mjs --evening       (evening recap framing)
//         node briefing.mjs --date 2026-06-03
//
// Designed to be cron'd on the always-on host:
//   0 11 * * *  node /path/briefing.mjs            >> briefing.log
//   30 21 * * * node /path/briefing.mjs --evening  >> briefing.log

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const evening = args.includes("--evening");
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : null;
};

let cfg = {
  owner: "Jaurx (JR)",
  timezone: "America/New_York",
  sections: { trading: true, store: false, weather: false, market_news: false, calendar: false, open_loops: true },
};
try {
  cfg = { ...cfg, ...JSON.parse(readFileSync(join(HERE, "briefing.config.json"), "utf8")) };
} catch {
  /* defaults fine */
}
const S = cfg.sections || {};

const now = new Date();
const tz = cfg.timezone || "America/New_York";
const dateStr =
  flag("--date") ||
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
const timeStr = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(now);
const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now));

// ---- butler greeting ----
const partOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
const greet = evening
  ? `Good evening, ${cfg.owner}. The day's recap.`
  : `Good ${partOfDay}, ${cfg.owner}. Your briefing for ${dateStr}, ${timeStr}.`;

const out = [];
out.push("═".repeat(56));
out.push("  CLAURX · " + (evening ? "EVENING RECAP" : "MORNING BRIEFING"));
out.push("  " + greet);
out.push("═".repeat(56));

const NC = "      ·  not connected — wire its source on the host to enable.";

// ---- TRADING (real, offline) ----
if (S.trading) {
  out.push("");
  out.push("▍ TRADING — your $500/day scoreboard");
  try {
    const eq = execFileSync("node", [join(HERE, "..", "journal", "equity.mjs")], { encoding: "utf8" });
    out.push(eq.split("\n").map((l) => (l ? "  " + l : l)).join("\n").replace(/\n+$/, ""));
  } catch (e) {
    out.push("      ·  journal scoreboard unavailable: " + (e.message || e));
  }
}

// ---- STORE ----
if (S.store) {
  out.push("");
  out.push("▍ STORE — JaurxShops today");
  try {
    const sh = execFileSync("node", [join(HERE, "..", "shopify", "claurx-shopify.mjs")], { encoding: "utf8" });
    out.push(sh.split("\n").map((l) => (l ? "  " + l : l)).join("\n").replace(/\n+$/, ""));
  } catch (e) {
    out.push("      ·  store dashboard not reading (approve app + secret): " + (e.message || e).split("\n")[0]);
  }
} else {
  out.push("");
  out.push("▍ STORE — JaurxShops");
  out.push(NC);
}

// ---- WEATHER / NEWS / CALENDAR (pluggable; honest stubs) ----
for (const [key, label] of [
  ["weather", "WEATHER"],
  ["market_news", "MARKET NEWS — MGC / MNQ"],
  ["calendar", "CALENDAR"],
]) {
  out.push("");
  out.push("▍ " + label);
  out.push(S[key] ? "      ·  adapter enabled but not yet implemented on this host." : NC);
}

// ---- OPEN LOOPS (real, offline) ----
if (S.open_loops) {
  out.push("");
  out.push("▍ OPEN LOOPS");
  try {
    const raw = readFileSync(join(HERE, "open-loops.md"), "utf8");
    const items = raw
      .split(/\r?\n/)
      .filter((l) => /^\s*-\s+(TODO|WAIT|IDEA|DONE):/i.test(l))
      .map((l) => l.replace(/^\s*-\s+/, ""));
    const icon = { TODO: "□", WAIT: "⏳", IDEA: "💡", DONE: "✔" };
    if (!items.length) out.push("      ·  no open loops logged. A clean slate, for once.");
    for (const it of items) {
      const tag = it.split(":")[0].toUpperCase();
      out.push(`  ${icon[tag] || "·"} ${it.replace(/^\w+:\s*/, "")}`);
    }
  } catch {
    out.push("      ·  open-loops.md not found.");
  }
}

// ---- sign-off ----
out.push("");
out.push("─".repeat(56));
out.push(evening ? "  That's the day, " + cfg.owner + ". Rest. — CLAURX" : "  At your service, " + cfg.owner + ". — CLAURX");
console.log(out.join("\n"));
