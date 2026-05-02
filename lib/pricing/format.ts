import type { PricingCurrency } from "@/types/pricing";

const USD_LOCALE = "en-US";
const NGN_LOCALE = "en-NG";

/** Format integer minor units (cents / kobo) for display. */
export function formatMoneyAmount(currency: PricingCurrency, unitAmountMinor: number): string {
  const major = unitAmountMinor / 100;
  return new Intl.NumberFormat(currency === "NGN" ? NGN_LOCALE : USD_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "NGN" ? 0 : 0,
  }).format(major);
}

/** Per-month figure when paying yearly (minor units -> formatted string). */
export function formatPerMonthFromYearly(currency: PricingCurrency, yearlyMinor: number): string {
  const perMonthMinor = Math.round(yearlyMinor / 12);
  return formatMoneyAmount(currency, perMonthMinor);
}
