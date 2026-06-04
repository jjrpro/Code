'use strict';

const db = require('../db');

function list() {
  return db.prepare('SELECT * FROM inquiries ORDER BY date DESC, id DESC').all();
}

function create({ date, reason = null, bureau = null, hard = 1 }) {
  const info = db
    .prepare('INSERT INTO inquiries (date, reason, bureau, hard) VALUES (?, ?, ?, ?)')
    .run(date, reason, bureau, hard ? 1 : 0);
  return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(info.lastInsertRowid);
}

function remove(id) {
  return db.prepare('DELETE FROM inquiries WHERE id = ?').run(id).changes > 0;
}

module.exports = { list, create, remove };
