'use strict';

const path = require('path');
const express = require('express');
const config = require('./config');
const db = require('./db');
const api = require('./routes/api');
const auth = require('./auth');
const scheduler = require('./jobs/scheduler');
const { maybeSeed } = require('./seed');

const app = express();
app.set('trust proxy', 1); // honor X-Forwarded-Proto behind a cloud proxy (secure cookies)
app.use(express.json({ limit: '15mb' })); // screenshots arrive as base64

app.get('/health', (req, res) => res.json({ ok: true, asOf: new Date().toISOString() }));

// Password gate (no-op when CM_PASSWORD is unset / local use).
app.use(auth.middleware);

// Login page.
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'login.html')));

// Static dashboard (zero build step). Set the manifest's content-type.
app.use(
  express.static(path.join(__dirname, '..', 'public'), {
    setHeaders(res, filePath) {
      if (filePath.endsWith('.webmanifest')) res.setHeader('Content-Type', 'application/manifest+json');
    },
  })
);

app.use('/api', api);

function start() {
  // Safety: never expose financial data on a public interface without a password.
  const loopback = ['127.0.0.1', '::1', 'localhost'];
  if (!loopback.includes(config.host) && !auth.enabled()) {
    // eslint-disable-next-line no-console
    console.error(
      `\n  ✋ Refusing to start: HOST=${config.host} is not localhost but CM_PASSWORD is not set.\n` +
        `  Set CM_PASSWORD (and ideally CM_ENCRYPTION_KEY) before exposing the app.\n` +
        `  For local-only use, leave HOST at 127.0.0.1.\n`
    );
    process.exit(1);
  }

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
    console.log(`  Auth: ${auth.enabled() ? 'password-protected' : 'open (local only)'}`);
    console.log(`  Screenshot import: ${config.anthropic.apiKey ? 'enabled' : 'set CM_ANTHROPIC_API_KEY to enable'}\n`);
  });
}

if (require.main === module) start();

module.exports = { app, db, start };
