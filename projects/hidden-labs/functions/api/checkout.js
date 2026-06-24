/**
 * Hidden Labs — checkout function (Cloudflare Pages Function).
 * Route: POST /api/checkout
 *
 * Creates a payment charge for the cart and returns { url } to redirect to.
 *
 * CRYPTO (live-ready): uses Coinbase Commerce. Set the COINBASE_COMMERCE_API_KEY
 *   environment variable in the Cloudflare Pages dashboard to activate.
 *
 * CARDS (high-risk merchant): see the clearly-marked block lower down. Once you
 *   have a high-risk gateway approved (it accepts research compounds), drop its
 *   hosted-checkout call in there and set provider:'card' from the front-end.
 *
 * Security: prices are recomputed SERVER-SIDE from the table below, so a user
 * can never tamper with the amount in the browser.
 */

// ---- authoritative price list (server-side source of truth) ----
const PRICES = [
  ['Retatrutide', '10mg · ≥99% purity', 175],
  ['Retatrutide', '30mg · ≥99% purity', 325],
  ['Tesamorelin', '20mg · ≥99% purity', 200],
  ['MOTS-c', '40mg · ≥99% purity', 205],
  ['NAD+', '500mg · ≥99% purity', 90],
  ['CJC-1295 / Ipamorelin', 'Research blend · ≥99% purity', 105],
  ['Sermorelin', '5mg · ≥99% purity', 75],
  ['BPC-157', '5mg · ≥99% purity', 75],
  ['BPC-157', '10mg · ≥99% purity', 105],
  ['TB-500', '5mg · ≥99% purity', 75],
  ['Wolverine Blend', 'BPC-157 + TB-500 · ≥99%', 125],
  ['Glow Blend', 'GHK-Cu + BPC-157 + TB-500 · ≥99%', 165],
  ['KPV', '5mg · ≥99% purity', 75],
  ['GHK-Cu', '50mg · ≥99% purity', 80],
  ['GHK-Cu', '100mg · ≥99% purity', 125],
  ['Melanotan II', '10mg · ≥99% purity', 75],
  ['Selank', '5mg · ≥99% purity', 85],
  ['Semax', '5mg · ≥99% purity', 85],
  ['PT-141', '10mg · ≥99% purity', 85],
];

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const PRICE_MAP = {};
for (const [name, size, price] of PRICES) PRICE_MAP[norm(name + size)] = price;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json' } });

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ error: 'bad_request' }, 400);
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const customer = payload.customer || {};
  if (!items.length) return json({ error: 'empty_cart' }, 400);

  // recompute total from the server price table — ignore any client-sent amount
  let total = 0;
  const summary = [];
  for (const it of items) {
    const price = PRICE_MAP[norm((it.name || '') + (it.size || ''))];
    const qty = Math.max(1, Math.min(50, parseInt(it.qty, 10) || 0));
    if (price == null) return json({ error: 'unknown_item', item: it.name }, 400);
    total += price * qty;
    summary.push(`${qty}x ${it.name} ${it.size}`);
  }
  if (total <= 0) return json({ error: 'invalid_total' }, 400);

  const origin = new URL(request.url).origin;

  // =====================================================================
  // CARD PATH (high-risk merchant) — activate when you have a gateway:
  //   if (payload.provider === 'card') {
  //     const url = await createHighRiskCardCheckout({ env, total, summary, customer, origin });
  //     return json({ url });
  //   }
  // =====================================================================

  // ---- CRYPTO PATH: Coinbase Commerce ----
  if (!env.COINBASE_COMMERCE_API_KEY) {
    // Not configured yet → tell the front-end to use its email fallback.
    return json({ error: 'payments_not_configured' }, 503);
  }

  const res = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': env.COINBASE_COMMERCE_API_KEY,
      'X-CC-Version': '2018-03-22',
    },
    body: JSON.stringify({
      name: 'Hidden Labs Order',
      description: summary.join(', ').slice(0, 200),
      pricing_type: 'fixed_price',
      local_price: { amount: total.toFixed(2), currency: 'USD' },
      redirect_url: `${origin}/success.html`,
      cancel_url: `${origin}/`,
      metadata: {
        customer_name: customer.name || '',
        customer_email: customer.email || '',
        ship_to: [customer.addr, customer.city, customer.state, customer.zip].filter(Boolean).join(', '),
        items: summary.join(' | '),
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.data || !data.data.hosted_url) {
    return json({ error: 'provider_error' }, 502);
  }
  return json({ url: data.data.hosted_url });
}
