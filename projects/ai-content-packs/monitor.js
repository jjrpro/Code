// =============================================================================
// DropVault monitor — read-only revenue dashboard
// =============================================================================
//
// This is what Claude runs each session to fully monitor the store. It pulls
// every charge straight from the Coinbase Commerce API (the source of truth)
// and prints a sales + revenue summary. Read-only: it never moves money.
//
//   node monitor.js            # full summary
//   node monitor.js --json     # machine-readable (for Claude to parse)
//
// Needs only:  CC_API_KEY  (a read-only Coinbase Commerce API key is enough)
// =============================================================================

const CC_API_KEY = process.env.CC_API_KEY;
const CC_API = 'https://api.commerce.coinbase.com';
const asJson = process.argv.includes('--json');

if (!CC_API_KEY) {
  console.error('Set CC_API_KEY (read-only Coinbase Commerce key is fine).');
  process.exit(1);
}

async function ccFetch(pathname) {
  const res = await fetch(`${CC_API}${pathname}`, {
    headers: { 'X-CC-Api-Key': CC_API_KEY, 'X-CC-Version': '2018-03-22' },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Coinbase Commerce ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

// Walk every page of /charges
async function allCharges() {
  let url = '/charges?limit=100';
  const out = [];
  while (url) {
    const page = await ccFetch(url);
    out.push(...page.data);
    url = page.pagination?.next_uri || null;
  }
  return out;
}

function isPaid(c) {
  const s = c.timeline?.[c.timeline.length - 1]?.status;
  return s === 'COMPLETED' || s === 'CONFIRMED' || s === 'RESOLVED';
}

(async () => {
  const charges = await allCharges();
  const paid = charges.filter(isPaid);

  const byPack = {};
  let revenue = 0;
  for (const c of paid) {
    const amt = parseFloat(c.pricing?.local?.amount || '0');
    revenue += amt;
    const pack = c.metadata?.pack_id || c.name || 'unknown';
    byPack[pack] = byPack[pack] || { count: 0, revenue: 0 };
    byPack[pack].count += 1;
    byPack[pack].revenue += amt;
  }

  const now = Date.now();
  const since = (h) => paid.filter(c => now - new Date(c.confirmed_at || c.created_at).getTime() < h * 3600e3).length;

  const summary = {
    generated_at: new Date().toISOString(),
    charges_created: charges.length,
    sales: paid.length,
    revenue_usd: Number(revenue.toFixed(2)),
    sales_24h: since(24),
    sales_7d: since(24 * 7),
    by_pack: byPack,
  };

  if (asJson) { console.log(JSON.stringify(summary, null, 2)); return; }

  console.log('\n  DropVault — revenue monitor');
  console.log('  ' + '-'.repeat(40));
  console.log(`  Sales (paid)     ${summary.sales}`);
  console.log(`  Revenue          $${summary.revenue_usd}`);
  console.log(`  Last 24h         ${summary.sales_24h} sale(s)`);
  console.log(`  Last 7d          ${summary.sales_7d} sale(s)`);
  console.log(`  Checkouts opened ${summary.charges_created}`);
  console.log('  ' + '-'.repeat(40));
  for (const [pack, s] of Object.entries(byPack).sort((a, b) => b[1].revenue - a[1].revenue)) {
    console.log(`  ${pack.padEnd(24)} ${String(s.count).padStart(3)} sold   $${s.revenue.toFixed(2)}`);
  }
  console.log('');
})().catch(err => { console.error('monitor failed:', err.message); process.exit(1); });
