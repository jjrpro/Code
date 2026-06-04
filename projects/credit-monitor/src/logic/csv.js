'use strict';

// Tiny dependency-free CSV parser + column-mapped importer.
// Supports quoted fields, escaped quotes (""), and \r\n / \n line endings.

const cardsModel = require('../models/cards');
const paymentsModel = require('../models/payments');

function parse(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const s = String(text).replace(/^﻿/, ''); // strip BOM

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

// Parse into array of objects keyed by header row.
function parseToObjects(text) {
  const rows = parse(text);
  if (rows.length === 0) return { headers: [], records: [] };
  const headers = rows[0].map((h) => h.trim());
  const records = rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] !== undefined ? r[i].trim() : '';
    });
    return obj;
  });
  return { headers, records };
}

function num(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(String(v).replace(/[$,\s]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

// Import balances/limits onto cards.
// mapping: { nickname, issuer, last4, credit_limit, current_balance,
//            statement_balance, closing_day, due_day, minimum_payment, apr,
//            date_opened, autopay } -> CSV header names
// matchBy: 'nickname' | 'last4' (used to update existing cards; else insert)
function importCards(text, mapping = {}, { matchBy = 'nickname' } = {}) {
  const { records } = parseToObjects(text);
  const existing = cardsModel.list();
  let created = 0;
  let updated = 0;
  const errors = [];

  records.forEach((rec, idx) => {
    const pick = (field) => (mapping[field] ? rec[mapping[field]] : undefined);
    const card = {
      issuer: pick('issuer'),
      nickname: pick('nickname'),
      last4: pick('last4'),
      credit_limit: num(pick('credit_limit')),
      current_balance: num(pick('current_balance')),
      statement_balance: num(pick('statement_balance')),
      closing_day: num(pick('closing_day')),
      due_day: num(pick('due_day')),
      minimum_payment: num(pick('minimum_payment')),
      apr: num(pick('apr')),
      date_opened: pick('date_opened') || undefined,
      autopay: pick('autopay') !== undefined ? (/^(1|true|yes|on)$/i.test(pick('autopay')) ? 1 : 0) : undefined,
    };
    Object.keys(card).forEach((k) => card[k] === undefined && delete card[k]);

    if (!card.nickname && !card.last4) {
      errors.push({ row: idx + 2, error: 'row needs at least a nickname or last4' });
      return;
    }

    const match = existing.find((c) =>
      matchBy === 'last4' ? c.last4 && c.last4 === card.last4 : c.nickname === card.nickname
    );
    try {
      if (match) {
        cardsModel.update(match.id, card);
        updated++;
      } else {
        if (!card.issuer) card.issuer = 'Unknown';
        if (!card.nickname) card.nickname = `Card •${card.last4 || '????'}`;
        cardsModel.create(card);
        created++;
      }
    } catch (e) {
      errors.push({ row: idx + 2, error: e.message });
    }
  });

  return { type: 'cards', created, updated, errors, total: records.length };
}

// Import a transaction/payment log.
// mapping: { date, amount, kind, on_time, card_nickname }
function importPayments(text, mapping = {}) {
  const { records } = parseToObjects(text);
  const cards = cardsModel.list();
  let created = 0;
  const errors = [];

  records.forEach((rec, idx) => {
    const pick = (field) => (mapping[field] ? rec[mapping[field]] : undefined);
    const date = pick('date');
    const amount = num(pick('amount'));
    if (!date || amount === undefined) {
      errors.push({ row: idx + 2, error: 'row needs a date and amount' });
      return;
    }
    let card_id = null;
    const nick = pick('card_nickname');
    if (nick) {
      const m = cards.find((c) => c.nickname === nick);
      if (m) card_id = m.id;
    }
    const onTimeRaw = pick('on_time');
    try {
      paymentsModel.create({
        card_id,
        date,
        amount,
        kind: pick('kind') || 'custom',
        on_time: onTimeRaw === undefined ? 1 : /^(1|true|yes|on)$/i.test(onTimeRaw) ? 1 : 0,
      });
      created++;
    } catch (e) {
      errors.push({ row: idx + 2, error: e.message });
    }
  });

  return { type: 'payments', created, errors, total: records.length };
}

module.exports = { parse, parseToObjects, importCards, importPayments };
