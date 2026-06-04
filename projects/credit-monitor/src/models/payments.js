'use strict';

const db = require('../db');

function list({ cardId } = {}) {
  if (cardId) {
    return db
      .prepare('SELECT * FROM payments WHERE card_id = ? ORDER BY date DESC, id DESC')
      .all(cardId);
  }
  return db.prepare('SELECT * FROM payments ORDER BY date DESC, id DESC').all();
}

function create({ card_id = null, date, amount, kind = 'custom', on_time = 1 }) {
  const info = db
    .prepare(
      'INSERT INTO payments (card_id, date, amount, kind, on_time) VALUES (?, ?, ?, ?, ?)'
    )
    .run(card_id, date, amount, kind, on_time ? 1 : 0);
  return db.prepare('SELECT * FROM payments WHERE id = ?').get(info.lastInsertRowid);
}

function remove(id) {
  return db.prepare('DELETE FROM payments WHERE id = ?').run(id).changes > 0;
}

// Summary used by the payment-history FICO factor.
function historySummary() {
  const row = db
    .prepare(
      'SELECT COUNT(*) AS total, SUM(CASE WHEN on_time = 1 THEN 1 ELSE 0 END) AS on_time FROM payments'
    )
    .get();
  return { total: row.total || 0, onTime: row.on_time || 0 };
}

module.exports = { list, create, remove, historySummary };
