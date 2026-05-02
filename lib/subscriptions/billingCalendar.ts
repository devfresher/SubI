import { formatInTimeZone } from "date-fns-tz";

/** Interpret `yyyy-MM-dd` as a UTC calendar instant (noon avoids edge cases). */
function utcCalendarDateFromYmd(ymd: string): Date {
  const s = ymd.trim().slice(0, 10);
  const seg = s.split("-");
  if (seg.length !== 3) return new Date(NaN);
  const y = Number(seg[0]);
  const mo = Number(seg[1]);
  const d = Number(seg[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return new Date(NaN);
  }
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0));
}

/**
 * Whole calendar days from "today" in the user's profile timezone to the billing date.
 * (Browser local timezone must not affect the result — see dashboard vs Subscriptions consistency.)
 */
export function daysUntilBillingInUserTimeZone(
  nextBillingYmd: string,
  userTimeZone: string,
  now: Date = new Date(),
): number {
  const todayYmd = formatInTimeZone(now, userTimeZone, "yyyy-MM-dd");
  const t0 = utcCalendarDateFromYmd(todayYmd).getTime();
  const t1 = utcCalendarDateFromYmd(nextBillingYmd).getTime();
  return Math.round((t1 - t0) / 86400000);
}
