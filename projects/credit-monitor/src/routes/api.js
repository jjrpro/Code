'use strict';

const express = require('express');
const router = express.Router();

const cards = require('../models/cards');
const scores = require('../models/scores');
const inquiries = require('../models/inquiries');
const payments = require('../models/payments');
const dashboard = require('../logic/dashboard');
const survey = require('../logic/daily-survey');
const csv = require('../logic/csv');
const plaid = require('../plaid/plaid');
const notify = require('../notify');
const seed = require('../seed');

function asBool(v) {
  return v === true || /^(1|true|yes|on)$/i.test(String(v));
}
function wrap(fn) {
  return (req, res) => {
    try {
      const out = fn(req, res);
      if (out && typeof out.then === 'function') {
        out.catch((e) => res.status(500).json({ error: e.message }));
      }
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };
}

// ── Dashboard (the computed payload) ──
router.get('/dashboard', wrap((req, res) => {
  const options = {};
  if (req.query.target) options.targetPct = Number(req.query.target);
  if (req.query.azeo !== undefined) options.azeoMode = asBool(req.query.azeo);
  res.json(dashboard.build(options));
}));

// ── Cards ──
router.get('/cards', wrap((req, res) => res.json(cards.list())));
router.get('/cards/:id', wrap((req, res) => {
  const c = cards.get(Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json(c);
}));
router.post('/cards', wrap((req, res) => res.status(201).json(cards.create(req.body))));
router.put('/cards/:id', wrap((req, res) => {
  const c = cards.update(Number(req.params.id), req.body);
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json(c);
}));
router.delete('/cards/:id', wrap((req, res) => res.json({ deleted: cards.remove(Number(req.params.id)) })));

// ── Scores ──
router.get('/scores', wrap((req, res) => res.json(scores.list())));
router.post('/scores', wrap((req, res) => res.status(201).json(scores.create(req.body))));
router.delete('/scores/:id', wrap((req, res) => res.json({ deleted: scores.remove(Number(req.params.id)) })));

// ── Inquiries ──
router.get('/inquiries', wrap((req, res) => res.json(inquiries.list())));
router.post('/inquiries', wrap((req, res) => res.status(201).json(inquiries.create(req.body))));
router.delete('/inquiries/:id', wrap((req, res) => res.json({ deleted: inquiries.remove(Number(req.params.id)) })));

// ── Payments ──
router.get('/payments', wrap((req, res) => res.json(payments.list({ cardId: req.query.cardId ? Number(req.query.cardId) : undefined }))));
router.post('/payments', wrap((req, res) => res.status(201).json(payments.create(req.body))));
router.delete('/payments/:id', wrap((req, res) => res.json({ deleted: payments.remove(Number(req.params.id)) })));

// ── CSV import (column-mapped) ──
// body: { type: 'cards'|'payments', csv: '<raw>', mapping: {...}, matchBy }
router.post('/import/csv', wrap((req, res) => {
  const { type, csv: text, mapping = {}, matchBy } = req.body || {};
  if (!text) return res.status(400).json({ error: 'csv text required' });
  if (type === 'payments') return res.json(csv.importPayments(text, mapping));
  return res.json(csv.importCards(text, mapping, { matchBy }));
}));

// Preview headers/first rows so the UI can build a mapping.
router.post('/import/preview', wrap((req, res) => {
  const { csv: text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'csv text required' });
  const { headers, records } = csv.parseToObjects(text);
  res.json({ headers, sample: records.slice(0, 5), rowCount: records.length });
}));

// ── Notifications ──
router.post('/notify/digest', wrap(async (req, res) => {
  const dryRun = asBool(req.query.dryRun || (req.body && req.body.dryRun));
  res.json(await notify.sendDigest({ dryRun }));
}));

// ── Daily check-in / survey ──
router.get('/survey/today', wrap((req, res) => {
  const options = {};
  if (req.query.target) options.targetPct = Number(req.query.target);
  res.json(survey.today(options));
}));
router.post('/survey', wrap((req, res) => res.json(survey.submit(req.body || {}))));
router.get('/survey/progress', wrap((req, res) => res.json(survey.progress())));

// ── Admin (local, destructive) ──
// Clear ALL data so you can enter your own cards (replaces the sample data).
router.post('/admin/reset', wrap((req, res) => {
  seed.wipe();
  res.json({ ok: true, cleared: true });
}));
// Reload the bundled sample data.
router.post('/admin/load-sample', wrap((req, res) => {
  seed.wipe();
  seed.load();
  res.json({ ok: true, sample: true });
}));

// ── Plaid (stub) ──
router.get('/plaid/status', wrap((req, res) => res.json(plaid.status())));

module.exports = router;
