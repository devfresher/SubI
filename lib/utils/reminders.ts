import { toDate } from "date-fns-tz";

const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

/** Calendar YYYY-MM-DD minus days (UTC date arithmetic on components). */
export function subtractCalendarDaysYmd(ymd: string, days: number): string {
  const parts = ymd.split("-").map((p) => Number.parseInt(p, 10));
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y + m + d)) {
    throw new RangeError(`Invalid date ymd: ${ymd}`);
  }
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * 09:00 local on reminderYmd in user IANA timezone → UTC instant.
 */
export function computeNotifyAtUtc(reminderYmd: string, timezone: string): Date {
  const local = `${reminderYmd} ${String(REMINDER_HOUR).padStart(2, "0")}:${String(
    REMINDER_MINUTE,
  ).padStart(2, "0")}:00`;
  return toDate(local, { timeZone: timezone });
}

export function computeNotificationTimes(
  nextBillingDateYmd: string,
  timezone: string,
  offsetsDays: number[],
): Date[] {
  const unique = Array.from(new Set(offsetsDays)).sort((a, b) => b - a);
  return unique.map((off) => {
    const reminderYmd = subtractCalendarDaysYmd(nextBillingDateYmd, off);
    return computeNotifyAtUtc(reminderYmd, timezone);
  });
}
