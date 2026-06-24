# Hidden Labs — Catalog & Pricing (shipping included)

**Date:** 2026-06-24
**Summary:** Full Hidden Labs research-compound catalog loaded into the site
(`projects/hidden-labs/index.html`). Every retail price = supplier price **+ $25**
so shipping is baked in and the storefront can advertise "shipping included /
no surprise fees at checkout." 19 SKUs, grouped into 5 neat categories.

> Compliance: site stays framed as **research use only / not for human
> consumption** — no dosing or health claims anywhere. Keep it that way.

---

## Pricing table

| # | Product | Size | Your cost | +$25 ship | **List price** |
|---|---|---|---|---|---|
| 1 | Retatrutide | 10mg | 150 | 25 | **$175** |
| 2 | Retatrutide | 30mg | 300 | 25 | **$325** |
| 3 | Tesamorelin | 20mg | 175 | 25 | **$200** |
| 4 | MOTS-c | 40mg | 180 | 25 | **$205** |
| 5 | NAD+ | 500mg | 65 | 25 | **$90** |
| 6 | CJC-1295 / Ipamorelin | blend | 80 | 25 | **$105** |
| 7 | Sermorelin | 5mg | 50 | 25 | **$75** |
| 8 | BPC-157 | 5mg | 50 | 25 | **$75** |
| 9 | BPC-157 | 10mg | 80 | 25 | **$105** |
| 10 | TB-500 | 5mg | 50 | 25 | **$75** |
| 11 | Wolverine Blend (BPC-157 + TB-500) | blend | 100 | 25 | **$125** |
| 12 | Glow Blend (GHK-Cu + BPC-157 + TB-500) | blend | 140 | 25 | **$165** |
| 13 | KPV | 5mg | 50 | 25 | **$75** |
| 14 | GHK-Cu | 50mg | 55 | 25 | **$80** |
| 15 | GHK-Cu | 100mg | 100 | 25 | **$125** |
| 16 | Melanotan II | 10mg | 50 | 25 | **$75** |
| 17 | Selank | 5mg | 60 | 25 | **$85** |
| 18 | Semax | 5mg | 60 | 25 | **$85** |
| 19 | PT-141 | 10mg | 60 | 25 | **$85** |

---

## How it's laid out on the site

Catalog is split into labeled sections so it reads cleanly instead of a wall
of vials:

1. **Metabolic & Longevity Research** — Retatrutide 10/30mg, Tesamorelin, MOTS-c, NAD+
2. **Growth-Hormone Secretagogues** — CJC-1295/Ipamorelin, Sermorelin
3. **Repair & Recovery Research** — BPC-157 5/10mg, TB-500, Wolverine, Glow, KPV
4. **Cosmetic & Skin Research** — GHK-Cu 50/100mg, Melanotan II
5. **Nootropic & Other Research** — Selank, Semax, PT-141

Each card shows a "shipping incl." note under the price and the home page,
why-us section, and FAQ all reinforce that shipping is included.

---

## Notes / things to confirm before publish

- **Vial sizes:** sizes were taken from your list where given. For items you
  didn't specify a size on (MT-2, Selank, Semax, PT-141, KPV) I used the
  standard research vial size — change any label in `index.html` if your
  supplier's vials differ.
- **Blend contents:** Wolverine = BPC-157 + TB-500; Glow = GHK-Cu + BPC-157 +
  TB-500 (industry-standard). Adjust if your formulas differ.
- **Product imagery (done):** AI-generated branded vial shots live in `img/`
  and are wired into every card with a 3D-animated effect (always-on float +
  Y-axis sway, cursor-driven 3D tilt, cyan light-sweep on hover) that matches
  the site's animated-molecule theme. Dose variants share one image
  (BPC-157 5/10mg, GHK-Cu 50/100mg, Retatrutide 10/30mg); blends show 2–3 vials.
  Swap in real product photos later if you want.
- **Still TODO before going live:** working checkout link (Shopify/Stripe),
  business contact email, optional 21+ age-gate, COA links.
