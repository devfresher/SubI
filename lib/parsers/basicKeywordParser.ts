import { normalizeServiceName } from "@/lib/utils/strings";
import type { NormalizedEmail, SubscriptionDraft, SubscriptionParser } from "./parser.interface";

const KEYWORD_RE = /subscription|billing|trial|renewal/i;

const DATE_PATTERNS: RegExp[] = [
  /(?:renew|bill|charge|due|payment)\s*(?:on|date|:)?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/i,
  /\b(\d{4}-\d{2}-\d{2})\b/,
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/,
];

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
const MANAGE_HINT = /unsubscribe|manage|cancel|account|billing|subscriptions?/i;

function parseDateToYmd(raw: string): string | null {
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

function extractDate(text: string): string | null {
  for (const re of DATE_PATTERNS) {
    const m = text.match(re);
    if (m?.[1]) {
      const ymd = parseDateToYmd(m[1]);
      if (ymd) return ymd;
    }
  }
  return null;
}

function extractCancelUrl(text: string): string | null {
  const urls = text.match(URL_RE);
  if (!urls?.length) return null;
  const hit = urls.find((u) => MANAGE_HINT.test(u));
  return hit ?? urls[0] ?? null;
}

function subjectName(subject: string): string {
  const s = subject.replace(/^(re|fwd?):\s*/gi, "").trim();
  const dash = s.split(/\s+[-–—]\s+/)[0]?.trim();
  return (dash ?? s).slice(0, 120) || "Subscription";
}

export class BasicKeywordParser implements SubscriptionParser {
  parse(message: NormalizedEmail): SubscriptionDraft | null {
    const haystack = `${message.subject}\n${message.snippet}\n${message.bodyText}`;
    if (!KEYWORD_RE.test(haystack)) {
      return null;
    }
    const nextBillingDate = extractDate(haystack);
    if (!nextBillingDate) {
      return null;
    }
    const name = subjectName(message.subject);
    const normalizedName = normalizeServiceName(name);
    return {
      name,
      normalizedName,
      nextBillingDate,
      cancelUrl: extractCancelUrl(haystack),
      provider: "gmail",
    };
  }
}
