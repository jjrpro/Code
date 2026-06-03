# CLAURX · Trade Journal

Built for how you actually trade: **you tell CLAURX, CLAURX logs it.** No form to
fill mid-session, no script to remember. The point is your **#2 goal — trade better** —
so the review tool grades your *discipline*, not just your P&L.

## How to log a trade
Just say it, any format. Examples:
- "Log: long MGC 2 contracts, in 2351.4 out 2356.8, +$108, breakout setup, followed my plan."
- "Lost one — short MNQ, in 18420 out 18445, -$50, revenge trade, broke my rule."

CLAURX appends a row to `trades.csv`. Fields:

| field | meaning |
|---|---|
| date | YYYY-MM-DD |
| instrument | MGC / MNQ |
| direction | long / short |
| entry / exit | price |
| contracts | size |
| pnl | net dollars (+/−) |
| setup | your setup name (breakout, reversal, …) |
| rule_followed | Y / N — did you trade your plan? |
| notes | anything: emotion, mistake, context |

## Review (the coaching)
```bash
cd ~/code/projects/claurx/journal
node review.mjs              # everything
node review.mjs MGC          # just gold
node review.mjs --since 2026-06-01
```
Shows win rate, net P&L, avg win/loss, **profit factor**, expectancy, and the one
that matters most: **followed-rules P&L vs. broke-rules P&L.** If breaking your
plan is bleeding money, CLAURX will say so in numbers, not vibes.

## Trading status / equity (the scoreboard)
Same `trades.csv`, no broker login — your numbers, honest math.
```bash
node equity.mjs              # today vs $500 target + running equity curve
node equity.mjs MGC          # just gold
node equity.mjs --since 2026-06-01
node equity.mjs --target 500 # override daily $/day goal
node equity.mjs --start 1500 # absolute account equity off a live balance
```
Shows **today's net P&L vs your $500/day target** (progress bar), a **daily equity
curve** (per-day + cumulative + sparkline), and totals (avg/day, green days).
Defaults live in `config.json` (`daily_target`, `starting_balance`). When you get
Tradovate API Access later, the live feed just replaces the manual `--start`
number — the scoreboard stays the same.

## Cadence
- **Daily:** log every trade same day (memory fades, so do the lessons).
- **Weekly:** CLAURX runs a review, flags patterns, names one thing to fix.
- **Monthly:** roll-up + what changed.

Files sync to your Obsidian vault — readable on your phone within a minute.
