// =============================================================================
// DropVault — AI content pack store
// Coinbase Commerce checkout (card -> instant USDC) + digital-download delivery
// =============================================================================
//
// Run on your Mac:
//   cd ~/dropvault && npm install && node server.js
//
// Required env vars (put them in a .env-style export in ~/.zshrc, or a .env file):
//   CC_API_KEY          = Coinbase Commerce API key   (Settings -> Security)
//   CC_WEBHOOK_SECRET   = Coinbase Commerce webhook shared secret (Settings -> Webhooks)
//   DOWNLOAD_SECRET     = any long random string you make up (signs download links)
//   PUBLIC_URL          = https://store.yourdomain.com  (or your ngrok URL while testing)
//   PORT                = 3000  (optional)
//
// Money flow: buyer pays by card/crypto on Coinbase's hosted page -> Coinbase
// settles to USDC in YOUR Coinbase account instantly -> webhook fires ->
// we hand the buyer a signed, time-limited download link for the pack ZIP.
// No payout schedule. Nothing to wait for.
// =============================================================================

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const CC_API_KEY = process.env.CC_API_KEY;
const CC_WEBHOOK_SECRET = process.env.CC_WEBHOOK_SECRET;
const DOWNLOAD_SECRET = process.env.DOWNLOAD_SECRET;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;
const CC_API = 'https://api.commerce.coinbase.com';

if (!CC_API_KEY || !CC_WEBHOOK_SECRET || !DOWNLOAD_SECRET) {
  console.error('[dropvault] missing env vars. Need CC_API_KEY, CC_WEBHOOK_SECRET, DOWNLOAD_SECRET. See SETUP.md');
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalog.json'), 'utf8'));
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const DOWNLOAD_TTL_HOURS = 48;

// ---------- order state (flat-file, zero-dependency) ----------

function loadOrders() {
  try { return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); }
  catch (e) { return { orders: [] }; }
}
function saveOrders(state) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(state, null, 2));
}
function upsertOrder(record) {
  const state = loadOrders();
  const idx = state.orders.findIndex(o => o.charge_code === record.charge_code);
  if (idx >= 0) state.orders[idx] = { ...state.orders[idx], ...record, updated_at: new Date().toISOString() };
  else state.orders.push({ ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  saveOrders(state);
}
function findOrder(chargeCode) {
  return loadOrders().orders.find(o => o.charge_code === chargeCode);
}

function getPack(id) {
  return catalog.packs.find(p => p.id === id && p.active);
}

// ---------- signed, time-limited download tokens ----------
// token = base64url(payload).hmac  where payload = {packId, code, exp}

function signToken(packId, code) {
  const exp = Date.now() + DOWNLOAD_TTL_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ packId, code, exp })).toString('base64url');
  const sig = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}
function verifyToken(token) {
  try {
    const [payload, sig] = String(token).split('.');
    if (!payload || !sig) return null;
    const expected = crypto.createHmac('sha256', DOWNLOAD_SECRET).update(payload).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expected);
    // length check first — timingSafeEqual throws on length mismatch (forged sig)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data || typeof data.exp !== 'number' || Date.now() > data.exp) return null;
    return data;
  } catch (e) {
    return null;
  }
}

// ---------- Coinbase Commerce helpers ----------

async function ccFetch(pathname, options = {}) {
  const res = await fetch(`${CC_API}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': CC_API_KEY,
      'X-CC-Version': '2018-03-22',
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Coinbase Commerce ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
}

async function createCharge(pack) {
  return ccFetch('/charges', {
    method: 'POST',
    body: JSON.stringify({
      name: pack.name,
      description: pack.blurb,
      pricing_type: 'fixed_price',
      local_price: { amount: pack.price, currency: catalog.currency },
      metadata: { pack_id: pack.id },
      redirect_url: `${PUBLIC_URL}/success.html?code={CHARGE_CODE}`,
      cancel_url: `${PUBLIC_URL}/cancel.html`,
    }),
  });
}

// ---------- app ----------

const app = express();

// Webhook needs the raw body for signature verification — mount raw ONLY here.
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const sig = req.headers['x-cc-webhook-signature'];
  const expected = crypto.createHmac('sha256', CC_WEBHOOK_SECRET).update(req.body).digest('hex');
  if (!sig || sig !== expected) {
    console.error('[webhook] bad signature');
    return res.status(400).send('bad signature');
  }

  const event = JSON.parse(req.body.toString('utf8')).event;
  const charge = event.data;
  const packId = charge.metadata?.pack_id;
  console.log('[webhook]', event.type, charge.code, packId);

  // 'confirmed' = crypto seen & confirmed; 'resolved' = settled. Either means paid.
  if (event.type === 'charge:confirmed' || event.type === 'charge:resolved') {
    const pack = getPack(packId);
    const paid = charge.payments?.find(p => p.status === 'CONFIRMED');
    upsertOrder({
      charge_code: charge.code,
      pack_id: packId,
      pack_name: pack?.name || packId,
      price: pack?.price || charge.pricing?.local?.amount,
      currency: charge.pricing?.local?.currency || catalog.currency,
      amount_paid: paid?.value?.crypto?.amount || null,
      crypto: paid?.value?.crypto?.currency || null,
      buyer_email: charge.metadata?.email || null,
      status: 'paid',
    });
    console.log(`[order] PAID  ${pack?.name || packId}  ${charge.code}`);
  } else if (event.type === 'charge:failed') {
    upsertOrder({ charge_code: charge.code, pack_id: packId, status: 'failed' });
  }

  res.json({ received: true });
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Public catalog for the storefront to render
app.get('/api/catalog', (req, res) => {
  res.json({
    brand: catalog.brand,
    tagline: catalog.tagline,
    packs: catalog.packs.filter(p => p.active).map(({ file, ...pub }) => pub),
  });
});

// Storefront "Buy" button calls this -> returns the Coinbase hosted checkout URL
app.get('/api/checkout', async (req, res) => {
  const pack = getPack(req.query.pack);
  if (!pack) return res.status(404).json({ error: 'unknown pack' });
  try {
    const charge = await createCharge(pack);
    upsertOrder({ charge_code: charge.code, pack_id: pack.id, pack_name: pack.name, price: pack.price, status: 'pending' });
    res.json({ hosted_url: charge.hosted_url, code: charge.code });
  } catch (err) {
    console.error('[checkout]', err.message);
    res.status(500).json({ error: 'could not create checkout' });
  }
});

// success.html polls this with ?code= to fetch the signed download link once paid
app.get('/api/order', (req, res) => {
  const order = findOrder(req.query.code);
  if (!order) return res.status(404).json({ error: 'unknown order' });
  if (order.status !== 'paid') return res.status(202).json({ pending: true });
  const pack = getPack(order.pack_id);
  res.json({
    pack_name: order.pack_name,
    download_url: `${PUBLIC_URL}/download?token=${signToken(order.pack_id, order.charge_code)}`,
    expires_hours: DOWNLOAD_TTL_HOURS,
  });
});

// Gated download — validates the signed token, then streams the pack ZIP
app.get('/download', (req, res) => {
  const data = verifyToken(req.query.token);
  if (!data) return res.status(403).send('Link invalid or expired. Email ' + catalog.support_email);
  const pack = catalog.packs.find(p => p.id === data.packId);
  const file = pack && path.join(__dirname, pack.file);
  if (!file || !fs.existsSync(file)) return res.status(404).send('Pack file not found. Email ' + catalog.support_email);
  res.download(file, `${pack.id}.zip`);
});

app.get('/health', (req, res) => {
  const o = loadOrders().orders;
  res.json({ ok: true, total: o.length, paid: o.filter(x => x.status === 'paid').length });
});

app.get('/', (req, res) => res.redirect('/index.html'));

app.listen(PORT, () => {
  console.log(`[dropvault] live on :${PORT}  (${PUBLIC_URL})`);
  console.log(`[dropvault] ${catalog.packs.filter(p => p.active).length} packs loaded`);
});
