import { daysUntilBillingInUserTimeZone } from "@/lib/subscriptions/billingCalendar";

/** Sort renewal rows: soonest upcoming first (by days-until ascending); overdue grouped at end (furthest overdue last). */
export function compareRenewalsByDate(
  a: { next_billing_date: string },
  b: { next_billing_date: string },
  timeZone: string,
): number {
  const da = daysUntilBillingInUserTimeZone(a.next_billing_date, timeZone);
  const db = daysUntilBillingInUserTimeZone(b.next_billing_date, timeZone);
  const aOver = da < 0;
  const bOver = db < 0;
  if (aOver !== bOver) return aOver ? 1 : -1;
  if (!aOver && !bOver) return da - db;
  return db - da;
}
