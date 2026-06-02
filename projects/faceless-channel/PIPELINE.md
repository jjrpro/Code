# Production Pipeline — Cinematic Curiosities

How Claude turns a calendar row into a finished, monetizable video. One run =
one video (or a small batch). Designed to clear YouTube's 2026 "inauthentic
content" bar via **original script + original visuals**.

## The loop (per video)

1. **Pull topic** — next `status: "queued"` row in `calendar.json` (lead with
   `strong: true` days).
2. **Write script** — 120–180 words, 2-second hook first, payoff last. Real
   research, a genuine angle, a surprising fact. Save to `scripts/dayNN-*.md`.
   This is the authenticity backbone — never generic AI filler.
3. **Build the manifest** — split the script into timed beats; write one
   cinematic 9:16 visual prompt per beat. See `video.manifest.example.json`.
4. **Generate visuals** — feed each beat's `visual` prompt to the video tool
   (channel grade: deep teal-and-black, high contrast, consistent LUT).
5. **Assemble** — stitch clips under the narration, add caption font + intro
   stinger (the visual signature that makes the channel recognizable).
6. **Score** — run virality prediction; only queue videos above
   `min_score_to_queue`. Weak ones get a new hook or get cut.
7. **Package** — title, description, 15–20 hashtags, thumbnail concept.
8. **Hand off** — drop the finished file + a filled `publish-sheet` (from
   `publish-sheet-template.md`) into JR's review folder. Mark the row
   `status: "packaged"`.

JR (or a scheduler) publishes. That's the only human touch.

## Authenticity guardrails (do not skip — this is what keeps it monetizable)

- **Every video starts from an original written script** with a real point of
  view — not a list of facts narrated over stock.
- **All visuals are generated original**, never scraped/stock compilations.
- **Vary structure** between videos (hook style, pacing, reveal) so the channel
  doesn't read as a template farm.
- **Add genuine value**: each video should teach or reframe something. If it
  doesn't, it doesn't ship.

## Autopilot

Target cadence: 1–2 videos/day. Two ways to automate, both gated on credits:

- **Scheduled trigger (recommended):** a daily Claude Code web trigger runs this
  pipeline each morning, producing the day's video(s) and updating `calendar.json`.
  (See https://code.claude.com/docs/en/claude-code-on-the-web for triggers.)
- **`/loop` skill:** within an active session, run the pipeline on an interval.

When activated, the daily run: pulls next queued topic → script → manifest →
render → score → package → hand off → commit. Files auto-sync to Obsidian.

## ⚠️ Current blocker

The connected media account is on the **free plan with 10 credits** — not enough
to render a single finished video. Production cannot start until JR funds credits
(paid plan or one-time top-up). Everything upstream of rendering (topic, script,
manifest, package) can be produced now without credits and is ready to batch.

## What can run RIGHT NOW (no credits)

- Write all 30 scripts and manifests in advance (the hard creative work).
- Produce titles/descriptions/hashtags/thumbnail concepts for the full month.
- This front-loads everything so that once credits land, it's pure rendering.

## File map

| File | Role |
|---|---|
| `calendar.json` | Topic queue + per-video status |
| `scripts/` | Original narration scripts (the authenticity backbone) |
| `video.manifest.example.json` | The per-video production spec format |
| `publish-sheet-template.md` | What JR pastes into YouTube/TikTok |
| `2026-05-31-cinematic-curiosities-blueprint.md` | The strategy + monetization math |
