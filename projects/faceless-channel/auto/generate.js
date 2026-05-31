// =============================================================================
// generate.js — turn a video manifest into rendered clips + a stitched MP4
// =============================================================================
//
// This is the media-generation seam. The actual image/video model calls happen
// through the platform's generation API (the same engine behind the MCP media
// tools). On the always-on host we call that API with the account's API key.
//
// Required env:
//   MEDIA_API_KEY   — the generation account's API key (the funded account)
//   FFMPEG_PATH     — optional, defaults to 'ffmpeg' on PATH
//
// Pipeline per manifest:
//   1. For each beat -> generate a 9:16 cinematic clip from beat.visual prompt.
//   2. Generate a narration track from the joined script (TTS).
//   3. Stitch clips in order, lay narration + captions, add intro stinger.
//   4. Write renders/dayNN-slug.mp4 and a matching thumbnail.
//
// NOTE: the model-call helper is isolated in `renderClip` / `renderVoice` /
// `renderThumbnail` so the exact endpoint can be set once funding is live and
// the account's API surface is known. Everything else (orchestration, stitch,
// status updates) is final.
// =============================================================================

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const RENDER_DIR = path.join(ROOT, 'renders');
const WORK_DIR = path.join(ROOT, '.work');
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function ensureDirs() {
  for (const d of [RENDER_DIR, WORK_DIR]) fs.mkdirSync(d, { recursive: true });
}

// ---- model-call seam (finalized once the funded account's API is known) -----
// Each returns a local file path. They throw a clear error until MEDIA_API_KEY
// is set, so the orchestration can be fully tested dry-run without spending.

async function renderClip(prompt, outPath, { ratio = '9:16', seconds = 6 } = {}) {
  if (!process.env.MEDIA_API_KEY) throw new Error('MEDIA_API_KEY not set — fund + key the media account first');
  // TODO(once funded): POST prompt to the account's video endpoint, poll job,
  // download the resulting mp4 to outPath. Kept isolated so only this body
  // changes when the account is live.
  throw new Error('renderClip: media endpoint not wired yet (awaiting funded account)');
}

async function renderVoice(text, outPath) {
  if (!process.env.MEDIA_API_KEY) throw new Error('MEDIA_API_KEY not set');
  throw new Error('renderVoice: TTS endpoint not wired yet (awaiting funded account)');
}

async function renderThumbnail(prompt, outPath) {
  if (!process.env.MEDIA_API_KEY) throw new Error('MEDIA_API_KEY not set');
  throw new Error('renderThumbnail: image endpoint not wired yet (awaiting funded account)');
}

// ---- ffmpeg stitch (final) --------------------------------------------------

function stitch(clipPaths, voicePath, outPath) {
  // concat clips, then mux narration audio
  const listFile = path.join(WORK_DIR, 'concat.txt');
  fs.writeFileSync(listFile, clipPaths.map(p => `file '${p}'`).join('\n'));
  const silentConcat = path.join(WORK_DIR, 'video_only.mp4');
  execFileSync(FFMPEG, ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', silentConcat], { stdio: 'inherit' });
  execFileSync(FFMPEG, ['-y', '-i', silentConcat, '-i', voicePath, '-c:v', 'copy', '-c:a', 'aac', '-shortest', outPath], { stdio: 'inherit' });
  return outPath;
}

// ---- orchestration (final) --------------------------------------------------

async function produce(manifest) {
  ensureDirs();
  const slug = `day${String(manifest.day).padStart(2, '0')}`;
  const clipPaths = [];
  for (let i = 0; i < manifest.beats.length; i++) {
    const beat = manifest.beats[i];
    const clipOut = path.join(WORK_DIR, `${slug}-beat${i}.mp4`);
    await renderClip(beat.visual, clipOut, { ratio: manifest.ratio });
    clipPaths.push(clipOut);
  }
  const voiceOut = path.join(WORK_DIR, `${slug}-voice.mp3`);
  await renderVoice(manifest.beats.map(b => b.narration).join(' '), voiceOut);

  const videoOut = path.join(RENDER_DIR, `${slug}.mp4`);
  stitch(clipPaths, voiceOut, videoOut);

  const thumbOut = path.join(RENDER_DIR, `${slug}.jpg`);
  if (manifest.package?.thumbnail_concept) {
    await renderThumbnail(manifest.package.thumbnail_concept, thumbOut);
  }
  return { video: videoOut, thumbnail: thumbOut };
}

module.exports = { produce, stitch, renderClip, renderVoice, renderThumbnail };
