// =============================================================================
// bot.js patches for DIY Stripe VIP integration
// =============================================================================
// Drop these snippets into /Users/johnreilly/trading-bot/bot.js
//
// What this adds:
//   1. chat_member event handling — when a user joins the VIP channel via a
//      tracked Stripe-generated invite link, the bot pings the webhook
//      server's /api/link-telegram endpoint to associate their telegram_id
//      with the Stripe sub.
//   2. /vipstatus command — owner can check VIP sub count + recent joins
//
// Prereq: the webhook server (server.js) is running locally at STRIPE_VIP_URL.
// =============================================================================


// -----------------------------------------------------------------------------
// 1) CONSTANTS (add near top of bot.js)
// -----------------------------------------------------------------------------

const STRIPE_VIP_URL = 'http://localhost:3001';   // where server.js is listening


// -----------------------------------------------------------------------------
// 2) ENABLE chat_member EVENTS on getUpdates
// -----------------------------------------------------------------------------
// Find your existing getUpdates polling call. Add allowed_updates so we
// receive chat_member events (which by default are NOT sent to bots).
//
// BEFORE:
//   `getUpdates?offset=${offset}&timeout=30`
//
// AFTER:
//   `getUpdates?offset=${offset}&timeout=30&allowed_updates=${encodeURIComponent(JSON.stringify(["message","chat_member","my_chat_member"]))}`


// -----------------------------------------------------------------------------
// 3) HANDLE chat_member EVENTS in the polling loop
// -----------------------------------------------------------------------------
// In your main update-processing loop, where you currently do something like:
//   for (const update of updates.result) {
//     if (update.message) { ... }
//   }
//
// Add a branch for chat_member:

/*
    for (const update of updates.result) {
      if (update.message) {
        // existing message handler
      } else if (update.chat_member) {
        await handleChatMemberUpdate(update.chat_member);
      }
    }
*/


// -----------------------------------------------------------------------------
// 4) chat_member HANDLER — link telegram_id to invite_link
// -----------------------------------------------------------------------------

async function handleChatMemberUpdate(evt) {
  // We only care about: user JOINS the VIP channel via a tracked invite link
  if (String(evt.chat.id) !== String(VIP_CHANNEL_ID)) return;

  const newStatus = evt.new_chat_member?.status;
  const oldStatus = evt.old_chat_member?.status;

  // User just joined (transitioned from "left"/"kicked" → "member")
  const joined =
    (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus) &&
    (newStatus === 'member' || newStatus === 'restricted');

  if (!joined) return;

  const inviteLink = evt.invite_link?.invite_link;
  const user = evt.new_chat_member.user;

  if (!inviteLink) {
    // Joined via a non-tracked link (e.g. main channel link or admin add).
    // Could be a freeloader — notify owner so they can investigate.
    await sendTelegram(OWNER_IDS[0],
      `⚠️ User @${user.username || user.id} joined VIP channel via untracked link. ` +
      `Verify they're a paying sub.`
    );
    return;
  }

  // Ping the Stripe server to link this telegram_id to the invite
  try {
    const res = await fetch(`${STRIPE_VIP_URL}/api/link-telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invite_link: inviteLink,
        telegram_id: user.id,
        username: user.username || null,
      }),
    });
    const data = await res.json();
    if (data.linked) {
      console.log(`[VIP] linked ${user.id} (@${user.username}) → ${data.email}`);
    } else {
      console.warn('[VIP] link-telegram failed:', data);
    }
  } catch (e) {
    console.error('[VIP] link-telegram error:', e.message);
  }
}


// -----------------------------------------------------------------------------
// 5) /vipstatus COMMAND — quick health check (owner only)
// -----------------------------------------------------------------------------
// Add to your handleCommand() dispatch:

/*
    if (cmd === 'vipstatus') {
      if (!OWNER_IDS.includes(fromId)) return;
      try {
        const res = await fetch(`${STRIPE_VIP_URL}/health`);
        const data = await res.json();
        return sendTelegram(chatId,
          `<b>VIP status</b>\n` +
          `Total subs (all-time): ${data.sub_count}\n` +
          `Active: ${data.active_count}\n` +
          `MRR @ $49: $${(data.active_count * 49).toFixed(0)}`,
          'HTML'
        );
      } catch (e) {
        return sendTelegram(chatId, `❌ VIP server unreachable: ${e.message}`);
      }
    }
*/


// =============================================================================
// CHEAT SHEET — how the flow works end-to-end
// =============================================================================
//
//  Customer pays via Stripe Payment Link
//        ↓
//  Stripe sends webhook → server.js
//        ↓
//  server.js calls Telegram createChatInviteLink (member_limit=1, 7d expire)
//        ↓
//  server.js stores { email, customer_id, sub_id, invite_link } in vip_subs.json
//        ↓
//  Customer redirected to /success.html, sees invite link, clicks it
//        ↓
//  Telegram fires chat_member event → bot.js receives it
//        ↓
//  bot.js handleChatMemberUpdate() → POST /api/link-telegram
//        ↓
//  server.js updates the record with telegram_id
//        ↓
//  Notification to JJR: "VIP joined channel: <email> → @username"
//
//  Later, customer cancels in Stripe Customer Portal
//        ↓
//  Stripe sends customer.subscription.deleted webhook
//        ↓
//  server.js looks up telegram_id, calls banChatMember + unbanChatMember
//        ↓
//  Customer is removed from VIP channel
//
// =============================================================================
