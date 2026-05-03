/** Shared YYYY-MM-DD extraction for receipt bodies. */
export function parseLooseDateToYmd(raw: string): string | null {
  const t = raw.trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso?.[1] && iso[2] && iso[3]) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash?.[1] && slash[2] && slash[3]) {
    const mm = slash[1].padStart(2, "0");
    const dd = slash[2].padStart(2, "0");
    return `${slash[3]}-${mm}-${dd}`;
  }
  const parsed = Date.parse(t);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

/** Weekday optional before "Jun 02, 2026" (Paystack, US-style receipts). */
const MONTH_DAY_YEAR_CHUNK = "([A-Za-z]{3,9}\\s+\\d{1,2},?\\s+\\d{4})";

const DATE_PATTERNS: RegExp[] = [
  new RegExp(
    `next\\s+charge\\s+date\\s*:\\s*(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,\\s]+)?${MONTH_DAY_YEAR_CHUNK}`,
    "i",
  ),
  new RegExp(
    `next\\s+(?:payment|invoice)\\s+date\\s*:\\s*(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,\\s]+)?${MONTH_DAY_YEAR_CHUNK}`,
    "i",
  ),
  new RegExp(
    `(?:renew|renewal|renewing)\\s+(?:on|date)\\s*:\\s*(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,\\s]+)?${MONTH_DAY_YEAR_CHUNK}`,
    "i",
  ),
  new RegExp(`\\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,\\s]+${MONTH_DAY_YEAR_CHUNK}\\b`, "i"),
  /(?:renew|renewal|renewing|bill|billing|charge|charged|due|payment|invoice|date)\s*(?:on|date|:)?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i,
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
];

export function extractFirstBillingDateYmd(text: string): string | null {
  for (const re of DATE_PATTERNS) {
    const m = text.match(re);
    if (m?.[1]) {
      const ymd = parseLooseDateToYmd(m[1]);
      if (ymd) return ymd;
    }
  }
  return null;
}
