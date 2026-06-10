'use strict';

// Screenshot → structured accounts, using Claude vision.
//
// You upload a screenshot of your accounts (bank dashboard, Credit Karma,
// issuer app, a spreadsheet) and Claude reads off the issuer, balance, limit,
// due/closing dates, etc. We constrain the response to a strict JSON schema
// (structured outputs) so the result is always parseable, and cache the stable
// system prompt prefix to keep repeat scans cheap.
//
// Built with the official @anthropic-ai/sdk (CommonJS). Requires a key in
// CM_ANTHROPIC_API_KEY (or ANTHROPIC_API_KEY). Without a key this module
// throws a clear, user-facing error and the rest of the app keeps working.

const config = require('../config');

let Anthropic = null;
let client = null;

function getClient() {
  if (!config.anthropic.apiKey) {
    const err = new Error(
      'Screenshot import needs an AI key. Set CM_ANTHROPIC_API_KEY in your environment (get one at console.anthropic.com). It costs a few cents per scan. Until then, add cards manually.'
    );
    err.code = 'NO_API_KEY';
    err.status = 400;
    throw err;
  }
  if (client) return client;
  try {
    // Lazy require so the app runs without the dependency installed.
    Anthropic = require('@anthropic-ai/sdk');
  } catch (_) {
    const err = new Error('The @anthropic-ai/sdk package is not installed. Run `npm install` in projects/credit-monitor.');
    err.status = 500;
    throw err;
  }
  client = new Anthropic({ apiKey: config.anthropic.apiKey });
  return client;
}

function isEnabled() {
  return Boolean(config.anthropic.apiKey);
}

// Every field is a string in the schema (the model writes "" when a value
// isn't visible). We coerce to the right types in JS afterwards — this avoids
// brittle nullable-number handling in structured outputs.
const ACCOUNT_SCHEMA = {
  type: 'object',
  properties: {
    accounts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          issuer: { type: 'string', description: 'Bank/issuer, e.g. Chase, American Express. "" if unknown.' },
          nickname: { type: 'string', description: 'Card/product name, e.g. Sapphire Preferred. "" if unknown.' },
          last4: { type: 'string', description: 'Last 4 digits only. "" if not shown.' },
          credit_limit: { type: 'string', description: 'Credit limit as a number, no symbols. "" if not shown.' },
          current_balance: { type: 'string', description: 'Current balance as a number. "" if not shown.' },
          statement_balance: { type: 'string', description: 'Statement/last statement balance as a number. "" if not shown.' },
          minimum_payment: { type: 'string', description: 'Minimum payment due as a number. "" if not shown.' },
          due_day: { type: 'string', description: 'Day of month the payment is due (1-31). "" if not shown.' },
          closing_day: { type: 'string', description: 'Day of month the statement closes (1-31). "" if not shown.' },
          apr: { type: 'string', description: 'Purchase APR percent as a number. "" if not shown.' },
          date_opened: { type: 'string', description: 'Date account opened, ISO YYYY-MM-DD. "" if not shown.' },
          autopay: { type: 'string', description: '"yes", "no", or "" if not shown.' },
        },
        required: [
          'issuer', 'nickname', 'last4', 'credit_limit', 'current_balance',
          'statement_balance', 'minimum_payment', 'due_day', 'closing_day',
          'apr', 'date_opened', 'autopay',
        ],
        additionalProperties: false,
      },
    },
  },
  required: ['accounts'],
  additionalProperties: false,
};

const SYSTEM = `You extract credit-card and credit-line account details from a screenshot for a personal credit-tracking app.

Rules:
- Return ONE entry per distinct card/account visible. Do not invent accounts that aren't shown.
- Read numbers exactly. Strip currency symbols, commas, and % signs — output plain numbers as strings (e.g. "4920.00", "12000", "24.99").
- For any field you cannot clearly see, output an empty string "". Never guess balances, limits, dates, or last-4 digits.
- "due_day" / "closing_day" are the day-of-month (1-31). If only a full date like "due May 13" is shown, output "13".
- last4 must be exactly the last 4 digits, nothing else.
- If the image shows a spreadsheet/table, treat each row as an account and map columns by their headers.
- Be precise and conservative; this drives real financial decisions.`;

function num(v) {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/[$,%\s]/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function clampDay(v) {
  const n = num(v);
  if (n === null) return null;
  return Math.min(31, Math.max(1, Math.round(n)));
}

// Map the model's string record onto our card fields, coercing types.
function toCard(rec) {
  const card = {
    issuer: (rec.issuer || '').trim() || null,
    nickname: (rec.nickname || '').trim() || null,
    last4: (rec.last4 || '').replace(/\D/g, '').slice(-4) || null,
    credit_limit: num(rec.credit_limit),
    current_balance: num(rec.current_balance),
    statement_balance: num(rec.statement_balance),
    minimum_payment: num(rec.minimum_payment),
    due_day: clampDay(rec.due_day),
    closing_day: clampDay(rec.closing_day),
    apr: num(rec.apr),
    date_opened: /^\d{4}-\d{2}-\d{2}$/.test((rec.date_opened || '').trim()) ? rec.date_opened.trim() : null,
    autopay: /^(yes|y|true|on|1)$/i.test((rec.autopay || '').trim()) ? 1 : 0,
  };
  // Drop empty keys so they don't overwrite existing data on update.
  Object.keys(card).forEach((k) => (card[k] === null) && delete card[k]);
  return card;
}

// imageBase64: raw base64 (no data: prefix). mediaType: image/png|jpeg|webp|gif
async function callVision(schema, system, userText, imageBase64, mediaType) {
  const c = getClient();
  const resp = await c.messages.create({
    model: config.anthropic.model,
    max_tokens: 4096,
    // Let Claude reason a little about messy screenshots, but keep it cheap.
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema },
    },
    system: [
      // Stable prefix → cache it (cheap on repeat scans). The volatile image
      // goes after, in the user turn.
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/png', data: imageBase64 } },
          { type: 'text', text: userText },
        ],
      },
    ],
  });

  const textBlock = resp.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('The AI did not return readable data. Try a clearer screenshot.');
  try {
    return JSON.parse(textBlock.text);
  } catch (_) {
    throw new Error('Could not read the screenshot. Try a clearer, tighter crop.');
  }
}

async function extract(imageBase64, mediaType = 'image/png') {
  const parsed = await callVision(ACCOUNT_SCHEMA, SYSTEM, 'Extract every account visible in this screenshot.', imageBase64, mediaType);
  const accounts = Array.isArray(parsed.accounts) ? parsed.accounts.map(toCard) : [];
  return { accounts, model: config.anthropic.model };
}

// ── Credit score from a screenshot (e.g. Credit Karma / issuer app) ──
const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    score: { type: 'string', description: 'The credit score number (300-850). "" if none visible.' },
    source: { type: 'string', description: 'Where it is from, e.g. Credit Karma, Experian, Amex. "" if unclear.' },
    bureau: { type: 'string', description: 'Bureau and/or model, e.g. TransUnion, Experian, VantageScore 3.0, FICO 8. "" if not shown.' },
    date: { type: 'string', description: 'Date the score is as-of, ISO YYYY-MM-DD. "" if not shown.' },
  },
  required: ['score', 'source', 'bureau', 'date'],
  additionalProperties: false,
};

const SCORE_SYSTEM = `You read a credit SCORE from a screenshot (a credit app like Credit Karma, a bureau site, or a card issuer's free-FICO widget).

Rules:
- Return the single primary credit score shown (the big 300-850 number). If two bureaus are shown, pick the one most prominently displayed; if truly equal, the first.
- "source" is the app/brand (Credit Karma, Experian, Amex, etc.). "bureau" is the bureau and/or scoring model if shown (TransUnion, Equifax, Experian, VantageScore 3.0, FICO 8).
- "date" only if an as-of date is visible; otherwise "".
- If no credit score is visible, return "" for score.`;

function toScore(rec) {
  const n = num(rec.score);
  const score = n !== null ? Math.round(n) : null;
  return {
    score: score && score >= 300 && score <= 900 ? score : null,
    source: (rec.source || '').trim() || null,
    bureau: (rec.bureau || '').trim() || null,
    date: /^\d{4}-\d{2}-\d{2}$/.test((rec.date || '').trim()) ? rec.date.trim() : null,
  };
}

async function extractScore(imageBase64, mediaType = 'image/png') {
  const parsed = await callVision(SCORE_SCHEMA, SCORE_SYSTEM, 'Read the credit score from this screenshot.', imageBase64, mediaType);
  return { ...toScore(parsed), model: config.anthropic.model };
}

module.exports = { extract, extractScore, isEnabled, toCard, toScore, ACCOUNT_SCHEMA };
