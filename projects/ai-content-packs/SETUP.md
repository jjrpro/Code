# DropVault — Setup (paste-ready, ~20 minutes)

An AI content-pack store. Buyers pay by **card or crypto**, it settles to
**USDC in your Coinbase account instantly** (no payout schedule), and they get
an automatic download link. Claude monitors every sale from the cloud.

You do **four** things: make a Coinbase Commerce account, drop in 3 secrets,
put the pack ZIP files in a folder, and run one command.

---

## 1. Get a Coinbase Commerce account (5 min)

1. Go to **commerce.coinbase.com** → sign up (use your existing Coinbase login).
2. **Settings → Security → API keys** → *Create an API key*. Copy it.
   - This is `CC_API_KEY`.
3. **Settings → Webhooks** → you'll add the URL in step 4. The page shows a
   **Shared Secret** — copy it. This is `CC_WEBHOOK_SECRET`.
4. Turn on card payments: **Settings → Payment methods** → enable
   *Pay with card* (Coinbase converts the card payment to USDC for you).

> Truly instant + monitorable: the moment a charge confirms, the money is USDC
> in your Coinbase balance. Claude reads the same charges over the API to report
> revenue — no keys to your bank, nothing to break.

---

## 2. Put the secrets in place (2 min)

In Terminal:

```bash
cd ~/dropvault                # wherever you cloned this folder
npm install                   # one-time
```

Create a file named `.env` in that folder (TextEdit is fine), paste this, fill in:

```
CC_API_KEY=paste_your_api_key
CC_WEBHOOK_SECRET=paste_your_webhook_shared_secret
DOWNLOAD_SECRET=make_up_a_long_random_string_here_2026
PUBLIC_URL=https://your-public-url
PORT=3000
```

`DOWNLOAD_SECRET` is anything you invent (mash the keyboard). It signs the
download links so they can't be guessed.

Load it before running:
```bash
export $(grep -v '^#' .env | xargs)
```

---

## 3. Add the pack files (1 min)

Each pack in `catalog.json` points at a file like `packs/lux-broll-01.zip`.
Create a `packs/` folder and drop the ZIPs in with those exact names.

> Don't have the packs yet? That's the inventory Claude generates for you (see
> `2026-05-31-ai-content-packs-launch-plan.md`). The store runs fine with
> placeholder ZIPs while you fill the real ones in.

---

## 4. Go live (1 min)

For a quick public URL without buying hosting yet, use ngrok:
```bash
brew install ngrok        # one-time
node server.js            # terminal 1
ngrok http 3000           # terminal 2 -> copy the https URL
```

- Put the ngrok https URL in `.env` as `PUBLIC_URL`, restart `node server.js`.
- Back in **Coinbase Commerce → Settings → Webhooks**, set the endpoint to
  `https://YOUR-URL/webhook`.

That's it — share the ngrok URL (or a real domain later) and you're selling.

For an always-on URL later: deploy to Render/Railway free tier (same `node
server.js`), or point a real domain. Ask Claude and it'll do the deploy config.

---

## 5. Let Claude watch it

Give Claude a **read-only** Coinbase Commerce API key (make a second key in
step 1). Each session Claude runs:

```bash
node monitor.js            # sales, revenue, last 24h / 7d, per-pack breakdown
```

…and reports back. You never have to log in to check numbers.

---

## Quick reference

| Thing | Where |
|---|---|
| Add / edit / price packs | `catalog.json` |
| Pack files (ZIPs) | `packs/` |
| Preview thumbnails | `img/` |
| Live orders | `orders.json` (auto-created) |
| Revenue dashboard | `node monitor.js` |
| Storefront | `public/index.html` |
