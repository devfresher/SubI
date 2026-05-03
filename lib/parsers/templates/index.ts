import type { NormalizedEmail, SubscriptionDraft } from "@/lib/parsers/parser.interface";
import { tryParsePaystackTemplate } from "@/lib/parsers/templates/paystackReceipt";
import { tryParseStripeTemplate } from "@/lib/parsers/templates/stripeReceipt";

/** Deterministic parsers for known billing senders (order: most specific first). */
export function tryBillingTemplates(message: NormalizedEmail): SubscriptionDraft | null {
  return tryParseStripeTemplate(message) ?? tryParsePaystackTemplate(message);
}
