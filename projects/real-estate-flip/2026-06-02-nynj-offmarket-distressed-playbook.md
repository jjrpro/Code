# NY/NJ Off-Market Distressed Property Sourcing Playbook

**Date:** June 2, 2026
**Summary:** System for finding OFF-MARKET (not listed) distressed properties in
the NY/NJ metro for flip/wholesale, using public records. Covers the 7 lead
types, the real NY/NJ source for each, the list-stacking method, and the legal
guardrails for direct-to-owner outreach.

---

## Why off-market: not in one feed — you build the list from public records.

## The 7 off-market distressed categories + real NY/NJ sources

| Lead type | Signal | Source |
|---|---|---|
| Pre-foreclosure / Lis Pendens | Foreclosure filed, pre-auction; ~20-30% under market | County clerk; NYC ACRIS; NJ county clerk Lis Pendens index |
| Tax-delinquent | Behind on taxes = distress | Municipal tax collector; NJ tax-sale notices (tctanj.org); town tax-sale lists |
| Vacant / abandoned | Neglected, often absentee | Newark Open Data abandoned-properties dataset; Newark Office of Vacant & Abandoned Property; town vacant registries |
| Code violations / condemned | Can't afford repairs | Municipal building/housing dept records |
| Probate / estate | Heirs want fast cash sale | County Surrogate's Court filings |
| Absentee owners | Out-of-area, tired landlord | Assessor data: mailing addr != property addr |
| High-equity + long ownership | Can discount and still profit | Assessor + recorder (buy date/price vs value) |

## Method (how pros work it)

1. **List-stack** 2-3 lists, target the OVERLAP (tax-delinquent + absentee +
   vacant = hot). Aggregators: PropStream, BatchLeads, DealMachine, ATTOM.
2. **Drive for dollars** target ZIPs (SI 10312, Jersey City, Newark, Bayonne);
   log neglected houses (overgrown, boarded, tarped roof, full mailbox).
3. **Skip trace** owner phone/mailing address.
4. **Direct mail / cold outreach** — short, sincere, cash-buyer letter.
5. **Lock up** with purchase + assignment contract; assign to end buyer.

## Legal guardrails (DO NOT SKIP)

- Contacting an owner already IN FORECLOSURE makes you a distressed-property
  consultant / equity purchaser under **NY HETPA** and **NJ Foreclosure Rescue
  Fraud Prevention Act**: written contracts, no upfront fees, mandatory
  cancellation periods, anti-equity-stripping rules. Use a NJ/NY attorney.
- Tax-delinquent / vacant / probate / absentee leads NOT yet in foreclosure
  don't trigger those laws — cleaner to work.
- Skip tracing public-record owners for legitimate business outreach is legal;
  honor Do-Not-Call and state mail/solicitation rules.

## Sources
- NJ tax sales / collectors assoc: https://www.tctanj.org/cn/webpage.cfm?tpid=14659
- NJ Division of Taxation auctions: https://www.nj.gov/treasury/taxation/auctions.shtml
- Newark Office of Vacant & Abandoned Property: https://www.newarknj.gov/618/Office-of-Vacant-and-Abandoned-Property
- Newark Open Data abandoned properties: https://data.ci.newark.nj.us/dataset/abandoned-properties
- NYC ACRIS (deeds/liens/Lis Pendens): https://a836-acris.nyc.gov

## Next actions (say the word)
- Pull the Newark abandoned-properties dataset to real addresses.
- Build a list-stacking CSV template (tax-delinquent x absentee x vacant).
- Draft compliant direct-mail + cold-call scripts for non-foreclosure leads.
