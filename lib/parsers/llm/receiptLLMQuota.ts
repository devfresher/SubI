const quotaByUser = new Map<string, { dayUtc: string; count: number }>();

function utcDayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** In-memory daily cap per user for receipt LLM calls (multi-instance deployments need Redis/DB later). */
export function tryConsumeReceiptLlmQuota(userId: string): boolean {
  const raw = process.env.RECEIPT_LLM_DAILY_CAP_PER_USER ?? "48";
  const cap = Number.parseInt(raw, 10);
  const limit = Number.isFinite(cap) && cap > 0 ? cap : 48;
  const day = utcDayString();
  const cur = quotaByUser.get(userId);
  if (!cur || cur.dayUtc !== day) {
    quotaByUser.set(userId, { dayUtc: day, count: 1 });
    return true;
  }
  if (cur.count >= limit) {
    return false;
  }
  cur.count += 1;
  return true;
}

export function resetReceiptLlmQuotaForTests(): void {
  quotaByUser.clear();
}
