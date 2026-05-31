---
tags:
  - jaurx-web-design
  - jaurx
  - web-design
  - staten-island
---

# Jaurx Web Design — Local Business Websites (Staten Island)

A complete kit to run a local web-design side business: **one reusable site
template, four ready-to-show demos, and a paste-ready sales pack.** Targeted at
businesses around 10312 (Annadale / Eltingville / Huguenot / Arden Heights) and
the surrounding 5-mile radius on the South Shore.

## Why it's built this way

You can't honestly auto-generate "every business in a 5-mile radius a website" —
and you shouldn't put live sites in real businesses' names without their okay.
What actually makes money: a sharp template you clone per client, a few demo
sites to show what they'd get, and a simple repeatable sales process. That's
this folder.

## What's here

```
si-web-design/
├── template/           ← the master template. Copy it per client, Find&Replace
│   └── index.html        the [[PLACEHOLDERS]], change 2 colors, done.
├── demos/              ← four FICTIONAL examples to show what you build
│   ├── pizzeria/         (Food)          — Amboy Brick Oven
│   ├── contractor/       (Home services) — Huguenot Home Improvement
│   ├── salon/            (Personal care) — Eltingville Beauty Lounge
│   └── auto/             (Auto)          — Arden Heights Auto Care
├── mockups/            ← REAL local prospects (10312) that have no website
│   ├── top-notch-barber/        — 3944 Richmond Ave
│   ├── mm-deli-bagels/          — 849 Annadale Rd
│   ├── eltingville-nail-salon/  — 4328 Amboy Rd
│   └── README.md                — verify-before-sending notes + skip list
└── sales/
    ├── 01-prospect-list.md       ← how to build the 5-mile-radius lead list
    ├── prospect-tracker.csv      ← real leads researched + your own
    ├── 02-outreach-scripts.md    ← email / DM / walk-in / phone scripts
    ├── 03-pricing-and-delivery.md← packages + step-by-step delivery
    └── 04-deploy-guide.md        ← put a site live free on Netlify (2 min)
```

> **`demos/`** are fictional (555 numbers) — generic showcases.
> **`mockups/`** are real local businesses that appear to have no website,
> built from public info. ⚠️ The info may be stale — **verify with the owner
> before publishing.** See `mockups/README.md`.

## How to see the sites right now

Just open any `index.html` in a browser (double-click it). No build step, no
dependencies. They're fully responsive — resize the window or open on your phone.

## The 4-step play

1. **Build a list** — `sales/01-prospect-list.md`. Find local businesses with no
   site or a bad one. Log them in `prospect-tracker.csv`. Aim for 20–30.
2. **Make a mockup** — copy `template/`, fill in a real prospect's name, colors,
   and info (use a demo as the starting point). Put it live free on Netlify Drop.
3. **Reach out** — send the mockup link with a script from
   `sales/02-outreach-scripts.md`. Walk-ins convert best on SI.
4. **Close & deliver** — `sales/03-pricing-and-delivery.md`. Build = $400,
   Care Plan = $400 + $40/mo (push this — recurring income).

## Putting a site live (free, 30 seconds)

1. Go to **app.netlify.com/drop**
2. Drag the client's folder onto the page
3. You get a live link instantly (e.g. `tonys-pizza.netlify.app`)
4. Connect their real domain later in Netlify settings (free SSL)

## Customizing the template

Open `template/index.html` — the comment at the top lists every `[[PLACEHOLDER]]`
to Find & Replace, and the two brand colors to change. That's the whole job.
