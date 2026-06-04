'use strict';

const db = require('../db');

function list() {
  return db.prepare('SELECT * FROM scores ORDER BY date ASC, id ASC').all();
}

function latest() {
  return db.prepare('SELECT * FROM scores ORDER BY date DESC, id DESC LIMIT 1').get() || null;
}

function create({ date, score, source = null, bureau = null, note = null }) {
  const info = db
    .prepare('INSERT INTO scores (date, score, source, bureau, note) VALUES (?, ?, ?, ?, ?)')
    .run(date, score, source, bureau, note);
  return db.prepare('SELECT * FROM scores WHERE id = ?').get(info.lastInsertRowid);
}

function remove(id) {
  return db.prepare('DELETE FROM scores WHERE id = ?').run(id).changes > 0;
}

module.exports = { list, latest, create, remove };
