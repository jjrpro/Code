# JaurxTrades VIP — Launch Day Copy Pack

Copy-paste-ready text for the new private channel. Order matters — pinned
welcome first, then disclaimer, then first content drop.

---

## 1) PINNED WELCOME (post first, then pin)

```
🎯 Welcome to JaurxTrades VIP

You're in. Here's what to expect:

▸ Live trade alerts — MGC + MNQ entries, stops, and targets posted the
  moment I take them. Same setups I scan for daily: supply/demand zones
  + FVGs on 1H/15m.

▸ Morning bias — short note on what I'm watching before NY open.

▸ Weekly recap — what worked, what didn't, screenshots.

▸ DM access — message @jaurxreilly any question, 24h reply window.

How to trade these alerts:
1. Size FOR YOUR ACCOUNT. I trade micros and small-size minis.
2. Don't chase a price that's moved. If you missed the entry, you
   missed it — the next one is coming.
3. SL is the SL. Move it to BE after profit, never widen it.
4. Take partials at TP1 if you want. Or hold for TP2. Your call.

Questions? DM @jaurxreilly or @JaurxBot.

Let's eat. 🥩
```

---

## 2) DISCLAIMER (post second, pin BELOW welcome)

```
⚠️ DISCLAIMER — PLEASE READ

JaurxTrades VIP is an educational and entertainment service. Nothing
posted in this channel is financial, investment, or trading advice.

Futures and derivatives trading involves substantial risk of loss and
is not suitable for everyone. Past performance is not indicative of
future results.

You are solely responsible for your own trading decisions and outcomes.
Consult a licensed financial advisor before making investment decisions.

By being in this channel, you acknowledge these terms.

— John Reilly, JaurxTrades
```

---

## 3) FIRST CONTENT DROP — Morning Bias Template

Post this Monday morning before 8 AM ET. Customize MGC + MNQ levels
based on Sunday's analysis.

```
📊 Monday Bias — June 1

MGC
▸ Bias: [bullish / bearish / neutral]
▸ Above: [level] = continuation toward [target]
▸ Below: [level] = invalidation, flip to [counter-bias]
▸ Watching: [zone or FVG you're tracking]

MNQ
▸ Bias: [bullish / bearish / neutral]
▸ Key level: [level]
▸ Watching: [setup]

Plan: [1-2 sentences on how you'll trade today]

NFA. Trade your own size.
```

---

## 4) LAUNCH ANNOUNCEMENT (post in the existing FREE JaurxTrades group)

Schedule this for Sunday 7 PM ET. Hits the existing audience first.

```
Big move tonight — JaurxTrades VIP is live. 🎯

For the first time, my live MGC + MNQ entries go to a private channel.
Same setups I've been calling here, posted the second I take them —
entry, SL, TP, size, all of it.

✅ Real-time alerts (no delay)
✅ Daily morning bias before NY open
✅ Weekly recap of wins, losses, lessons
✅ DM access — questions get 24h replies
✅ Cancel anytime

🎁 Founders offer (first 25 only): $29/mo locked in forever.
   After 25 spots → $49/mo.

Join: [your Whop or Stripe link]

Founders code? DM me directly.

Disclaimer: Educational only. NFA. Trade your own size.
```

---

## 5) FOUNDERS DM TEMPLATE

Send to your 20 most engaged free group members BEFORE the public
launch. Personal touch + scarcity = 30-50% conversion.

```
Hey [name] — quick heads up before I post publicly.

I'm launching JaurxTrades VIP tonight — private channel, live trade
alerts on MGC + MNQ as I take them. Public price is $49/mo.

Founders rate for you: $29/mo locked in for life. Only opening 25
spots and you've been one of the most engaged people in the group,
so wanted to give you first dibs.

Link: [your founders Stripe/Whop link]

No pressure either way. Just figured you'd want to know.

— John
```

---

## 6) TRADE ALERT FORMAT (for the bot to broadcast)

This is what `sendVIP()` in bot-vip-patch.js produces. Reference only —
the bot handles posting automatically when /bracket fires.

```
🎯 VIP

SHORT MNQ
Entry: 29969
SL:    30031.5
TP:    29372.25
Size:  1 contract

R:R = 1:9.5
Risk: $125 to make $1192

Setup: 4H supply zone + 15m FVG fill
Posted as taken. Trade your own size. NFA.
```

---

## 7) WEEKLY RECAP TEMPLATE (post Sunday 8 PM ET)

```
📈 Week in Review — Week of [date range]

Trades taken: [#]
Wins: [#]  Losses: [#]  BEs: [#]
Net: [+$ or -$]

Best trade:
[1-2 sentences + screenshot]

Worst trade:
[1-2 sentences + lesson]

Key lesson this week:
[1 sentence — what you learned, what to do differently]

Next week's focus:
[1 sentence — what you're watching]

NFA.
```

---

## 8) WHEN MEMBERS DM YOU A QUESTION

Save these as bot replies via /vipreply (or just paste manually):

**"Are you a financial advisor?"**
```
No. I'm a retail trader sharing my own trades for education and
entertainment. Nothing here is financial advice. Consult a licensed
advisor for personal financial decisions.
```

**"What's your track record?"**
```
I post wins AND losses in the channel — every trade I take, broadcast
live. Check the pinned weekly recaps for the actual numbers. I don't
publish edited stat sheets because they're easy to fake.
```

**"What size should I trade?"**
```
Whatever lets you sleep at night. I trade micros + small minis on my
own capital. Your risk profile is yours to size. Never risk more than
1-2% of account on a single trade.
```

**"Can I get a refund?"**
```
Subscription cancels anytime — no refund needed, you just stop renewing
and you keep access through the end of your paid period. Cancel anytime
via your Stripe receipt email.
```

---

## CHECKLIST — Launch Day Sequence

- [ ] Create private channel "JaurxTrades VIP"
- [ ] Add @JaurxBot as admin (Post, Edit, Invite, Pin perms)
- [ ] Get channel ID via @userinfobot
- [ ] Update VIP_CHANNEL_ID in bot.js
- [ ] Restart bot
- [ ] Test /vip Hello world → should appear in channel
- [ ] Post WELCOME (pinned)
- [ ] Post DISCLAIMER (pinned below welcome)
- [ ] Set up Whop OR Stripe payment link
- [ ] DM 20 founders with founders rate
- [ ] Sunday 7 PM ET — post launch announcement in free group
- [ ] Monday 7:30 AM ET — post morning bias
- [ ] Monday market hours — take first VIP-broadcast trade

---

**Created**: 2026-05-29
