// daily-telegram-post.js
// Auto-posts pre-open watchlist + EOD recap to JR's free JaurxTrades Telegram.
// Reads today's levels from daily-levels.json (which JR updates each morning
// from his phone or laptop in 30 seconds).
//
// Run modes:
//   node daily-telegram-post.js preopen    # post pre-open watchlist (8:30am ET)
//   node daily-telegram-post.js eod        # post EOD recap (5:00pm ET)
//
// Setup: see ./SETUP.md
//
// Requires env vars:
//   TELEGRAM_TOKEN          — bot token (same one JR's bot.js uses)
//   JAURXTRADES_CHANNEL_ID  — the public JaurxTrades free channel ID
//
// Both should be added to JR's shell profile alongside the existing bot env.

const fs = require('fs');
const path = require('path');
const https = require('https');

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHANNEL = process.env.JAURXTRADES_CHANNEL_ID;

if (!TOKEN || !CHANNEL) {
  console.error('Missing TELEGRAM_TOKEN or JAURXTRADES_CHANNEL_ID env vars. See SETUP.md.');
  process.exit(1);
}

const LEVELS_FILE = path.join(__dirname, 'daily-levels.json');
const LOG_FILE = path.join(__dirname, 'post-log.jsonl');

function loadLevels() {
  if (!fs.existsSync(LEVELS_FILE)) {
    console.error(`Missing ${LEVELS_FILE}. Copy daily-levels.example.json -> daily-levels.json and fill in today's values.`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(LEVELS_FILE, 'utf8'));
}

function buildPreopen(levels) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });
  return `☕️ Pre-NY-Open Watchlist — ${date}

MGC:
• Daily bias: ${levels.mgc.bias}
• Key supply: ${levels.mgc.supply}
• Key demand: ${levels.mgc.demand}
• Trigger I want: ${levels.mgc.trigger}

MNQ:
• Daily bias: ${levels.mnq.bias}
• Resistance: ${levels.mnq.resistance}
• Support: ${levels.mnq.support}
• Trigger: ${levels.mnq.trigger}

Catalyst: ${levels.catalyst || 'none scheduled'}

Trades posted here live. Educational only · NFA.`;
}

function buildEOD(levels) {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });
  const e = levels.eod || {};
  return `📊 ${date} Recap

MGC: ${e.mgcTrades || 0} trades · ${e.mgcRecord || '—'} · ${e.mgcR || '—'}R total
MNQ: ${e.mnqTrades || 0} trades · ${e.mnqRecord || '—'} · ${e.mnqR || '—'}R total

Best trade: ${e.bestTrade || '—'}
Worst trade: ${e.worstTrade || '—'}

Tomorrow: watching ${e.tomorrowFocus || 'pre-open levels (drop tomorrow morning)'}.

NFA. Educational only.`;
}

function post(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      chat_id: CHANNEL,
      text,
      disable_web_page_preview: true
    });
    const req = https.request({
      hostname: 'api.telegram.org',
      path: `/bot${TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const parsed = JSON.parse(body);
        if (!parsed.ok) reject(new Error(`Telegram API error: ${parsed.description}`));
        else resolve(parsed.result.message_id);
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function logPost(mode, messageId, ok, error) {
  const entry = {
    ts: new Date().toISOString(),
    mode,
    messageId,
    ok,
    error: error ? String(error) : null
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

async function main() {
  const mode = process.argv[2];
  if (!['preopen', 'eod'].includes(mode)) {
    console.error('Usage: node daily-telegram-post.js [preopen|eod]');
    process.exit(1);
  }
  const levels = loadLevels();
  const text = mode === 'preopen' ? buildPreopen(levels) : buildEOD(levels);

  console.log(`Posting ${mode} to ${CHANNEL}...\n---\n${text}\n---`);
  try {
    const messageId = await post(text);
    logPost(mode, messageId, true, null);
    console.log(`Posted. message_id=${messageId}`);
  } catch (e) {
    logPost(mode, null, false, e);
    console.error(`Failed: ${e.message}`);
    process.exit(1);
  }
}

main();
