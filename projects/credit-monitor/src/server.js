'use strict';

const path = require('path');
const express = require('express');
const config = require('./config');
const db = require('./db');
const api = require('./routes/api');
const scheduler = require('./jobs/scheduler');
const { maybeSeed } = require('./seed');

const app = express();
app.use(express.json({ limit: '5mb' }));

// Static dashboard (zero build step).
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ ok: true, asOf: new Date().toISOString() }));
app.use('/api', api);

function start() {
  // Seed sample data on first run so the dashboard looks real immediately.
  const seeded = maybeSeed();
  if (seeded) {
    // eslint-disable-next-line no-console
    console.log('[seed] empty database detected — loaded sample data. Run `npm run seed:reset` to reload.');
  }

  scheduler.start();

  app.listen(config.port, config.host, () => {
    // eslint-disable-next-line no-console
    console.log(`\n  Credit Monitor running → http://${config.host}:${config.port}`);
    console.log(`  Data: ${config.dbPath}`);
    console.log(`  (local-first — nothing leaves this machine unless you configure SMTP/Plaid)\n`);
  });
}

if (require.main === module) start();

module.exports = { app, db, start };
