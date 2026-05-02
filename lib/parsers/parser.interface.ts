export interface NormalizedEmail {
  messageId: string;
  subject: string;
  snippet: string;
  bodyText: string;
  from?: string;
}

export interface SubscriptionDraft {
  name: string;
  normalizedName: string;
  nextBillingDate: string;
  cancelUrl: string | null;
  provider: string | null;
}

export interface SubscriptionParser {
  parse(message: NormalizedEmail): SubscriptionDraft | null;
}
