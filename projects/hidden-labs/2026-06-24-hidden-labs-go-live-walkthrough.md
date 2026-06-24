# Hidden Labs — Go-Live Walkthrough (field-by-field)

**Date:** 2026-06-24
**Summary:** Exactly what to click and type to get the store live. Three parts:
(1) Cloudflare Pages = put it online, (2) Coinbase Commerce = take crypto
payments, (3) Telegram = get pinged on every paid order. Do Part 1 first and
send Claude the live link.

Your standing details (use these in the forms):
- **Business name:** Hidden Labs
- **Email:** admin@jjrproconsultants.com
- **Location:** Staten Island, New York
- **GitHub repo:** jjrpro/code

---

## PART 1 — Cloudflare Pages (put the site online) · ~10 min

### 1a. Make the account
1. Go to **https://dash.cloudflare.com/sign-up**
2. **Email:** admin@jjrproconsultants.com
3. **Password:** pick a strong one (save it in your password manager)
4. Click **Sign Up**, then open the verification email and confirm.
5. If it asks you to "add a website/domain," click **skip** for now — not needed.

### 1b. Create the Pages project
1. Left sidebar → **Workers & Pages** → big blue **Create** button.
2. Choose the **Pages** tab → **Connect to Git**.
3. Click **Connect GitHub** → log into your GitHub (the `jjrpro` account) →
   **Authorize Cloudflare** → allow access to the **`jjrpro/code`** repo.
4. Back in Cloudflare, select the **`code`** repo → **Begin setup**.

### 1c. Build settings — type these EXACTLY
| Field | What to enter |
|---|---|
| Project name | `hidden-labs` |
| Production branch | `claude/happy-dijkstra-60msdd` (or the branch we merge to) |
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | *(leave default — `/`)* |
| **Advanced → Root directory** | `projects/hidden-labs` |

> The **Root directory = `projects/hidden-labs`** line is the important one —
> it's what makes the checkout function work. Don't also type that path in the
> output box or the site will 404.

5. Click **Save and Deploy**. Wait ~1 minute.
6. You'll get a live URL like **`https://hidden-labs.pages.dev`**.

### ✅ Send Claude that URL.
The store is now live — cart, age gate, all 19 products work. Checkout will
email the order to you until Part 2 is done.

---

## PART 2 — Coinbase Commerce (take crypto payments) · ~10 min

### 2a. Make the account
1. Go to **https://commerce.coinbase.com** → **Get started / Sign up**.
   (This is Coinbase *Commerce* — the merchant tool — not the regular app.)
2. **Email:** admin@jjrproconsultants.com → set a password → verify the email.
3. **Business name:** Hidden Labs.
4. Follow the prompts to set up where your money settles. Coinbase Commerce
   pays out to a connected Coinbase account or your own crypto wallet — pick
   whichever you prefer and finish that step.

### 2b. Get the API key
1. **Settings** (gear icon) → **Security** → **API keys**.
2. Click **New API key** → **copy** the key it shows (you only see it once —
   paste it somewhere safe for a minute).

### 2c. Put the key into Cloudflare
1. Cloudflare dashboard → **Workers & Pages** → your **hidden-labs** project.
2. **Settings → Environment variables → Production → Add variable:**
   - **Variable name:** `COINBASE_COMMERCE_API_KEY`
   - **Value:** *(paste the key from 2b)*
   - **Save**
3. Go to **Deployments → ⋯ → Retry deployment** (so it loads the key).

### 2d. Test it
Open your live site → add an item → **Checkout** → fill the form → **Place
Order**. You should land on a **Coinbase-hosted pay page**. Pay a small amount
to confirm the full flow, then you're taking real orders. 🎉

### ✅ Tell Claude when the key is set — Claude will verify the flow end-to-end.

---

## PART 3 — Telegram order alerts (optional but great) · ~5 min

### 3a. Make a bot
1. In Telegram, search **@BotFather** → open it → send **/newbot**.
2. **Name:** Hidden Labs Orders → **Username:** something ending in `bot`
   (e.g. `hiddenlabs_orders_bot`).
3. BotFather replies with a **token** like `1234:AbC...` — copy it.

### 3b. Get your chat ID
1. Send any message (e.g. "hi") to your new bot.
2. In a browser open: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   (replace `<YOUR_TOKEN>`).
3. Find `"chat":{"id":...}` — that number is your **chat ID**.

### 3c. Add to Cloudflare (same env-variables screen as 2c)
- `TELEGRAM_BOT_TOKEN` = the token from 3a
- `TELEGRAM_CHAT_ID` = the number from 3b
- Then in Coinbase Commerce → **Settings → Webhook subscriptions → Add endpoint:**
  `https://YOUR-SITE/api/webhook` → copy the **Shared Secret** it shows →
  add it in Cloudflare as `COINBASE_COMMERCE_WEBHOOK_SECRET`.
- **Retry deployment.** Now every paid order pings your Telegram instantly.

---

## After it's live (when you're ready)
- **Custom domain:** buy a domain (e.g. hiddenlabs.co), then Cloudflare Pages →
  your project → **Custom domains → Set up a domain** (SSL is automatic).
- **Cards:** apply for a high-risk merchant account (SETUP.md §C); send Claude
  the credentials and the "Pay by card" option gets switched on.
- **COAs:** send Claude your certificates of analysis to link on product pages.

> Reminder: keep everything research-use-only. Don't add human-use or dosing
> claims — that's the line that keeps this a legal research-chemical store.
