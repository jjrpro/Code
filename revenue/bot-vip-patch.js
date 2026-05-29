// JaurxTrades VIP — bot.js patches
// =============================================================================
// Drop these snippets into /Users/johnreilly/trading-bot/bot.js on your Mac.
// Each section is marked with where it goes.
// =============================================================================


// -----------------------------------------------------------------------------
// 1) TOP-OF-FILE CONSTANTS (add near the existing chat ID constants, ~line 1-30)
// -----------------------------------------------------------------------------

const VIP_CHANNEL_ID = -1001234567890;  // <-- REPLACE with your new private VIP channel ID
                                         //     Get it by: forward a msg from the channel
                                         //     to @userinfobot, copy the "Chat" ID (starts -100)
const VIP_ENABLED    = true;             // master kill-switch
const VIP_TAG        = '🎯 VIP';          // prefix on every VIP broadcast


// -----------------------------------------------------------------------------
// 2) BROADCAST HELPER (add anywhere in the file, near other Telegram helpers)
// -----------------------------------------------------------------------------

/**
 * Send a message to the VIP private channel.
 * Use this in place of (or in addition to) sendTelegram(CHAT_ID, ...) when
 * you want a trade alert to go to paying subscribers.
 */
async function sendVIP(text, parseMode = 'HTML') {
  if (!VIP_ENABLED) return { skipped: true };
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: VIP_CHANNEL_ID,
        text: `${VIP_TAG}\n\n${text}`,
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error('[VIP] broadcast failed:', e.message);
    return { error: e.message };
  }
}

/**
 * Send a chart screenshot to the VIP channel.
 */
async function sendVIPPhoto(filePath, caption = '') {
  if (!VIP_ENABLED) return { skipped: true };
  const FormData = require('form-data');
  const fs = require('fs');
  const form = new FormData();
  form.append('chat_id', String(VIP_CHANNEL_ID));
  form.append('photo', fs.createReadStream(filePath));
  if (caption) {
    form.append('caption', `${VIP_TAG}\n\n${caption}`);
    form.append('parse_mode', 'HTML');
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: form,
    });
    return await res.json();
  } catch (e) {
    console.error('[VIP] photo failed:', e.message);
    return { error: e.message };
  }
}


// -----------------------------------------------------------------------------
// 3) HOOK INTO placeBracket() — broadcast every confirmed bracket to VIP
// -----------------------------------------------------------------------------
// Find your existing placeBracket() function. AFTER the bracket placement
// succeeds (i.e. inside the success branch), add this block:

/*
    // --- VIP broadcast (add after entry/SL/TP all confirmed) ---
    const sideTxt = side === -1 ? 'SHORT' : 'LONG';
    const vipMsg =
      `<b>${sideTxt} ${symbol}</b>\n` +
      `Entry: <code>${entryPrice}</code>\n` +
      `SL:    <code>${slPrice}</code>\n` +
      `TP:    <code>${tpPrice}</code>\n` +
      `Size:  <code>${qty} contract${qty > 1 ? 's' : ''}</code>\n\n` +
      `<i>Posted as taken. Trade your own size. NFA.</i>`;
    await sendVIP(vipMsg);
    // --- end VIP ---
*/


// -----------------------------------------------------------------------------
// 4) DAILY BIAS COMMAND — manually drop morning plan into VIP
// -----------------------------------------------------------------------------
// Add to your handleCommand() dispatch. Owners only.
//
// Usage in Telegram (DM the bot):
//   /vipbias MGC bias = bullish above 4500. Watching for FVG fill at 4520 for long.
//
// The bot posts that exact text to the VIP channel.

/*
    // --- VIP commands (add to handleCommand switch) ---
    if (cmd === 'vipbias') {
      if (!OWNER_IDS.includes(fromId)) return;
      const text = args.join(' ').trim();
      if (!text) {
        return sendTelegram(chatId, 'Usage: /vipbias <your morning plan>');
      }
      const stamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      const msg = `<b>📊 Morning Bias — ${stamp} ET</b>\n\n${text}`;
      const r = await sendVIP(msg);
      return sendTelegram(chatId, r.ok ? '✅ Posted to VIP' : `❌ VIP error: ${JSON.stringify(r)}`);
    }

    if (cmd === 'vip') {
      // Generic broadcast: /vip <any text>
      if (!OWNER_IDS.includes(fromId)) return;
      const text = args.join(' ').trim();
      if (!text) return sendTelegram(chatId, 'Usage: /vip <message>');
      const r = await sendVIP(text);
      return sendTelegram(chatId, r.ok ? '✅ Posted to VIP' : `❌ VIP error: ${JSON.stringify(r)}`);
    }

    if (cmd === 'vipcount') {
      // Quick check of VIP channel member count
      if (!OWNER_IDS.includes(fromId)) return;
      const res = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getChatMemberCount?chat_id=${VIP_CHANNEL_ID}`
      );
      const data = await res.json();
      return sendTelegram(chatId, `VIP members: ${data.result || 'error'}`);
    }
    // --- end VIP commands ---
*/


// -----------------------------------------------------------------------------
// 5) AUTO-DISCLAIMER REPLY (in handleCommand)
// -----------------------------------------------------------------------------

/*
    if (cmd === 'disclaimer' || cmd === 'risk') {
      return sendTelegram(chatId,
        'DISCLAIMER: JaurxTrades is an educational and entertainment service. ' +
        'Nothing posted here is financial, investment, or trading advice. ' +
        'Futures and derivatives trading involves substantial risk of loss. ' +
        'Past performance is not indicative of future results. You are solely ' +
        'responsible for your own trading decisions and outcomes. NFA.'
      );
    }
*/


// =============================================================================
// SETUP CHECKLIST (do these once on your Mac)
// =============================================================================
//
// 1. Create the VIP private Telegram channel:
//      Telegram → New Channel → "JaurxTrades VIP" → Private
//
// 2. Add @JaurxBot as admin with these perms:
//      ☑ Post Messages
//      ☑ Edit Messages
//      ☑ Invite Users via Link
//      ☑ Pin Messages
//
// 3. Get the channel ID:
//      a. In the VIP channel, post any message
//      b. Forward that message to @userinfobot
//      c. Copy the "Chat" ID (e.g. -1002345678901)
//      d. Paste it as VIP_CHANNEL_ID at the top of bot.js
//
// 4. If using Whop:
//      Whop dashboard → Apps → Telegram → Connect Bot → @JaurxBot
//      Whop auto-invites paying subs. You don't need to handle invites in bot.js.
//
// 5. If using DIY Stripe (Path B in VIP-LAUNCH.md):
//      You need a webhook endpoint. Add ngrok or deploy a small Express handler.
//      Ping me for the Stripe webhook code if you go this route.
//
// 6. Test:
//      In Telegram (DM @JaurxBot), as JJR:
//        /vip Hello from the bot
//      Check the VIP channel — message should appear with the 🎯 VIP tag.
//
// 7. Restart bot:
//      pkill -f "node.*bot.js"
//      cd /Users/johnreilly/trading-bot && nohup node bot.js > /tmp/bot.log 2>&1 & disown
//      tail -f /tmp/bot.log
//
// =============================================================================
