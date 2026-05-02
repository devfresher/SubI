import type { PricingCurrency } from "@/types/pricing";

/**
 * Resolve Paystack plan_code for SubI **Pro billing** (user’s app plan), not merchant subscription rows.
 * Configure one env per SKU; omit keys you do not sell yet — checkout returns a clear configuration error.
 */
export function resolveProPaystackPlanCode(params: {
  currency: PricingCurrency;
  paystackInterval: "monthly" | "annually";
}): { planCode: string } | { error: string } {
  const { currency, paystackInterval } = params;
  const key =
    currency === "NGN"
      ? paystackInterval === "monthly"
        ? "NGN_MONTHLY"
        : "NGN_ANNUALLY"
      : paystackInterval === "monthly"
        ? "USD_MONTHLY"
        : "USD_ANNUALLY";

  const map: Record<string, string | undefined> = {
    NGN_MONTHLY: process.env.PAYSTACK_SUBI_PRO_PLAN_NGN_MONTHLY,
    NGN_ANNUALLY: process.env.PAYSTACK_SUBI_PRO_PLAN_NGN_ANNUALLY,
    USD_MONTHLY: process.env.PAYSTACK_SUBI_PRO_PLAN_USD_MONTHLY,
    USD_ANNUALLY: process.env.PAYSTACK_SUBI_PRO_PLAN_USD_ANNUALLY,
  };

  const raw = map[key];
  const planCode = typeof raw === "string" ? raw.trim() : "";
  if (!planCode) {
    return {
      error: `Missing PAYSTACK_SUBI_PRO_PLAN env for ${currency} ${paystackInterval}. Create the plan in Paystack and paste the plan_code.`,
    };
  }
  return { planCode };
}
