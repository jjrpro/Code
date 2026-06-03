# CLAUDE.md

Project conventions and entry points for Claude Code sessions in this repo.

## Always do this on session start

1. Read `ops/MEMORY.md` for current cross-project state, recent decisions,
   open threads, and "next session priority" notes. It's the single source of
   truth for what's in flight across all projects.
2. Skim `PROJECTS.md` at repo root for the current project map.
3. If acting as **CLAURX** (JR's personal assistant), read
   `projects/claurx/memory/CLAURX-MEMORY.md` — durable memory of who JR is, his
   preferences, standing instructions, decisions, and open loops. Keep it updated.

## Project layout

This repo is organized as:

- `projects/<name>/` — one directory per active project (jaurx-vip,
  shopify-dropship, local-638, trade-analysis)
- `ops/` — shared infrastructure: MEMORY.md, weekend checklist,
  Mac/Windows Obsidian sync installers, diagnostics
- `.claude/` — Claude Code hooks and settings

When adding new work, place it under the right `projects/<name>/` subdir.
Don't add new top-level dirs without updating `PROJECTS.md`.

## Conventions

- **Save every deliverable to the repo with a detailed dated title.**
  When JR asks for analysis, copy, a plan, a walkthrough, a list, or any
  reusable output: do NOT leave it only in chat. Save it as a file with
  the format `YYYY-MM-DD-descriptive-kebab-name.md` (use ISO-8601 date),
  in the most relevant `projects/<name>/` subdir, or `ops/sessions/` if
  cross-project. The file should have a header with the full date, a
  one-line summary, and the content. Files sync to his Obsidian vault
  on Mac + Windows within 60 seconds.
- **MEMORY.md is the durable state file.** Update it when you make notable
  decisions, resolve open threads, or want next-session-you to remember
  something. Don't bloat it — keep entries factual and short.
- **Stop hook auto-commits + pushes** every session end. Don't manually
  commit unless you want a curated message.
- **Bi-directional Obsidian sync runs every 60s** on JR's Mac (LaunchAgent)
  and Windows (Scheduled Task). Web edits land in his Obsidian vault within
  a minute. Obsidian edits flow back to this repo within a minute. Conflicts
  are surfaced in the sync log, not silently dropped. Installers live in
  `ops/obsidian-sync/`.
- **Don't write docs unless asked.** Operational pack files
  (whop-launch-pack, VIP-LAUNCH, etc.) are deliverables JR requested.
  Don't auto-generate READMEs or design docs.

## JR's context (the user)

- Trader (MGC + MNQ futures) on Tradovate
- Operates JaurxTrades free Telegram + JAURX VIP (launching)
- Runs JaurxShops Shopify store (magnetic phone wallets)
- Mac primary, Windows secondary
- Not a developer — give him paste-ready material, not architectural
  discussions
- Email: admin@jjrproconsultants.com

## When in doubt

- New project? Make `projects/<name>/` and update `PROJECTS.md`
- New shared infra? Goes in `ops/`
- Trade analysis? Goes in `projects/trade-analysis/`
- Updating cross-project state? Edit `ops/MEMORY.md`
