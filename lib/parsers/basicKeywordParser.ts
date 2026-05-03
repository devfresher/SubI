import { extractFirstBillingDateYmd } from "@/lib/parsers/dateExtract";
import { emailHaystack } from "@/lib/parsers/emailHaystack";
import { displayNameFromFrom } from "@/lib/parsers/fromAddress";
import type { NormalizedEmail, SubscriptionDraft, SubscriptionParser } from "@/lib/parsers/parser.interface";
import { normalizeServiceName } from "@/lib/utils/strings";

const KEYWORD_RE = /subscription|billing|trial|renewal/i;

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

/** Penalise marketing unsubscribe / preference links when scoring “manage” URLs. */
const URL_UNSUB_OR_DIGEST = /unsubscribe|email-preferences|preferences\/email|\/pref(erences)?\b|one-click|list-manage/i;
const URL_BILLING_POSITIVE =
  /billing|invoice|account|manage|subscription|customer|portal|charge|payment|stripe|paystack|paddle|paypal/i;

function scoreManageUrl(u: string): number {
  let s = 0;
  if (URL_UNSUB_OR_DIGEST.test(u)) s -= 4;
  if (URL_BILLING_POSITIVE.test(u)) s += 3;
  return s;
}

function extractCancelUrl(haystack: string): string | null {
  const urls = haystack.match(URL_RE);
  if (!urls?.length) return null;
  const scored = urls.map((u) => ({ u, s: scoreManageUrl(u) }));
  scored.sort((a, b) => b.s - a.s);
  const best = scored[0];
  if (!best || best.s < 0) {
    const fallback = urls.find((x) => !URL_UNSUB_OR_DIGEST.test(x));
    return fallback ?? null;
  }
  return best.u;
}

function subjectName(subject: string): string {
  const s = subject.replace(/^(re|fwd?):\s*/gi, "").trim();
  const dash = s.split(/\s+[-–—]\s+/)[0]?.trim();
  return (dash ?? s).slice(0, 120) || "Subscription";
}

export class BasicKeywordParser implements SubscriptionParser {
  parse(message: NormalizedEmail): SubscriptionDraft | null {
    const haystack = emailHaystack(message);
    if (!KEYWORD_RE.test(haystack)) {
      return null;
    }
    const nextBillingDate = extractFirstBillingDateYmd(haystack);
    if (!nextBillingDate) {
      return null;
    }
    const name = subjectName(message.subject);
    const normalizedName = normalizeServiceName(name);
    const merchantLabel = displayNameFromFrom(message.from);
    return {
      name,
      normalizedName,
      nextBillingDate,
      cancelUrl: extractCancelUrl(haystack),
      provider: merchantLabel,
      amount: null,
      currency: null,
      billingCadence: "unknown",
    };
  }
}
