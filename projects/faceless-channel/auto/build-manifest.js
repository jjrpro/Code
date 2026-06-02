// =============================================================================
// build-manifest.js — expand a calendar item + its script into a render manifest
// =============================================================================
//
// Reads the script markdown (HOOK/BODY/PAYOFF), splits the narration into beats,
// and pairs each beat with a cinematic 9:16 visual prompt in the channel's grade.
// Output matches video.manifest.example.json. Deterministic, no API calls — so
// it runs and is testable with zero credits.
// =============================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const GRADE = 'deep navy-and-black, single cool-cyan accent, high contrast, cinematic LUT (Curious Frame signature)';

function readScript(scriptRel) {
  const p = path.join(ROOT, scriptRel);
  const raw = fs.readFileSync(p, 'utf8');
  const grab = (label) => {
    const m = raw.match(new RegExp(`\\*\\*${label}[^*]*\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*|$)`, 'i'));
    return m ? m[1].trim().replace(/\s+/g, ' ') : '';
  };
  return { hook: grab('HOOK'), body: grab('BODY'), payoff: grab('PAYOFF'), cta: grab('CTA') };
}

// Split body into ~2-sentence beats so each gets its own visual.
function splitBeats(body) {
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  const beats = [];
  for (let i = 0; i < sentences.length; i += 2) {
    beats.push(sentences.slice(i, i + 2).join(' '));
  }
  return beats;
}

// Heuristic visual prompt from a line of narration (keeps the channel grade).
function visualFor(line, topic) {
  return `Cinematic 9:16 vertical shot illustrating: "${line}". Subject: ${topic}. ${GRADE}. No text, no watermark, slow camera move.`;
}

function buildManifest(item, cal) {
  const s = readScript(item.script);
  const topic = item.topic;
  const beats = [];

  beats.push({ type: 'hook', narration: s.hook, visual: visualFor(s.hook, topic) });
  for (const line of splitBeats(s.body)) {
    beats.push({ narration: line, visual: visualFor(line, topic) });
  }
  beats.push({ type: 'payoff', narration: s.payoff, visual: visualFor(s.payoff, topic) });

  return {
    day: item.day,
    topic,
    ratio: cal.format?.ratio || '9:16',
    grade: GRADE,
    voice: 'calm, low, confident, slightly cinematic narrator',
    beats,
    package: buildPackage(item, s),
  };
}

// Pull publish copy. Prefer explicit fields on the calendar item if present,
// else fall back to sane derived values (the launch pack has the curated copy).
function buildPackage(item, s) {
  return {
    title: item.title || item.topic,
    description: item.description || `${s.payoff} ${s.cta}`.trim(),
    hashtags: item.hashtags || ['#shorts', '#didyouknow', '#science', '#curious', '#facts'],
    thumbnail_concept: item.thumbnail || `Dark cinematic scene of ${item.topic}, bold cyan 3-5 word overlay`,
  };
}

module.exports = { buildManifest, readScript, splitBeats };
