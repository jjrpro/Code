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

## Cadence
- **Daily:** log every trade same day (memory fades, so do the lessons).
- **Weekly:** CLAURX runs a review, flags patterns, names one thing to fix.
- **Monthly:** roll-up + what changed.

Files sync to your Obsidian vault — readable on your phone within a minute.
