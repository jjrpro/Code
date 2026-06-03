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
const TOKEN = process.env.SHOPIFY_TOKEN;
const THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD || 5);
const API = process.env.API_VERSION || "2025-01";
const JSON_OUT = process.argv.includes("--json");
const TIER_PRICES = [16.99, 19.99, 24.99];
const TZ = "America/New_York";

if (!TOKEN) {
  console.error(
    "CLAURX: missing SHOPIFY_TOKEN. Set it in your env (do NOT commit it).\n" +
      "  export SHOPIFY_TOKEN=shpat_...   export SHOPIFY_STORE=jaurxflips"
  );
  process.exit(1);
}

const BASE = `https://${STORE}.myshopify.com/admin/api/${API}`;
const headers = { "X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json" };

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
function render(orders30, variants) {
  const o = viewOrders(orders30);
  const low = viewLowStock(variants);
  const tiers = viewTiers(variants);
  const trend = viewTrend(orders30, 7);

  const L = [];
  L.push(`CLAURX · jaurxflips · ${new Date().toLocaleString("en-US", { timeZone: TZ })} EST\n`);

  L.push("── TODAY ──");
  L.push(`  Orders ${o.today.count}   Revenue ${money(o.today.revenue)}   AOV ${money(o.today.aov)}`);
  L.push(`  Rolling 7d: ${o.rolling7.count} orders · ${money(o.rolling7.revenue)} · AOV ${money(o.rolling7.aov)}\n`);

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
  L.push("");

  L.push("── REVENUE TREND (last 7d, EST) ──");
  const days = Object.keys(trend).sort();
  const max = Math.max(1, ...days.map((d) => trend[d].rev));
  for (const d of days) {
    const bar = "█".repeat(Math.round((trend[d].rev / max) * 24));
    L.push(`  ${d}  ${money(trend[d].rev).padStart(9)}  ${trend[d].count}o  ${bar}`);
  }

  return L.join("\n");
}

// --- main -----------------------------------------------------------------
(async () => {
  try {
    const since = startOfDayISO(29); // 30-day window covers today+7d+trend
    const [orders30, variants] = await Promise.all([getOrdersSince(since), getVariants()]);
    if (JSON_OUT) {
      console.log(JSON.stringify({
        generatedAt: new Date().toISOString(),
        store: STORE,
        orders: viewOrders(orders30),
        lowStock: viewLowStock(variants),
        tiers: viewTiers(variants),
        trend7: viewTrend(orders30, 7),
        trend30: viewTrend(orders30, 30),
      }, null, 2));
    } else {
      console.log(render(orders30, variants));
    }
  } catch (e) {
    console.error(`CLAURX: Shopify pull failed — ${e.message}`);
    process.exit(1);
  }
})();
