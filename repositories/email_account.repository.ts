import type { SupabaseClient } from "@supabase/supabase-js";
import { maxMailboxesForPlan } from "@/lib/plan/entitlements";
import type { EmailAccountRow, UserPlan } from "@/types";

export async function listEmailAccountsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<EmailAccountRow[]> {
  const { data, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EmailAccountRow[];
}

export async function getEmailAccountForUser(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<EmailAccountRow | null> {
  const { data, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", accountId)
    .maybeSingle();
  if (error) throw error;
  return data as EmailAccountRow | null;
}

export async function countEmailAccountsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("email_accounts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function findGmailByProviderEmail(
  supabase: SupabaseClient,
  userId: string,
  providerEmail: string,
): Promise<EmailAccountRow | null> {
  const normalized = providerEmail.trim().toLowerCase();
  const { data, error } = await supabase
    .from("email_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "gmail")
    .eq("provider_email", normalized)
    .maybeSingle();
  if (error) throw error;
  return data as EmailAccountRow | null;
}

export async function upsertGmailOAuthAccount(params: {
  supabase: SupabaseClient;
  userId: string;
  providerEmail: string;
  providerUserId: string | null;
  encryptedAccess: string;
  encryptedRefresh: string;
  tokenExpiresAt: string | null;
  plan: UserPlan;
}): Promise<{ ok: true; row: EmailAccountRow } | { ok: false; reason: "mailbox_limit" }> {
  const {
    supabase,
    userId,
    providerEmail,
    providerUserId,
    encryptedAccess,
    encryptedRefresh,
    tokenExpiresAt,
    plan,
  } = params;
  const normalized = providerEmail.trim().toLowerCase();
  const existingByEmail = await findGmailByProviderEmail(supabase, userId, normalized);
  if (existingByEmail) {
    const { data, error } = await supabase
      .from("email_accounts")
      .update({
        provider_user_id: providerUserId,
        encrypted_access_token: encryptedAccess,
        encrypted_refresh_token: encryptedRefresh,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingByEmail.id)
      .eq("user_id", userId)
      .select("*")
      .single();
    if (error) throw error;
    return { ok: true, row: data as EmailAccountRow };
  }

  const count = await countEmailAccountsForUser(supabase, userId);
  const maxMailboxes = maxMailboxesForPlan(plan);
  if (count >= maxMailboxes) {
    return { ok: false, reason: "mailbox_limit" };
  }

  const { data, error } = await supabase
    .from("email_accounts")
    .insert({
      user_id: userId,
      provider: "gmail",
      provider_email: normalized,
      provider_user_id: providerUserId,
      encrypted_access_token: encryptedAccess,
      encrypted_refresh_token: encryptedRefresh,
      token_expires_at: tokenExpiresAt,
    })
    .select("*")
    .single();
  if (error) throw error;
  return { ok: true, row: data as EmailAccountRow };
}

export async function deleteEmailAccountForUser(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<void> {
  const { error } = await supabase.from("email_accounts").delete().eq("id", accountId).eq("user_id", userId);
  if (error) throw error;
}

export async function updateGmailMeta(
  supabase: SupabaseClient,
  accountId: string,
  userId: string,
  patch: Partial<
    Pick<
      EmailAccountRow,
      | "gmail_history_id"
      | "last_sync_at"
      | "encrypted_access_token"
      | "token_expires_at"
      | "sync_in_progress"
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from("email_accounts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("user_id", userId);
  if (error) throw error;
}

/** Latest Gmail mailbox by created_at (compat helper). */
export async function getPrimaryGmailAccount(
  supabase: SupabaseClient,
  userId: string,
): Promise<EmailAccountRow | null> {
  const list = await listEmailAccountsForUser(supabase, userId);
  const gmail = list
    .filter((a) => a.provider === "gmail")
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return gmail[0] ?? null;
}
