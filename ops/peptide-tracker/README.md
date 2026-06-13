# Peptide Tracker

A single-file web app to track JR's peptide cycles, log injections (with auto site-rotation),
and generate native phone reminders. No install, no server, no accounts — everything runs in
the browser and saves locally.

## How to use it

1. **Open `index.html`** in any browser (Safari/Chrome on phone or Mac).
2. **iPhone home-screen app:** open it in Safari → Share → *Add to Home Screen*. Now it opens
   like an app.
3. **Tabs:**
   - **Today** — what's due; tap *Log injection* when you shoot (timestamps it + advances your
     injection site so you don't reuse a spot).
   - **Cycles** — how many days/weeks you've been on each compound.
   - **History** — every logged shot.
   - **Alerts** — set your times, tap *Download calendar reminders (.ics)*, open the file on
     your phone → adds **repeating native Calendar alarms** (Semax AM, Tesa night, Reta weekly).
     These fire even when the app is closed. This is the actual alarm system.
   - **Setup** — edit doses/start dates; **Export/Import JSON** to back up or move devices.

## Notes
- Data lives in the browser's local storage (per device). Use **Export JSON** to keep a backup.
- Pre-loaded with the current protocol: Reta 40u/4mg weekly (since Feb 10), Tesa 15u/1.5mg
  nightly (since May 13), Semax 6.5u/650mcg AM (since May 21).
- The reminders are plain calendar events — change times anytime and re-download.

*Personal tracking tool. Not medical advice.*
