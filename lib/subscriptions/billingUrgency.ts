/** Calendar-day delta: next billing minus today in the user timezone (via caller). */
export type BillingUrgency = "safe" | "soon" | "critical";

const SOON_DAYS_MAX = 7;

/** Financial-style urgency: green (comfortable), orange (attention), red (due / overdue). */
export function billingUrgency(daysUntil: number): BillingUrgency {
  if (daysUntil < 1) return "critical";
  if (daysUntil <= SOON_DAYS_MAX) return "soon";
  return "safe";
}

export function urgencyBadgeLabel(daysUntil: number): string {
  if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`;
  if (daysUntil === 0) return "Due today";
  return `${daysUntil} day${daysUntil === 1 ? "" : "s"} left`;
}

/** Light-mode colors are punched up so tiers read clearly vs dark (no washed-out uniformity). */
export const urgencyBadgeClass: Record<BillingUrgency, string> = {
  safe:
    "border-emerald-600/55 bg-emerald-500/[0.22] text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-500/12 dark:text-emerald-200",
  soon:
    "border-amber-600/55 bg-amber-400/[0.28] text-amber-950 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200",
  critical:
    "border-red-600/60 bg-red-500/[0.22] text-red-950 dark:border-red-500/40 dark:bg-red-500/12 dark:text-red-300",
};

export const urgencyRailClass: Record<BillingUrgency, string> = {
  safe: "bg-emerald-600 dark:bg-emerald-500/70",
  soon: "bg-amber-500 dark:bg-amber-400/85",
  critical: "bg-red-600 dark:bg-red-500",
};
