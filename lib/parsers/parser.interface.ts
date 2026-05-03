import type { BillingCadence } from "@/types";

export interface NormalizedEmail {
  messageId: string;
  subject: string;
  snippet: string;
  bodyText: string;
  from: string;
  /** Raw RFC 2047 / mailto+https list-unsubscribe value when present. */
  listUnsubscribe: string | null;
  replyTo: string | null;
  /** Bulk / list / junk — useful for newsletter gating. */
  precedence: string | null;
}

export interface SubscriptionDraft {
  name: string;
  normalizedName: string;
  nextBillingDate: string;
  cancelUrl: string | null;
  /** Merchant or service label (maps to `subscriptions.provider`). Not the mailbox provider. */
  provider: string | null;
  amount: number | null;
  currency: string | null;
  billingCadence: BillingCadence;
}

export interface SubscriptionParser {
  parse(message: NormalizedEmail): SubscriptionDraft | null;
}
