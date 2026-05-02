import type { SupabaseClient } from "@supabase/supabase-js";
import type { BillingLedgerEntryRow } from "@/types";

/** Insert ledger row if dedupe_key is new; ignores unique violation for idempotent replays. */
export async function tryInsertLedgerEntry(
  admin: SupabaseClient,
  row: Omit<BillingLedgerEntryRow, "id" | "created_at">,
): Promise<"inserted" | "duplicate"> {
  const { error } = await admin.from("billing_ledger_entries").insert({
    user_id: row.user_id,
    dedupe_key: row.dedupe_key,
    event_type: row.event_type,
    kind: row.kind,
    status: row.status,
    amount_minor: row.amount_minor,
    currency: row.currency,
    reference: row.reference,
    invoice_code: row.invoice_code,
    subscription_code: row.subscription_code,
    occurred_at: row.occurred_at,
    summary: row.summary,
  });
  const dup =
    error?.code === "23505" ||
    (typeof error?.message === "string" && /duplicate key|unique constraint/i.test(error.message));
  if (dup) return "duplicate";
  if (error) throw error;
  return "inserted";
}

export async function listLedgerForUser(
  supabase: SupabaseClient,
  userId: string,
  limit = 100,
): Promise<BillingLedgerEntryRow[]> {
  const { data, error } = await supabase
    .from("billing_ledger_entries")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as BillingLedgerEntryRow[];
}
