#!/usr/bin/env node
/**
 * patch-bot.js — one-shot patcher for JAURX VIP integration into bot.js
 *
 * What it does:
 *   1. Backs up bot.js → bot.js.bak.<timestamp>
 *   2. Inserts VIP constants (VIP_CHANNEL_ID, VIP_ENABLED, VIP_TAG) if missing
 *   3. Inserts sendVIP() helper function if missing
 *   4. Inserts /vip command handler if missing
 *   5. Syntax-checks the result; rolls back on failure
 *   6. Tells you how to restart the bot
 *
 * Usage on your Mac:
 *   node patch-bot.js
 *   # or with a custom path:
 *   node patch-bot.js /path/to/your/bot.js
 *
 * Idempotent — safe to run multiple times.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BOT_PATH = process.argv[2] || '/Users/johnreilly/trading-bot/bot.js';
const BACKUP_PATH = BOT_PATH + '.bak.' + Date.now();
const VIP_CHANNEL_ID = -1003952631411;

function log(msg) { console.log(`[patch-bot] ${msg}`); }

if (!fs.existsSync(BOT_PATH)) {
  console.error(`❌ Not found: ${BOT_PATH}`);
  console.error(`   Pass the correct path: node patch-bot.js /path/to/bot.js`);
  process.exit(1);
}

log(`Reading ${BOT_PATH}`);
let src = fs.readFileSync(BOT_PATH, 'utf8');
fs.writeFileSync(BACKUP_PATH, src);
log(`Backup → ${BACKUP_PATH}`);

const changes = [];

// -----------------------------------------------------------------------------
// 1) Constants block
// -----------------------------------------------------------------------------
const CONST_BLOCK = `
// === JAURX VIP ===
const VIP_CHANNEL_ID = ${VIP_CHANNEL_ID};
const VIP_ENABLED    = true;
const VIP_TAG        = '🎯 VIP';
// === END JAURX VIP ===
`;

if (src.includes('VIP_CHANNEL_ID')) {
  log('✓ VIP constants already present — skipping');
} else {
  const tokenMatch = src.match(/const\s+TELEGRAM_TOKEN\s*=\s*['"`][^'"`]+['"`]\s*;?\s*\n/);
  if (tokenMatch) {
    const insertAt = tokenMatch.index + tokenMatch[0].length;
    src = src.slice(0, insertAt) + CONST_BLOCK + src.slice(insertAt);
    log('+ Inserted VIP constants after TELEGRAM_TOKEN');
    changes.push('constants');
  } else {
    src = CONST_BLOCK + '\n' + src;
    log('+ Inserted VIP constants at top of file (TELEGRAM_TOKEN not found)');
    changes.push('constants(top)');
  }
}

// -----------------------------------------------------------------------------
// 2) sendVIP() helper
// -----------------------------------------------------------------------------
const FUNC_BLOCK = `
// === JAURX VIP HELPER ===
async function sendVIP(text, parseMode = 'HTML') {
  if (!VIP_ENABLED) return { skipped: true };
  try {
    const res = await fetch(\`https://api.telegram.org/bot\${TELEGRAM_TOKEN}/sendMessage\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: VIP_CHANNEL_ID,
        text: \`\${VIP_TAG}\\n\\n\${text}\`,
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
// === END JAURX VIP HELPER ===
`;

if (/async\s+function\s+sendVIP\s*\(/.test(src)) {
  log('✓ sendVIP() already present — skipping');
} else {
  if (/\nmodule\.exports/.test(src)) {
    src = src.replace(/(\nmodule\.exports)/, FUNC_BLOCK + '$1');
  } else {
    src += '\n' + FUNC_BLOCK;
  }
  log('+ Inserted sendVIP() helper');
  changes.push('sendVIP()');
}

// -----------------------------------------------------------------------------
// 3) /vip command handler
// -----------------------------------------------------------------------------
const CMD_BLOCK = `
    // === JAURX VIP COMMAND ===
    if (cmd === 'vip') {
      if (!OWNER_IDS.includes(fromId)) return;
      const text = args.join(' ').trim();
      if (!text) return sendTelegram(chatId, 'Usage: /vip <message>');
      const r = await sendVIP(text);
      return sendTelegram(chatId, r.ok ? '✅ Posted to VIP' : \`❌ VIP error: \${JSON.stringify(r)}\`);
    }
    // === END JAURX VIP COMMAND ===
`;

if (/cmd\s*===\s*['"]vip['"]/.test(src)) {
  log('✓ /vip command already present — skipping');
} else {
  const cmdMatch = src.match(/(\n[ \t]*)if\s*\(\s*cmd\s*===\s*['"][a-z]+['"]/i);
  if (cmdMatch) {
    const insertAt = cmdMatch.index;
    src = src.slice(0, insertAt) + CMD_BLOCK + src.slice(insertAt);
    log('+ Inserted /vip command handler');
    changes.push('/vip handler');
  } else {
    log('⚠ Could not auto-locate command dispatch site.');
    log('  Manually paste this block next to your other if (cmd === "...") handlers:');
    console.log(CMD_BLOCK);
  }
}

if (changes.length === 0) {
  log('No changes needed — bot.js already patched.');
  log('Removing redundant backup.');
  fs.unlinkSync(BACKUP_PATH);
  process.exit(0);
}

// -----------------------------------------------------------------------------
// Write + syntax check
// -----------------------------------------------------------------------------
fs.writeFileSync(BOT_PATH, src);
log(`Wrote ${BOT_PATH} — changes: ${changes.join(', ')}`);

try {
  execSync(`node -c "${BOT_PATH}"`, { stdio: 'pipe' });
  log('✅ Syntax check passed');
} catch (e) {
  log('❌ Syntax check FAILED — restoring backup');
  fs.writeFileSync(BOT_PATH, fs.readFileSync(BACKUP_PATH));
  console.error(e.stderr?.toString() || e.message);
  process.exit(1);
}

console.log('');
log('Restart the bot now:');
console.log('  pkill -f "node.*bot.js"');
console.log(`  cd "${path.dirname(BOT_PATH)}" && nohup node bot.js > /tmp/bot.log 2>&1 & disown`);
console.log('  sleep 2 && tail -20 /tmp/bot.log');
console.log('');
log('Then in Telegram, DM @JaurxBot:');
console.log('  /vip Hello from the bot');
console.log('');
log('The 🎯 VIP-tagged message should land in the JAURX channel.');
