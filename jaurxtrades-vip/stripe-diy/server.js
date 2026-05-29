// =============================================================================
// JaurxTrades VIP — Stripe webhook + Telegram invite server
// =============================================================================
//
// Run on your Mac:
//   cd ~/trading-bot/stripe-vip
//   node server.js
//
// Required env vars (export in ~/.zshrc):
//   STRIPE_SECRET          = sk_live_xxx or sk_test_xxx
//   STRIPE_WEBHOOK_SECRET  = whsec_xxx (from Stripe webhook dashboard)
//   TELEGRAM_TOKEN         = your bot token
//   VIP_CHANNEL_ID         = -100xxxxxxxxxx (private VIP channel ID)
//   PORT                   = 3001 (optional, default)
//   PUBLIC_URL             = https://vip.yourdomain.com (for success page redirects)
//
// =============================================================================

const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const PORT = process.env.PORT || 3001;
const STRIPE_SECRET = process.env.STRIPE_SECRET;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const VIP_CHANNEL_ID = process.env.VIP_CHANNEL_ID;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

if (!STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET || !TELEGRAM_TOKEN || !VIP_CHANNEL_ID) {
  console.error('[stripe-vip] missing required env vars. Check STRIPE_SECRET, STRIPE_WEBHOOK_SECRET, TELEGRAM_TOKEN, VIP_CHANNEL_ID');
  process.exit(1);
}

const stripe = Stripe(STRIPE_SECRET);
const SUBS_FILE = path.join(__dirname, 'vip_subs.json');

// ---------- State ----------

function loadSubs() {
  try {
    return JSON.parse(fs.readFileSync(SUBS_FILE, 'utf8'));
  } catch (e) {
    return { subs: [] };
  }
}

function saveSubs(state) {
  fs.writeFileSync(SUBS_FILE, JSON.stringify(state, null, 2));
}

function findSubByCustomerId(customerId) {
  return loadSubs().subs.find(s => s.stripe_customer_id === customerId);
}

function findSubBySubId(subId) {
  return loadSubs().subs.find(s => s.stripe_sub_id === subId);
}

function findSubByInviteLink(link) {
  return loadSubs().subs.find(s => s.invite_link === link);
}

function upsertSub(record) {
  const state = loadSubs();
  const idx = state.subs.findIndex(s => s.stripe_customer_id === record.stripe_customer_id);
  if (idx >= 0) {
    state.subs[idx] = { ...state.subs[idx], ...record, updated_at: new Date().toISOString() };
  } else {
    state.subs.push({ ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  }
  saveSubs(state);
  return record;
}

function updateSubBy(predicate, patch) {
  const state = loadSubs();
  const sub = state.subs.find(predicate);
  if (!sub) return null;
  Object.assign(sub, patch, { updated_at: new Date().toISOString() });
  saveSubs(state);
  return sub;
}

// ---------- Telegram helpers ----------

async function tgApi(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function createInviteLink(emailLabel) {
  // 7-day expiry, single-use
  const expire = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
  const res = await tgApi('createChatInviteLink', {
    chat_id: VIP_CHANNEL_ID,
    name: emailLabel.slice(0, 32),
    member_limit: 1,
    expire_date: expire,
  });
  if (!res.ok) throw new Error(`Telegram createChatInviteLink failed: ${JSON.stringify(res)}`);
  return res.result.invite_link;
}

async function kickFromVIP(telegramUserId) {
  // Ban then immediately unban so they CAN resubscribe later
  const ban = await tgApi('banChatMember', {
    chat_id: VIP_CHANNEL_ID,
    user_id: telegramUserId,
    until_date: Math.floor(Date.now() / 1000) + 60,
  });
  await new Promise(r => setTimeout(r, 1500));
  await tgApi('unbanChatMember', {
    chat_id: VIP_CHANNEL_ID,
    user_id: telegramUserId,
    only_if_banned: true,
  });
  return ban;
}

async function notifyOwner(text) {
  // Hardcoded JJR primary chat — adjust if you want notifications elsewhere
  const OWNER_CHAT = 5680523955;
  return tgApi('sendMessage', {
    chat_id: OWNER_CHAT,
    text: `[stripe-vip] ${text}`,
    parse_mode: 'HTML',
  });
}

// ---------- Express app ----------

const app = express();

// IMPORTANT: Stripe webhook needs the raw body for signature verification.
// Mount the raw parser ONLY on /webhook, then JSON parser on everything else.

app.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[webhook] signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('[webhook]', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const email = session.customer_details?.email || session.customer_email || 'unknown';
        const customerId = session.customer;
        const subId = session.subscription;

        const inviteLink = await createInviteLink(email);

        upsertSub({
          email,
          stripe_customer_id: customerId,
          stripe_sub_id: subId,
          stripe_session_id: session.id,
          telegram_id: null,            // populated when they join the channel
          invite_link: inviteLink,
          status: 'active',
        });

        await notifyOwner(`✅ New VIP: <b>${email}</b>\nInvite created. Awaiting channel join.`);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const record = findSubBySubId(sub.id) || findSubByCustomerId(sub.customer);
        if (!record) {
          console.warn('[webhook] subscription.deleted: no local record for', sub.id);
          break;
        }
        if (record.telegram_id) {
          await kickFromVIP(record.telegram_id);
          await notifyOwner(`👋 VIP cancelled: <b>${record.email}</b> — kicked from channel.`);
        } else {
          await notifyOwner(`⚠️ VIP cancelled: <b>${record.email}</b> — no telegram_id stored, manual kick may be needed.`);
        }
        updateSubBy(s => s.stripe_customer_id === record.stripe_customer_id, { status: 'cancelled' });
        break;
      }

      case 'invoice.payment_failed': {
        const inv = event.data.object;
        const record = findSubByCustomerId(inv.customer);
        const email = record?.email || inv.customer_email || inv.customer;
        await notifyOwner(`💳 Payment failed: <b>${email}</b>. Stripe will retry. No action needed yet.`);
        break;
      }

      default:
        // ignore other events
        break;
    }
  } catch (err) {
    console.error('[webhook] handler error:', err);
    await notifyOwner(`❌ Webhook handler error (${event.type}): ${err.message}`);
    // Still return 200 so Stripe doesn't retry indefinitely on our bugs.
  }

  res.json({ received: true });
});

// JSON parser for everything else
app.use(bodyParser.json());

// Static files (success.html, cancel.html)
app.use(express.static(path.join(__dirname, 'public')));

// API: success page calls this with the Stripe session_id to fetch the invite link
app.get('/api/invite', async (req, res) => {
  const sessionId = req.query.session_id;
  if (!sessionId) return res.status(400).json({ error: 'missing session_id' });

  try {
    // Verify the session belongs to this account before exposing the invite
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return res.status(403).json({ error: 'session not paid' });
    }
    const record = loadSubs().subs.find(s => s.stripe_session_id === sessionId);
    if (!record) {
      // Webhook might not have fired yet — ask client to retry
      return res.status(202).json({ pending: true });
    }
    return res.json({
      email: record.email,
      invite_link: record.invite_link,
      status: record.status,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Telegram-side: this endpoint is called by bot.js when a chat_member event
// is observed, to link telegram_id ↔ invite_link in our subs table.
app.post('/api/link-telegram', async (req, res) => {
  const { invite_link, telegram_id, username } = req.body;
  if (!invite_link || !telegram_id) {
    return res.status(400).json({ error: 'invite_link and telegram_id required' });
  }
  const sub = updateSubBy(
    s => s.invite_link === invite_link,
    { telegram_id, telegram_username: username || null }
  );
  if (!sub) {
    console.warn('[link-telegram] no matching sub for invite', invite_link);
    return res.status(404).json({ error: 'no matching sub' });
  }
  await notifyOwner(`🎯 VIP joined channel: <b>${sub.email}</b> → @${username || telegram_id}`);
  return res.json({ linked: true, email: sub.email });
});

// Health check
app.get('/health', (req, res) => {
  const state = loadSubs();
  res.json({
    ok: true,
    sub_count: state.subs.length,
    active_count: state.subs.filter(s => s.status === 'active').length,
  });
});

// Root → landing
app.get('/', (req, res) => res.redirect('/index.html'));

app.listen(PORT, () => {
  console.log(`[stripe-vip] listening on :${PORT}`);
  console.log(`[stripe-vip] public URL: ${PUBLIC_URL}`);
  console.log(`[stripe-vip] subs file: ${SUBS_FILE}`);
});
