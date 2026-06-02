// =============================================================================
// run-daily.js — the autopilot loop (one run = one published video)
// =============================================================================
//
// Called by the daily cron (see server.js / render.yaml). Steps:
//   1. Pick the next calendar item not yet published.
//   2. Build its manifest (script -> timed beats + visual prompts).
//   3. Generate + stitch the video and thumbnail.
//   4. (optional) score with virality; skip-and-flag if below threshold.
//   5. Upload to YouTube via the Data API (scheduled or public).
//   6. Update calendar.json status + append to auto/log.jsonl.
//
//   node auto/run-daily.js            # produce + publish the next item
//   node auto/run-daily.js --dry      # do everything except generate/upload
//
// Designed to be idempotent: re-running after a failure resumes the same item.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { buildManifest } = require('./build-manifest');
const { produce } = require('./generate');
const { uploadShort } = require('./youtube');

const ROOT = path.join(__dirname, '..');
const CAL = path.join(ROOT, 'calendar.json');
const LOG = path.join(__dirname, 'log.jsonl');
const DRY = process.argv.includes('--dry');

const ORDER_STRONG_FIRST = true; // lead with the ★ strong-hook days

function loadCal() { return JSON.parse(fs.readFileSync(CAL, 'utf8')); }
function saveCal(c) { fs.writeFileSync(CAL, JSON.stringify(c, null, 2) + '\n'); }
function log(entry) { fs.appendFileSync(LOG, JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n'); }

function pickNext(cal) {
  const pending = cal.videos.filter(v => v.status !== 'published' && v.status !== 'failed');
  if (!pending.length) return null;
  if (ORDER_STRONG_FIRST) {
    const strong = pending.filter(v => v.strong);
    return (strong.length ? strong : pending).sort((a, b) => a.day - b.day)[0];
  }
  return pending.sort((a, b) => a.day - b.day)[0];
}

async function main() {
  const cal = loadCal();
  const item = pickNext(cal);
  if (!item) { console.log('[run-daily] nothing pending — calendar complete'); return; }
  console.log(`[run-daily] next: Day ${item.day} — ${item.topic}${DRY ? ' (DRY)' : ''}`);

  const manifest = buildManifest(item, cal);

  if (DRY) {
    console.log(`[run-daily] built manifest with ${manifest.beats.length} beats; title: "${manifest.package.title}"`);
    console.log('[run-daily] DRY run — skipping generation + upload');
    return;
  }

  // 3. produce
  const { video, thumbnail } = await produce(manifest);
  log({ day: item.day, step: 'produced', video });

  // 5. upload (scheduled by default: next 9am ET slot if you prefer — here: public now)
  const meta = {
    title: manifest.package.title,
    description: manifest.package.description + '\n\n' + (manifest.package.hashtags || []).join(' '),
    tags: (manifest.package.hashtags || []).map(h => h.replace(/^#/, '')),
    privacyStatus: 'public',
  };
  const up = await uploadShort(video, meta);
  log({ day: item.day, step: 'uploaded', videoId: up.videoId, url: up.url });

  // 6. mark published
  const v = cal.videos.find(x => x.day === item.day);
  v.status = 'published';
  v.youtube_url = up.url;
  v.published_at = new Date().toISOString();
  saveCal(cal);
  console.log(`[run-daily] PUBLISHED Day ${item.day} -> ${up.url}`);
}

main().catch(err => {
  console.error('[run-daily] failed:', err.message);
  log({ step: 'error', error: err.message });
  process.exit(1);
});
