import type { PricingCurrency } from "@/types/pricing";

/** Shown in API JSON; never include env names or Paystack internals here. */
export const CHECKOUT_PLAN_NOT_CONFIGURED_MESSAGE =
  "We can’t start checkout for this billing option right now. Try another currency or billing period, or check back shortly.";

/**
 * Resolve Paystack plan_code for SubI **Pro billing** (user’s app plan), not merchant subscription rows.
 * Configure one env per SKU; omit keys you do not sell yet — checkout should surface a friendly error.
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

  const envNameByKey: Record<string, string> = {
    NGN_MONTHLY: "PAYSTACK_SUBI_PRO_PLAN_NGN_MONTHLY",
    NGN_ANNUALLY: "PAYSTACK_SUBI_PRO_PLAN_NGN_ANNUALLY",
    USD_MONTHLY: "PAYSTACK_SUBI_PRO_PLAN_USD_MONTHLY",
    USD_ANNUALLY: "PAYSTACK_SUBI_PRO_PLAN_USD_ANNUALLY",
  };

  const map: Record<string, string | undefined> = {
    NGN_MONTHLY: process.env.PAYSTACK_SUBI_PRO_PLAN_NGN_MONTHLY,
    NGN_ANNUALLY: process.env.PAYSTACK_SUBI_PRO_PLAN_NGN_ANNUALLY,
    USD_MONTHLY: process.env.PAYSTACK_SUBI_PRO_PLAN_USD_MONTHLY,
    USD_ANNUALLY: process.env.PAYSTACK_SUBI_PRO_PLAN_USD_ANNUALLY,
  };

  const raw = map[key];
  const planCode = typeof raw === "string" ? raw.trim() : "";
  if (!planCode) {
    console.error(
      `[billing] SubI Pro Paystack plan not configured: set ${envNameByKey[key] ?? key} (${currency}, ${paystackInterval}).`,
    );
    return { error: CHECKOUT_PLAN_NOT_CONFIGURED_MESSAGE };
  }
  return { planCode };
}
