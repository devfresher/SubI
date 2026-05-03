import { extractFirstBillingDateYmd } from "@/lib/parsers/dateExtract";
import { emailHaystack } from "@/lib/parsers/emailHaystack";
import { displayNameFromFrom, primaryFromEmail } from "@/lib/parsers/fromAddress";
import type { NormalizedEmail, SubscriptionDraft } from "@/lib/parsers/parser.interface";
import { normalizeServiceName } from "@/lib/utils/strings";

function isStripeFrom(fromHeader: string): boolean {
  const e = primaryFromEmail(fromHeader);
  return /@(?:.*\.)?stripe\.com$/i.test(e);
}

function parseAmountUsdToNumber(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "");
  const n = Number.parseFloat(cleaned);
  if (Number.isFinite(n) && n > 0) {
    return Math.round(n * 100) / 100;
  }
  return null;
}

function extractUsdAmount(haystack: string): { amount: number; currency: string } | null {
  const m =
    haystack.match(/\$\s*([\d,]+\.?\d{0,2})\b/) ||
    haystack.match(/\bUSD\s*([\d,]+\.?\d{0,2})\b/i);
  if (!m?.[1]) return null;
  const amount = parseAmountUsdToNumber(m[1]);
  if (amount == null) return null;
  return { amount, currency: "USD" };
}

function stripeMerchantFromSubject(subject: string): string | null {
  const s = subject.replace(/^(re|fwd?):\s*/gi, "").trim();
  const receipt = s.match(/receipt\s+from\s+(.+?)(?:\s+[#]|$)/i);
  if (receipt?.[1]) return receipt[1].trim().slice(0, 120);
  const renews = s.match(/subscription\s+to\s+(.+?)\s+renew/i);
  if (renews?.[1]) return renews[1].trim().slice(0, 120);
  const inv = s.match(/invoice\s+from\s+(.+?)(?:\s+[#]|$)/i);
  if (inv?.[1]) return inv[1].trim().slice(0, 120);
  return null;
}

/** Stripe customer portal / billing links — avoid generic unsubscribe footers. */
function extractStripeManageUrl(haystack: string): string | null {
  const urls = haystack.match(/https?:\/\/[^\s<>"')\]]+/gi);
  if (!urls?.length) return null;
  const hit = urls.find((u) => /billing\.stripe\.com|stripe\.com\/billing|stripe\.com\/customer|stripe\.com\/invoice/i.test(u));
  return hit ?? null;
}

/** Try Stripe-originated subscription or receipt emails. */
export function tryParseStripeTemplate(message: NormalizedEmail): SubscriptionDraft | null {
  if (!isStripeFrom(message.from)) {
    return null;
  }

  const hay = emailHaystack(message);
  const merchant =
    stripeMerchantFromSubject(message.subject) ??
    displayNameFromFrom(message.from) ??
    "Subscription";

  const nextBillingDate = extractFirstBillingDateYmd(hay);
  if (!nextBillingDate) {
    return null;
  }

  const money = extractUsdAmount(hay);
  const cancelUrl = extractStripeManageUrl(hay);
  const name = merchant.slice(0, 120);
  const normalizedName = normalizeServiceName(name);

  return {
    name,
    normalizedName,
    nextBillingDate,
    cancelUrl,
    provider: merchant,
    amount: money?.amount ?? null,
    currency: money?.currency ?? null,
    billingCadence: "unknown",
  };
}
