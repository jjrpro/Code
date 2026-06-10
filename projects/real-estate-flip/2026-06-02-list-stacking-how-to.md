# List-Stacking Tracker — How To Use + Data-Source Status

**Date:** June 2, 2026
**Summary:** How to use `list-stacking-tracker.csv` to score off-market
distressed leads by overlapping distress signals, plus an honest status on
which NY/NJ data sources are usable for pulling real addresses.

---

## The idea

One distress signal is noise. OVERLAP is signal. A house that is
tax-delinquent AND absentee-owned AND vacant is a genuinely motivated seller.
The tracker scores each lead by how many signals stack.

## How to use `list-stacking-tracker.csv`

1. Dump leads from ANY source into a row (one property per row).
2. Mark each `_YN` column Y/N as you confirm a signal.
3. **stack_score** = number of `_YN` columns set to Y. Sort descending —
   work the highest scores first.
4. **MAO_calc** = (est_ARV x 0.70) - est_repairs - your_assignment_fee.
   Only pursue if MAO >= what it'll take to get it under contract.
5. Track outreach in skip_traced / owner_phone / mail_sent_date /
   contact_status / offer_made.

Open in Excel/Google Sheets; add a formula for stack_score if you want it auto.

## The 7 signal columns
absentee · pre_foreclosure · tax_delinquent · vacant_abandoned ·
code_violation · probate_estate · high_equity

---

## Data-source status (checked 2026-06-02) — READ THIS

**Free municipal vacant lists = stale or down, use only as overlay:**
- Newark Open Data abandoned-properties: portal returned 503 (down). File is
  keyed by BLOCK/LOT only (no street address) and dated 2021-07-27 — needs a
  parcel join + is old. URL kept for retry:
  https://data.ci.newark.nj.us/dataset/abandoned-properties
- Jersey City vacant-building inventory: static file dumps 2014-2018, live API
  returns 0 records. Old.

**Current address-level off-market data actually comes from:**
- Paid aggregators (refresh county records daily, one-click stacking):
  PropStream (~$99/mo), BatchLeads, DealMachine, ATTOM. Best tool for volume.
- Direct county pulls (current, manual): NJ county clerk Lis Pendens index;
  each municipality's annual tax-sale list; county Surrogate's Court probate.
- Driving for dollars (free, current, hyper-local) — you build the list.

**Do NOT** treat the 2021/2018 municipal files as current leads — verify each
address is still distressed before mailing.

## Legal reminder
Foreclosure-stage direct-to-owner outreach triggers NY HETPA / NJ Foreclosure
Rescue Fraud Prevention Act. Non-foreclosure leads (tax/vacant/probate/
absentee) are cleaner. Paper contracts + disclosures with a NJ/NY attorney.

## Next actions (say the word)
- Retry the Newark dataset later + write a block/lot -> address parcel-join.
- If you get a PropStream/BatchLeads account, I'll give you the exact
  filter+stack recipe to export straight into this tracker.
- Draft compliant direct-mail + cold-call scripts for non-foreclosure leads.
