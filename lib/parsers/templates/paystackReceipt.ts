import { extractFirstBillingDateYmd } from "@/lib/parsers/dateExtract";
import { emailHaystack } from "@/lib/parsers/emailHaystack";
import { primaryFromEmail } from "@/lib/parsers/fromAddress";
import type { NormalizedEmail, SubscriptionDraft } from "@/lib/parsers/parser.interface";
import type { BillingCadence } from "@/types";
import { normalizeServiceName } from "@/lib/utils/strings";

function isPaystackFrom(fromHeader: string): boolean {
  const e = primaryFromEmail(fromHeader);
  return /@(?:.*\.)?paystack\.com$/i.test(e);
}

/** NGN / ₦ amounts — support "NGN 15000" without decimals. */
function extractNgnAmount(haystack: string): { amount: number; currency: string } | null {
  const n1 = haystack.match(/₦\s*([\d,]+(?:\.\d{2})?)/);
  const n2 = haystack.match(/\bNGN\s*([\d,]+(?:\.\d{2})?)\b/i);
  const raw = n1?.[1] ?? n2?.[1];
  if (!raw) return null;
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return { amount: Math.round(n * 100) / 100, currency: "NGN" };
}

/** "Your subscription to SubI Pro Plan is now active [SUB_…]" */
function productFromSubscriptionSubject(subject: string): string | null {
  const s = subject.replace(/^(re|fwd?):\s*/gi, "").trim();
  const m = s.match(/subscription\s+to\s+(.+?)\s+is\s+now\s+active/i);
  if (!m?.[1]) return null;
  return m[1].replace(/\s*\[[^\]]*SUB_[^\]]+\]\s*$/i, "").trim().slice(0, 120);
}

/** "You have subscribed to **SubI Pro Plan** by **LAO Leathers**." */
function productFromSubscriptionBody(haystack: string): string | null {
  const m = haystack.match(/subscribed\s+to\s+([^.\n]+?)\s+by\s+/i);
  if (!m?.[1]) return null;
  return m[1].trim().replace(/\*+/g, "").trim().slice(0, 120);
}

function paystackDisplayName(haystack: string, subject: string): string {
  const fromSubj = productFromSubscriptionSubject(subject);
  if (fromSubj) return fromSubj;
  const fromBody = productFromSubscriptionBody(haystack);
  if (fromBody) return fromBody;
  const legacy = subject.match(/payment\s*(?:receipt|notification)?\s*[-–—]\s*(.+)/i);
  if (legacy?.[1]) return legacy[1].trim().slice(0, 120);
  return "Paystack subscription";
}

function inferCadence(haystack: string): BillingCadence {
  if (/\bmonthly\b/i.test(haystack)) return "monthly";
  if (/\bweekly\b/i.test(haystack)) return "weekly";
  if (/\bquarterly\b/i.test(haystack)) return "quarterly";
  if (/\b(?:yearly|annual(?:ly)?)\b/i.test(haystack)) return "yearly";
  return "unknown";
}

/** paystack.com hosted payment / manage links when present */
function extractPaystackUrl(haystack: string): string | null {
  const urls = haystack.match(/https?:\/\/[^\s<>"')\]]+/gi);
  if (!urls?.length) return null;
  const hit = urls.find((u) => /paystack\.com/i.test(u));
  return hit ?? null;
}

export function tryParsePaystackTemplate(message: NormalizedEmail): SubscriptionDraft | null {
  if (!isPaystackFrom(message.from)) {
    return null;
  }

  const hay = emailHaystack(message);
  const nextBillingDate = extractFirstBillingDateYmd(hay);
  if (!nextBillingDate) {
    return null;
  }

  const money = extractNgnAmount(hay);
  const name = paystackDisplayName(hay, message.subject);
  const normalizedName = normalizeServiceName(name);

  return {
    name,
    normalizedName,
    nextBillingDate,
    cancelUrl: extractPaystackUrl(hay),
    provider: name,
    amount: money?.amount ?? null,
    currency: money?.currency ?? null,
    billingCadence: inferCadence(hay),
  };
}
