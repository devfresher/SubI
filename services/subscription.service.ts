import type { SupabaseClient } from "@supabase/supabase-js";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import type { SubscriptionRow } from "@/types";

export function groupByNormalizedName(rows: SubscriptionRow[]): Map<string, SubscriptionRow[]> {
  const m = new Map<string, SubscriptionRow[]>();
  for (const r of rows) {
    const key = r.normalized_name;
    const list = m.get(key) ?? [];
    list.push(r);
    m.set(key, list);
  }
  return m;
}

export async function listActiveGrouped(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ rows: SubscriptionRow[]; grouped: Map<string, SubscriptionRow[]> }> {
  const rows = await subscriptionRepo.listSubscriptionsForUser(supabase, userId);
  return { rows, grouped: groupByNormalizedName(rows) };
}
