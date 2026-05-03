import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BillingCadence,
  EmailAccountMailboxSummary,
  SubscriptionRow,
} from "@/types";
import type { SubscriptionDraft } from "@/lib/parsers/parser.interface";
import * as emailAccountRepo from "@/repositories/email_account.repository";

function attachMailboxes(
  subs: SubscriptionRow[],
  accounts: { id: string; provider: string; provider_email: string }[],
): SubscriptionRow[] {
  const byId = new Map(accounts.map((a) => [a.id, a as EmailAccountMailboxSummary]));
  return subs.map((s) => ({
    ...s,
    mailbox: s.email_account_id ? (byId.get(s.email_account_id) ?? null) : null,
  }));
}

export type SubscriptionListScope = "active" | "ignored" | "all";

export async function listSubscriptionsForUser(
  supabase: SupabaseClient,
  userId: string,
  scope: SubscriptionListScope = "active",
): Promise<SubscriptionRow[]> {
  let q = supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("next_billing_date", { ascending: true });
  if (scope === "active") {
    q = q.eq("status", "active");
  } else if (scope === "ignored") {
    q = q.eq("status", "ignored");
  }
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as SubscriptionRow[];
  const accounts = await emailAccountRepo.listEmailAccountsForUser(supabase, userId);
  const summaries: EmailAccountMailboxSummary[] = accounts.map((a) => ({
    id: a.id,
    provider: a.provider,
    provider_email: a.provider_email,
  }));
  return attachMailboxes(rows, summaries);
}

export async function getSubscriptionForUser(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("id", subscriptionId)
    .maybeSingle();
  if (error) throw error;
  return data as SubscriptionRow | null;
}

export async function updateSubscriptionForUser(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
  patch: Partial<Pick<SubscriptionRow, "status" | "next_billing_date">>,
): Promise<SubscriptionRow> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("id", subscriptionId)
    .select("*")
    .single();
  if (error) throw error;
  return data as SubscriptionRow;
}

export async function findActiveByNormalizedName(
  supabase: SupabaseClient,
  userId: string,
  normalizedName: string,
): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("normalized_name", normalizedName)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  return data as SubscriptionRow | null;
}

export async function insertSubscriptionFromDraft(
  supabase: SupabaseClient,
  userId: string,
  draft: SubscriptionDraft,
  sourceMessageId: string,
  emailAccountId: string,
): Promise<SubscriptionRow | null> {
  const existing = await findActiveByNormalizedName(supabase, userId, draft.normalizedName);
  if (existing) {
    return null;
  }
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      name: draft.name,
      normalized_name: draft.normalizedName,
      provider: draft.provider,
      email_account_id: emailAccountId,
      next_billing_date: draft.nextBillingDate,
      cancel_url: draft.cancelUrl,
      amount: draft.amount ?? null,
      currency: draft.currency ?? null,
      billing_cadence: draft.billingCadence ?? "unknown",
      status: "active",
      source: "gmail",
      source_message_id: sourceMessageId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SubscriptionRow;
}

export interface ManualSubscriptionInput {
  name: string;
  normalizedName: string;
  nextBillingDate: string;
  cancelUrl: string | null;
  notes: string | null;
  amount: number | null;
  currency: string | null;
  billingCadence: BillingCadence;
  reminderOffsets: number[] | null;
}

export async function insertManualSubscription(
  supabase: SupabaseClient,
  userId: string,
  input: ManualSubscriptionInput,
): Promise<SubscriptionRow> {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: userId,
      name: input.name,
      normalized_name: input.normalizedName,
      provider: "manual",
      next_billing_date: input.nextBillingDate,
      cancel_url: input.cancelUrl,
      notes: input.notes,
      amount: input.amount,
      currency: input.currency,
      billing_cadence: input.billingCadence,
      reminder_offsets: input.reminderOffsets,
      status: "active",
      source: "manual",
      source_message_id: null,
      email_account_id: null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SubscriptionRow;
}

export async function listActiveSubscriptionsWithDate(
  supabase: SupabaseClient,
  userId: string,
): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []) as SubscriptionRow[];
}
