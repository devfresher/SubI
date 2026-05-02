import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow, UserPlan } from "@/types";

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<Pick<ProfileRow, "timezone" | "reminder_preferences" | "email">>,
): Promise<void> {
  const { error } = await supabase.from("users").update(patch).eq("id", userId);
  if (error) throw error;
}

/** Service-role client: webhook / admin reconciliation. */
export async function updateUserBilling(
  admin: SupabaseClient,
  userId: string,
  patch: Partial<{
    plan: UserPlan;
    paystack_customer_code: string | null;
    paystack_subscription_code: string | null;
    paystack_email_token: string | null;
    paystack_subscription_status: string | null;
  }>,
): Promise<void> {
  const cleaned = Object.fromEntries(
    (Object.entries(patch) as [string, UserPlan | string | null | undefined][]).filter(
      (entry): entry is [string, UserPlan | string | null] => entry[1] !== undefined,
    ),
  );
  if (Object.keys(cleaned).length === 0) return;
  const { error } = await admin.from("users").update(cleaned).eq("id", userId);
  if (error) throw error;
}

export async function getUserIdByEmailNormalized(
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const norm = email.trim().toLowerCase();
  if (!norm) return null;
  const { data, error } = await admin.from("users").select("id").eq("email", norm).maybeSingle();
  if (error) throw error;
  if (data?.id) return data.id as string;
  const { data: row2, error: err2 } = await admin
    .from("users")
    .select("id")
    .eq("email", email.trim())
    .maybeSingle();
  if (err2) throw err2;
  return (row2?.id as string | undefined) ?? null;
}
