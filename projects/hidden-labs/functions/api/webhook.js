/**
 * Hidden Labs — order notification webhook (Cloudflare Pages Function).
 * Route: POST /api/webhook   (set this URL in Coinbase Commerce → Webhooks)
 *
 * On a PAID order, pings you on Telegram with the order details.
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   COINBASE_COMMERCE_WEBHOOK_SECRET  — the "Shared Secret" from Coinbase webhook settings
 *   TELEGRAM_BOT_TOKEN                — your bot token (from @BotFather)
 *   TELEGRAM_CHAT_ID                  — the chat/channel id to notify
 *
 * If a var is missing the function still returns 200 (so Coinbase doesn't retry
 * forever); it just skips that step.
 */

async function verifySignature(rawBody, signatureHex, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (!signatureHex || hex.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  return diff === 0;
}

async function notifyTelegram(env, text) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return;
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  }).catch(() => {});
}

export async function onRequestPost({ request, env }) {
  const raw = await request.text();

  // verify the webhook really came from Coinbase
  if (env.COINBASE_COMMERCE_WEBHOOK_SECRET) {
    const sig = request.headers.get('X-CC-Webhook-Signature') || '';
    const ok = await verifySignature(raw, sig, env.COINBASE_COMMERCE_WEBHOOK_SECRET);
    if (!ok) return new Response('invalid signature', { status: 401 });
  }

  let event;
  try { event = (JSON.parse(raw) || {}).event; } catch (e) { return new Response('bad request', { status: 400 }); }

  if (event && (event.type === 'charge:confirmed' || event.type === 'charge:resolved')) {
    const c = event.data || {};
    const m = c.metadata || {};
    const amount = c.pricing && c.pricing.local ? `${c.pricing.local.amount} ${c.pricing.local.currency}` : '';
    const text =
      '🟢 Hidden Labs — PAID ORDER\n\n' +
      (m.items ? m.items + '\n' : '') +
      (amount ? 'Total: ' + amount + ' (shipping included)\n' : '') +
      '\nCustomer: ' + (m.customer_name || '—') + ' (' + (m.customer_email || '—') + ')\n' +
      'Ship to: ' + (m.ship_to || '—');
    await notifyTelegram(env, text);
  }

  return new Response('ok');
}
