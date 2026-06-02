// =============================================================================
// server.js — the always-on host for Curious Frame autopilot (Render)
// =============================================================================
//
// A tiny web service so Render keeps it alive + a built-in daily scheduler.
// Render's cron (render.yaml) hits /cron/daily once a day with a shared secret;
// that triggers run-daily.js. Also exposes /status for monitoring and /health.
//
// Env: CRON_SECRET (shared with render.yaml), plus all the generate/youtube envs.
// =============================================================================

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const PORT = process.env.PORT || 8080;
const CRON_SECRET = process.env.CRON_SECRET;
const ROOT = path.join(__dirname, '..');
const CAL = path.join(ROOT, 'calendar.json');
const LOG = path.join(__dirname, 'log.jsonl');

const app = express();

function runDaily(cb) {
  execFile('node', [path.join(__dirname, 'run-daily.js')], { cwd: ROOT }, (err, stdout, stderr) => {
    cb(err, (stdout || '') + (stderr || ''));
  });
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/status', (req, res) => {
  const cal = JSON.parse(fs.readFileSync(CAL, 'utf8'));
  const by = (s) => cal.videos.filter(v => v.status === s).length;
  const published = cal.videos.filter(v => v.status === 'published');
  res.json({
    channel: cal.brand,
    total: cal.videos.length,
    published: by('published'),
    scripted: by('scripted'),
    failed: by('failed'),
    last_published: published.sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''))[0] || null,
  });
});

// Render cron calls this daily. Protected by a shared secret.
app.get('/cron/daily', (req, res) => {
  if (!CRON_SECRET || req.query.key !== CRON_SECRET) return res.status(403).send('forbidden');
  console.log('[cron] daily run triggered');
  runDaily((err, out) => {
    console.log(out);
    if (err) return res.status(500).json({ ok: false, out });
    res.json({ ok: true, out });
  });
});

app.listen(PORT, () => console.log(`[curious-frame autopilot] live on :${PORT}`));
