# DIY Stripe + Telegram VIP — Setup Guide

This is the full-ownership alternative to Whop. You run a small webhook
server on your Mac (or VPS), Stripe handles payments + recurring billing,
Telegram bot handles invites + kicks. **No platform fees beyond Stripe's
2.9% + 30¢ per transaction.**

**Time to first paid sub if you've never deployed a webhook**: 4-6 hours.
**Time if you have**: 90 min.

---

## Architecture

```
Customer
   │
   ▼ (clicks Buy on checkout.html)
Stripe Checkout (Stripe-hosted)
   │
   ▼ (payment succeeds)
Stripe sends webhook ─────────► server.js  ─────────► Telegram Bot API
                                  │                  (createChatInviteLink)
                                  │
                                  ▼
                          stores in vip_subs.json
                                  │
                                  ▼
                          shows invite link on
                          success page
                                  │
Customer clicks invite, joins VIP Telegram channel
                                  │
                                  ▼
   Bot receives chat_member event, links telegram_id ↔ email
                                  │
                                  ▼
On cancel/refund: Stripe webhook → server.js → bot kicks user
```

---

## Prereqs

- Stripe account (use admin@jjrproconsultants.com)
- Node.js 18+ on your Mac (you already have it)
- `npm install stripe express body-parser node-fetch` in this directory
- Cloudflare account (free) for the HTTPS tunnel — OR ngrok ($0 free tier works)

---

## Step 1 — Stripe setup (20 min)

1. **Activate Stripe account** at dashboard.stripe.com
2. **Create the product**:
   - Products → Add product → "JaurxTrades VIP"
   - Pricing: **Recurring, $49/mo USD**
   - Create a SECOND price for founders: **$29/mo USD**, mark inactive (you'll enable manually via Payment Links)
3. **Get API keys**:
   - Developers → API keys
   - Copy `Publishable key` (pk_live_...) and `Secret key` (sk_live_...)
   - Store secret key in env: `export STRIPE_SECRET=sk_live_xxx` (add to ~/.zshrc)
4. **Create the Stripe Payment Link** (easier than building Checkout from scratch):
   - Products → "JaurxTrades VIP" → Create payment link
   - On success: redirect to `https://yourdomain.com/success.html?session_id={CHECKOUT_SESSION_ID}`
   - Save the Payment Link URL — this is what you'll share
5. **Webhook endpoint** (you'll fill this in Step 3 after the server is running):
   - Developers → Webhooks → Add endpoint
   - URL: `https://your-tunnel-url/webhook`
   - Events to send:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Save the `Signing secret` (whsec_...) → `export STRIPE_WEBHOOK_SECRET=whsec_xxx`

---

## Step 2 — Server setup (30 min)

In `/Users/johnreilly/trading-bot/stripe-vip/` (create this dir):

```bash
mkdir -p ~/trading-bot/stripe-vip
cd ~/trading-bot/stripe-vip
npm init -y
npm install stripe express body-parser node-fetch@2
```

Copy these files from this `revenue/stripe-diy/` dir into `~/trading-bot/stripe-vip/`:
- `server.js`
- `public/success.html`
- `public/cancel.html`

Set env vars (add to `~/.zshrc`):
```bash
export STRIPE_SECRET=sk_live_xxx
export STRIPE_WEBHOOK_SECRET=whsec_xxx
export TELEGRAM_TOKEN=8733045334:AAEzoWAeteCTgD3a5N4iIoV5bdRpxyFqDHE
export VIP_CHANNEL_ID=-1001234567890   # your VIP channel ID
export PORT=3001
```

Run it:
```bash
cd ~/trading-bot/stripe-vip
node server.js
```

You should see: `[stripe-vip] listening on :3001`

---

## Step 3 — Expose to internet via Cloudflare Tunnel (20 min)

Stripe webhooks need HTTPS. Cloudflare Tunnel is free, doesn't require a static IP, runs as a daemon.

```bash
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel login   # opens browser, picks your CF account/domain
cloudflared tunnel create jaurxtrades-vip
cloudflared tunnel route dns jaurxtrades-vip vip.yourdomain.com
```

Create `~/.cloudflared/config.yml`:
```yaml
tunnel: jaurxtrades-vip
credentials-file: /Users/johnreilly/.cloudflared/<UUID>.json
ingress:
  - hostname: vip.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

Start it:
```bash
cloudflared tunnel run jaurxtrades-vip
```

Now `https://vip.yourdomain.com` → your local server on 3001.

**Don't own a domain?** Use ngrok instead:
```bash
brew install ngrok
ngrok http 3001
# copy the https URL it shows you, use it as your webhook URL
```

ngrok URLs change every restart on free tier. For production, use Cloudflare Tunnel.

---

## Step 4 — Wire Stripe webhook to your tunnel URL

Back in Stripe dashboard:
- Developers → Webhooks → your endpoint → edit URL to `https://vip.yourdomain.com/webhook`
- Click "Send test webhook" → `checkout.session.completed`
- Check your server logs — you should see `[webhook] checkout.session.completed`

---

## Step 5 — Telegram bot adjustments (30 min)

Your existing `bot.js` polls with `getUpdates`. By default this does NOT
receive `chat_member` events. You need to either:

**Option A** (recommended): Add chat_member to allowed_updates in your getUpdates call:
```js
// In bot.js, find the getUpdates call and add allowed_updates:
const updates = await fetch(
  `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["message","chat_member"]`
).then(r => r.json());
```

**Option B**: Run the webhook server's chat_member handler instead, leave bot.js alone.

Apply the patches from `bot-stripe-patch.js` to `bot.js`. Restart bot.

---

## Step 6 — Test the full flow

1. In a private window, click your Stripe Payment Link
2. Pay with Stripe test card `4242 4242 4242 4242`, exp future, any CVC
3. After success, you should see the VIP invite link on the success page
4. Click it, join the VIP channel
5. Check `~/trading-bot/stripe-vip/vip_subs.json` — your entry should be there with `telegram_id` populated
6. In Stripe dashboard, cancel the test subscription
7. Within a minute, your test account should be kicked from the VIP channel

---

## Step 7 — Switch to live mode

Once test mode works end-to-end:
- Toggle Stripe dashboard from Test → Live mode (top right)
- Recreate the Product + Payment Link in Live mode (Stripe doesn't sync)
- Update `.zshrc` to live keys
- Update Stripe webhook endpoint to live mode (new signing secret)
- Restart server + bot

---

## Daemonize for production

Use `pm2` so the server + tunnel restart on reboot:

```bash
npm install -g pm2
pm2 start server.js --name stripe-vip
pm2 start cloudflared --name vip-tunnel -- tunnel run jaurxtrades-vip
pm2 save
pm2 startup    # follow the printed instructions
```

---

## What happens at scale

The JSON file `vip_subs.json` is fine up to ~500 subs. After that, migrate
to SQLite (single file, no setup) or Postgres. Add `better-sqlite3` to the
server when the time comes.

---

## Common pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Webhook returns 400 | Signature mismatch | Make sure `body-parser.raw()` runs BEFORE the webhook route, not JSON parser |
| Customer paid but no invite link | Bot not admin in VIP channel | Bot needs "Invite Users via Link" perm |
| User joins but vip_subs.json doesn't update telegram_id | chat_member event not received | Check allowed_updates includes chat_member |
| Kick doesn't work | Bot not admin OR user is creator | Don't try to kick channel creator |
| Stripe test webhook works but live doesn't | Different signing secret per mode | Update STRIPE_WEBHOOK_SECRET when going live |

---

**File map:**
- `server.js` — Express webhook handler + invite link generation
- `public/success.html` — post-payment thank-you page that displays invite link
- `public/cancel.html` — payment cancelled fallback
- `bot-stripe-patch.js` — bot.js additions for chat_member event handling

---

**Last updated**: 2026-05-29
