#!/usr/bin/env node
// CLAURX — Shopify read-only dashboard for jaurxflips.
// Read-only: uses an Admin API token with read_orders, read_products,
// read_inventory, read_reports. Makes NO writes. Ever.
//
// Usage:
//   SHOPIFY_STORE=jaurxflips SHOPIFY_TOKEN=shpat_xxx node claurx-shopify.mjs
//   node claurx-shopify.mjs --json     # machine-readable output
//
// Env:
//   SHOPIFY_STORE        store handle (default: jaurxflips)
//   SHOPIFY_TOKEN        Admin API access token (shpat_...)  [required]
//   LOW_STOCK_THRESHOLD  flag variants at/under this qty (default: 5)
//   API_VERSION          Admin API version (default: 2025-01)

const STORE = process.env.SHOPIFY_STORE || "jaurxflips";
const TOKEN = process.env.SHOPIFY_TOKEN;            // optional legacy static shpat_
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;     // dev-dashboard app
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);
const API = process.env.API_VERSION || "2025-01";
const JSON_OUT = process.argv.includes("--json");
const TIER_PRICES = [16.99, 19.99, 24.99];
const TZ = "America/New_York";

if (!TOKEN && !(CLIENT_ID && CLIENT_SECRET)) {
  console.error(
    "CLAURX: missing credentials. Provide EITHER client-credentials (dev dashboard)\n" +
      "  SHOPIFY_CLIENT_ID=...  SHOPIFY_CLIENT_SECRET=...\n" +
      "or a legacy static token  SHOPIFY_TOKEN=shpat_...  — plus SHOPIFY_STORE=jaurxflips.\n" +
      "Never commit these."
  );
  process.exit(1);
}

const ORIGIN = `https://${STORE}.myshopify.com`;
const BASE = `${ORIGIN}/admin/api/${API}`;
let headers = { "Content-Type": "application/json" }; // access token set after auth

// Acquire an Admin API access token. Uses a static token if supplied;
// otherwise mints a 24h token via the OAuth client-credentials grant — the
// path required for apps created in the Shopify dev dashboard (post-2026).
async function authenticate() {
  if (TOKEN) {
    headers["X-Shopify-Access-Token"] = TOKEN;
    return;
  }
  const res = await fetch(`${ORIGIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`auth ${res.status} (client credentials): ${body.slice(0, 300)}`);
  }
  const j = await res.json();
  if (!j.access_token) throw new Error("auth succeeded but no access_token in response");
  headers["X-Shopify-Access-Token"] = j.access_token;
}

// --- HTTP helpers (REST, with Link-header pagination) ---------------------
async function rest(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return { data: await res.json(), link: res.headers.get("link") };
}

// follow `rel="next"` pages, collecting one top-level array key
async function restAll(firstPath, key) {
  let out = [];
  let path = firstPath;
  while (path) {
    const { data, link } = await rest(path);
    out = out.concat(data[key] || []);
    const next = link && link.match(/<([^>]+)>;\s*rel="next"/);
    path = next ? next[1].replace(BASE, "") : null;
  }
  return out;
}

// --- date helpers (everything in EST per JR's rhythm) ---------------------
function ymdInTZ(d = new Date()) {
  // returns YYYY-MM-DD for the wall-clock date in TZ
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(d);
  const g = (t) => p.find((x) => x.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}
// ISO instant for start-of-day (00:00 TZ) N days ago
function startOfDayISO(daysAgo = 0) {
  const now = new Date();
  const ymd = ymdInTZ(new Date(now.getTime() - daysAgo * 86400000));
  // EST/EDT offset for that date: derive from the formatted zone
  const dt = new Date(`${ymd}T00:00:00`);
  const asTZ = new Date(dt.toLocaleString("en-US", { timeZone: TZ }));
  const asUTC = new Date(dt.toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMs = asUTC.getTime() - asTZ.getTime();
  return new Date(dt.getTime() + offsetMs).toISOString();
}

function money(n) { return `$${Number(n).toFixed(2)}`; }

// --- data pulls -----------------------------------------------------------
async function getOrdersSince(iso) {
  // any financial status, exclude cancelled; need totals + line counts + dates
  const fields = "id,created_at,total_price,subtotal_price,current_total_price,financial_status,cancelled_at";
  return restAll(
    `/orders.json?status=any&created_at_min=${encodeURIComponent(iso)}&limit=250&fields=${fields}`,
    "orders"
  );
}

function summarize(orders) {
  const live = orders.filter((o) => !o.cancelled_at);
  const revenue = live.reduce((s, o) => s + Number(o.current_total_price || o.total_price || 0), 0);
  const count = live.length;
  return { count, revenue, aov: count ? revenue / count : 0 };
}

function windowSlice(orders, daysAgo) {
  const cut = new Date(startOfDayISO(daysAgo)).getTime();
  return orders.filter((o) => new Date(o.created_at).getTime() >= cut);
}

async function getVariants() {
  const products = await restAll(
    "/products.json?limit=250&fields=id,title,variants,status",
    "products"
  );
  const variants = [];
  for (const p of products) {
    for (const v of p.variants || []) {
      variants.push({
        product: p.title,
        productStatus: p.status,
        title: v.title,
        sku: v.sku,
        price: Number(v.price),
        qty: v.inventory_quantity,
        policy: v.inventory_policy,
      });
    }
  }
  return variants;
}

// --- views ----------------------------------------------------------------
function viewOrders(all) {
  const today = summarize(windowSlice(all, 0));
  const d7 = summarize(windowSlice(all, 6)); // today + prior 6 = rolling 7
  return { today, rolling7: d7 };
}

function viewLowStock(variants) {
  return variants
    .filter((v) => v.productStatus === "active" && v.policy !== "continue")
    .filter((v) => typeof v.qty === "number" && v.qty <= THRESHOLD)
    .sort((a, b) => a.qty - b.qty);
}

function viewTiers(variants) {
  const offTier = variants
    .filter((v) => v.productStatus === "active")
    .filter((v) => !TIER_PRICES.includes(Number(v.price.toFixed(2))));
  const byTier = {};
  for (const t of TIER_PRICES) byTier[t] = variants.filter((v) => Number(v.price.toFixed(2)) === t).length;
  return { byTier, offTier };
}

function viewTrend(all, days) {
  const buckets = {};
  for (let i = 0; i < days; i++) buckets[ymdInTZ(new Date(Date.now() - i * 86400000))] = { count: 0, rev: 0 };
  for (const o of all) {
    if (o.cancelled_at) continue;
    const day = ymdInTZ(new Date(o.created_at));
    if (buckets[day]) {
      buckets[day].count++;
      buckets[day].rev += Number(o.current_total_price || o.total_price || 0);
    }
  }
  return buckets;
}

// --- render ---------------------------------------------------------------
function render(orders30, variants, errs = {}) {
  const L = [];
  L.push(`CLAURX · jaurxflips · ${new Date().toLocaleString("en-US", { timeZone: TZ })} EST\n`);

  if (orders30) {
    const o = viewOrders(orders30);
    const trend = viewTrend(orders30, 7);
    L.push("── TODAY ──");
    L.push(`  Orders ${o.today.count}   Revenue ${money(o.today.revenue)}   AOV ${money(o.today.aov)}`);
    L.push(`  Rolling 7d: ${o.rolling7.count} orders · ${money(o.rolling7.revenue)} · AOV ${money(o.rolling7.aov)}\n`);
    L.push("── REVENUE TREND (last 7d, EST) ──");
    const days = Object.keys(trend).sort();
    const max = Math.max(1, ...days.map((d) => trend[d].rev));
    for (const d of days) {
      const bar = "█".repeat(Math.round((trend[d].rev / max) * 24));
      L.push(`  ${d}  ${money(trend[d].rev).padStart(9)}  ${trend[d].count}o  ${bar}`);
    }
    L.push("");
  } else {
    L.push("── ORDERS / REVENUE ──");
    L.push(`  ⚠ unavailable — ${errs.orders || "no data"}`);
    L.push("");
  }

  if (variants) {
    const low = viewLowStock(variants);
    const tiers = viewTiers(variants);
    L.push(`── LOW STOCK (≤ ${THRESHOLD}, active, tracked) ──`);
    if (!low.length) L.push("  None. Shelves are fine.");
    else for (const v of low) L.push(`  ⚠ ${v.qty.toString().padStart(3)}  ${v.product} / ${v.title}  ${v.sku ? "(" + v.sku + ")" : ""}`);
    L.push("");
    L.push("── PRICE TIERS ($16.99 / $19.99 / $24.99) ──");
    L.push(`  Counts:  16.99→${tiers.byTier[16.99]}   19.99→${tiers.byTier[19.99]}   24.99→${tiers.byTier[24.99]}`);
    if (tiers.offTier.length) {
      L.push(`  Off-tier (${tiers.offTier.length}):`);
      for (const v of tiers.offTier) L.push(`    ✗ ${money(v.price)}  ${v.product} / ${v.title}`);
    } else L.push("  All active variants map to the three tiers.");
  } else {
    L.push("── PRODUCTS / INVENTORY ──");
    L.push(`  ⚠ unavailable — ${errs.variants || "no data"}`);
  }

  return L.join("\n");
}

// --- main -----------------------------------------------------------------
(async () => {
  try {
    await authenticate();
  } catch (e) {
    console.error(`CLAURX: authentication failed — ${e.message}`);
    process.exit(1);
  }

  // Pull each domain independently so one missing scope doesn't sink the rest.
  const since = startOfDayISO(29); // 30-day window covers today+7d+trend
  const [oRes, vRes] = await Promise.allSettled([getOrdersSince(since), getVariants()]);
  const orders30 = oRes.status === "fulfilled" ? oRes.value : null;
  const variants = vRes.status === "fulfilled" ? vRes.value : null;
  const errs = {};
  if (oRes.status === "rejected") errs.orders = oRes.reason.message;
  if (vRes.status === "rejected") errs.variants = vRes.reason.message;

  if (JSON_OUT) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      store: STORE,
      errors: errs,
      orders: orders30 ? viewOrders(orders30) : null,
      lowStock: variants ? viewLowStock(variants) : null,
      tiers: variants ? viewTiers(variants) : null,
      trend7: orders30 ? viewTrend(orders30, 7) : null,
      trend30: orders30 ? viewTrend(orders30, 30) : null,
    }, null, 2));
  } else {
    console.log(render(orders30, variants, errs));
    if (errs.orders && /protected customer data|merchant approval|read_orders/i.test(errs.orders)) {
      console.log("\nNote: revenue/orders need 'Protected customer data access' approved");
      console.log("in the dev dashboard (App → API access). Catalog data works without it.");
    }
  }

  if (!orders30 && !variants) process.exit(1); // total failure only
})();
