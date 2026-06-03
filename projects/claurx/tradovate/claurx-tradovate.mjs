#!/usr/bin/env node
// CLAURX — Tradovate account status (read-only pull).
// Shows account equity / cash balance / P&L and open positions.
// Read-only: this script never places, modifies, or cancels an order.
//
// Usage:
//   node claurx-tradovate.mjs           human-readable
//   node claurx-tradovate.mjs --json    machine-readable
//
// Env (put in tradovate.env — git-ignored, NEVER commit):
//   TRADOVATE_ENV       live | demo            (default: live)
//   TRADOVATE_NAME      your Tradovate username/login
//   TRADOVATE_PASSWORD  your Tradovate password
//   TRADOVATE_CID       API key id   (number, from Tradovate API key)
//   TRADOVATE_SEC       API secret   (from Tradovate API key)
//   TRADOVATE_APP_ID    app label    (default: "CLAURX")
//
// Requires a LIVE account with >$1000 equity + the API Access subscription.

const ENV = (process.env.TRADOVATE_ENV || "live").toLowerCase();
const NAME = process.env.TRADOVATE_NAME;
const PASSWORD = process.env.TRADOVATE_PASSWORD;
const CID = process.env.TRADOVATE_CID;
const SEC = process.env.TRADOVATE_SEC;
const APP_ID = process.env.TRADOVATE_APP_ID || "CLAURX";
const JSON_OUT = process.argv.includes("--json");

const BASE = ENV === "demo"
  ? "https://demo.tradovateapi.com/v1"
  : "https://live.tradovateapi.com/v1";

if (!NAME || !PASSWORD || !CID || !SEC) {
  console.error(
    "CLAURX: missing Tradovate credentials. Set in tradovate.env (never commit):\n" +
      "  TRADOVATE_NAME, TRADOVATE_PASSWORD, TRADOVATE_CID, TRADOVATE_SEC\n" +
      "  (optional TRADOVATE_ENV=live|demo). See README."
  );
  process.exit(1);
}

let TOKEN = null;

async function authenticate() {
  const res = await fetch(`${BASE}/auth/accesstokenrequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: NAME,
      password: PASSWORD,
      appId: APP_ID,
      appVersion: "1.0",
      cid: Number(CID),
      sec: SEC,
    }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`auth ${res.status}: ${JSON.stringify(j).slice(0, 300)}`);
  if (j.errorText) throw new Error(`auth rejected: ${j.errorText}`);
  if (j.p === true || (!j.accessToken && j["p-ticket"]))
    throw new Error("auth needs CAPTCHA/penalty wait (too many attempts) — try again shortly");
  if (!j.accessToken) throw new Error(`auth ok but no accessToken: ${JSON.stringify(j).slice(0, 200)}`);
  TOKEN = j.accessToken;
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} on ${path}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const m2 = (n) => `${n < 0 ? "-" : ""}$${Math.abs(Number(n) || 0).toFixed(2)}`;

function render(accounts, balances, positions) {
  const L = [];
  L.push(`CLAURX · Tradovate (${ENV}) · ${new Date().toLocaleString("en-US", { timeZone: "America/New_York" })} EST`);
  L.push("─".repeat(52));

  for (const a of accounts) {
    const b = balances[a.id] || {};
    L.push(`  Account ${a.name || a.id}${a.nickname ? " (" + a.nickname + ")" : ""}`);
    if (b.totalCashValue != null) L.push(`    Cash value   ${m2(b.totalCashValue)}`);
    if (b.netLiq != null) L.push(`    Net liq      ${m2(b.netLiq)}`);
    if (b.openPnL != null) L.push(`    Open P&L     ${m2(b.openPnL)}`);
    if (b.realizedPnL != null) L.push(`    Realized P&L ${m2(b.realizedPnL)}`);
    if (b.weekRealizedPnL != null) L.push(`    Week P&L     ${m2(b.weekRealizedPnL)}`);
    // fallback: surface any other numeric fields we didn't name
    const known = new Set(["totalCashValue", "netLiq", "openPnL", "realizedPnL", "weekRealizedPnL"]);
    for (const [k, v] of Object.entries(b))
      if (!known.has(k) && typeof v === "number" && /pnl|cash|balance|liq|margin/i.test(k))
        L.push(`    ${k.padEnd(12)} ${m2(v)}`);
    L.push("");
  }

  const open = positions.filter((p) => p.netPos && p.netPos !== 0);
  L.push(`  Open positions: ${open.length}`);
  for (const p of open)
    L.push(`    contract ${p.contractId}  net ${p.netPos > 0 ? "+" : ""}${p.netPos} @ ${p.netPrice ?? "?"}`);

  return L.join("\n");
}

(async () => {
  try {
    await authenticate();
  } catch (e) {
    console.error(`CLAURX: Tradovate auth failed — ${e.message}`);
    process.exit(1);
  }

  const errs = {};
  let accounts = [], balances = {}, positions = [];
  try {
    accounts = await get("/account/list");
  } catch (e) { errs.accounts = e.message; }

  // cash-balance snapshot per account
  for (const a of accounts) {
    try {
      balances[a.id] = await post("/cashBalance/getcashBalanceSnapshot", { accountId: a.id });
    } catch (e) { errs[`balance_${a.id}`] = e.message; }
  }

  try {
    positions = await get("/position/list");
  } catch (e) { errs.positions = e.message; }

  if (JSON_OUT) {
    console.log(JSON.stringify({ env: ENV, generatedAt: new Date().toISOString(), accounts, balances, positions, errors: errs }, null, 2));
  } else {
    if (!accounts.length) {
      console.error(`CLAURX: no accounts returned. ${errs.accounts || "Check API Access subscription + live equity > $1000."}`);
      process.exit(1);
    }
    console.log(render(accounts, balances, positions));
    if (Object.keys(errs).length) console.log(`\nNote: some calls failed — ${Object.values(errs).join("; ")}`);
  }
})();
