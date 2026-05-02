import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BillingInterval,
  PricingCurrency,
  PricingPlanKey,
  PricingPlanPublic,
  PricingQuotePublic,
} from "@/types/pricing";

function parseBullets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

export async function listActivePricingPlans(supabase: SupabaseClient): Promise<PricingPlanPublic[]> {
  const { data, error } = await supabase
    .from("pricing_plans")
    .select("plan_key, display_name, subtitle, badge_label, sort_order, feature_bullets")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    plan_key: row.plan_key as PricingPlanKey,
    display_name: row.display_name,
    subtitle: row.subtitle,
    badge_label: row.badge_label,
    sort_order: row.sort_order,
    feature_bullets: parseBullets(row.feature_bullets),
  }));
}

export async function listActivePricingQuotes(supabase: SupabaseClient): Promise<PricingQuotePublic[]> {
  const { data, error } = await supabase
    .from("pricing_quotes")
    .select("plan_key, currency, billing_interval, unit_amount_minor, compare_at_amount_minor")
    .eq("is_active", true);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    plan_key: row.plan_key as PricingPlanKey,
    currency: row.currency as PricingCurrency,
    billing_interval: row.billing_interval as BillingInterval,
    unit_amount_minor: row.unit_amount_minor,
    compare_at_amount_minor: row.compare_at_amount_minor,
  }));
}
