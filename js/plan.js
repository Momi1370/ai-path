import { localDate } from './store.js';

// The day to open on: today if the week has it, else the next day still to come, else the last one.
export function pickDay(days, now = new Date()) {
  if (!days.length) return -1;
  const today = localDate(now);
  const exact = days.findIndex((d) => d.iso === today);
  if (exact >= 0) return exact;
  const next = days.findIndex((d) => d.iso > today);
  return next >= 0 ? next : days.length - 1;
}

export function taskIds(week) {
  return week.days.flatMap((d) => [...d.html.matchAll(/data-task="([^"]+)"/g)].map((m) => m[1]));
}
