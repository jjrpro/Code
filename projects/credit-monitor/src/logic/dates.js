'use strict';

// Small date helpers. The app stores recurring statement/due dates as a
// day-of-month (1-31); these compute the next real calendar occurrence and
// countdowns. All math is done in local time.

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function clampDayToMonth(year, monthIndex, day) {
  // monthIndex is 0-based. Returns a valid day for that month (e.g. day 31
  // becomes 28/30 in shorter months — mirrors how issuers handle it).
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(day, lastDay);
}

// Next occurrence of a given day-of-month, on or after `from` (default today).
function nextOccurrence(dayOfMonth, from = startOfToday()) {
  if (!dayOfMonth) return null;
  const base = new Date(from);
  base.setHours(0, 0, 0, 0);
  let year = base.getFullYear();
  let month = base.getMonth();

  let candidate = new Date(year, month, clampDayToMonth(year, month, dayOfMonth));
  if (candidate < base) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    candidate = new Date(year, month, clampDayToMonth(year, month, dayOfMonth));
  }
  return candidate;
}

function daysBetween(a, b) {
  const MS = 24 * 60 * 60 * 1000;
  const da = new Date(a);
  da.setHours(0, 0, 0, 0);
  const dbb = new Date(b);
  dbb.setHours(0, 0, 0, 0);
  return Math.round((dbb - da) / MS);
}

function daysUntil(date) {
  if (!date) return null;
  return daysBetween(startOfToday(), date);
}

function toISODate(date) {
  if (!date) return null;
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Whole months between an ISO date and today (used for account age).
function monthsSince(isoDate) {
  if (!isoDate) return null;
  const then = new Date(isoDate);
  if (Number.isNaN(then.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

module.exports = {
  startOfToday,
  nextOccurrence,
  daysBetween,
  daysUntil,
  toISODate,
  monthsSince,
};
