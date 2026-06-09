'use strict';

// SQLite storage via better-sqlite3 (synchronous, embedded, no server).
// Schema is created on first run. Simple, append-only migrations live here.

const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('./config');

fs.mkdirSync(config.dataDir, { recursive: true });

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  issuer TEXT NOT NULL,
  nickname TEXT NOT NULL,
  last4_enc TEXT,                       -- encrypted at rest
  credit_limit REAL NOT NULL DEFAULT 0,
  current_balance REAL NOT NULL DEFAULT 0,
  statement_balance REAL NOT NULL DEFAULT 0,
  closing_day INTEGER,                  -- day-of-month the statement closes (1-31)
  due_day INTEGER,                      -- day-of-month the payment is due (1-31)
  minimum_payment REAL NOT NULL DEFAULT 0,
  apr REAL NOT NULL DEFAULT 0,
  date_opened TEXT,                     -- ISO date (YYYY-MM-DD)
  autopay INTEGER NOT NULL DEFAULT 0,   -- 0/1
  active INTEGER NOT NULL DEFAULT 1,    -- 0/1 (closed cards kept for history)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,                   -- ISO date the score was observed
  score INTEGER NOT NULL,
  source TEXT,                          -- e.g. 'Credit Karma', 'Experian', 'Amex FICO'
  bureau TEXT,                          -- Equifax / Experian / TransUnion / VantageScore
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  reason TEXT,
  bureau TEXT,
  hard INTEGER NOT NULL DEFAULT 1,      -- 1 = hard pull, 0 = soft
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER REFERENCES cards(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount REAL NOT NULL,
  kind TEXT,                            -- 'minimum' | 'statement' | 'full' | 'custom'
  on_time INTEGER NOT NULL DEFAULT 1,   -- 1 = paid on/before due date
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- One row per day you complete the daily credit check-in. Stores a snapshot
-- (so we can trend utilization/score from YOUR daily inputs) plus the raw
-- answers for reference.
CREATE TABLE IF NOT EXISTS checkins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,            -- YYYY-MM-DD (one per day)
  agg_utilization REAL,                 -- aggregate current utilization at check-in
  reported_utilization REAL,
  composite INTEGER,                    -- health indicator at check-in
  score INTEGER,                        -- latest logged score at check-in (if any)
  focus TEXT,                           -- today's #1 action title
  answers TEXT,                         -- raw survey answers (JSON)
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

module.exports = db;
