'use strict';

const db = require('../db');
const { encrypt, decrypt } = require('../crypto');

// Whitelisted, writable columns (last4 handled separately because it's encrypted).
const FIELDS = [
  'issuer',
  'nickname',
  'credit_limit',
  'current_balance',
  'statement_balance',
  'closing_day',
  'due_day',
  'minimum_payment',
  'apr',
  'date_opened',
  'autopay',
  'active',
];

function hydrate(row) {
  if (!row) return null;
  const { last4_enc, ...rest } = row;
  return { ...rest, last4: decrypt(last4_enc) };
}

function list({ includeInactive = true } = {}) {
  const sql = includeInactive
    ? 'SELECT * FROM cards ORDER BY active DESC, nickname'
    : 'SELECT * FROM cards WHERE active = 1 ORDER BY nickname';
  return db.prepare(sql).all().map(hydrate);
}

function get(id) {
  return hydrate(db.prepare('SELECT * FROM cards WHERE id = ?').get(id));
}

function create(input = {}) {
  const cols = [];
  const vals = [];
  for (const f of FIELDS) {
    if (input[f] !== undefined) {
      cols.push(f);
      vals.push(input[f]);
    }
  }
  cols.push('last4_enc');
  vals.push(input.last4 ? encrypt(input.last4) : null);

  const placeholders = cols.map(() => '?').join(', ');
  const info = db
    .prepare(`INSERT INTO cards (${cols.join(', ')}) VALUES (${placeholders})`)
    .run(...vals);
  return get(info.lastInsertRowid);
}

function update(id, input = {}) {
  const sets = [];
  const vals = [];
  for (const f of FIELDS) {
    if (input[f] !== undefined) {
      sets.push(`${f} = ?`);
      vals.push(input[f]);
    }
  }
  if (input.last4 !== undefined) {
    sets.push('last4_enc = ?');
    vals.push(input.last4 ? encrypt(input.last4) : null);
  }
  if (sets.length === 0) return get(id);
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE cards SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return get(id);
}

function remove(id) {
  return db.prepare('DELETE FROM cards WHERE id = ?').run(id).changes > 0;
}

module.exports = { list, get, create, update, remove };
