export type PricingCurrency = "USD" | "NGN";

export type BillingInterval = "month" | "year";

export type PricingPlanKey = "free" | "pro";

export type PricingPlanPublic = {
  plan_key: PricingPlanKey;
  display_name: string;
  subtitle: string | null;
  badge_label: string | null;
  sort_order: number;
  feature_bullets: string[];
};

export type PricingQuotePublic = {
  plan_key: PricingPlanKey;
  currency: PricingCurrency;
  billing_interval: BillingInterval;
  unit_amount_minor: number;
  compare_at_amount_minor: number | null;
};
