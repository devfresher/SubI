import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationRow } from "@/types";

export async function deletePendingForSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscriptionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("subscription_id", subscriptionId)
    .eq("status", "pending");
  if (error) throw error;
}

export async function insertNotification(
  supabase: SupabaseClient,
  row: {
    user_id: string;
    subscription_id: string;
    notify_at: string;
  },
): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    user_id: row.user_id,
    subscription_id: row.subscription_id,
    notify_at: row.notify_at,
    status: "pending",
    attempt_count: 0,
  });
  if (error) throw error;
}

export async function insertNotificationIfNotExists(
  supabase: SupabaseClient,
  row: {
    user_id: string;
    subscription_id: string;
    notify_at: string;
  },
): Promise<void> {
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", row.user_id)
    .eq("subscription_id", row.subscription_id)
    .eq("notify_at", row.notify_at)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return;
  await insertNotification(supabase, row);
}

export async function listDueNotifications(
  supabase: SupabaseClient,
  limit: number,
): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("status", "pending")
    .lte("notify_at", new Date().toISOString())
    .order("notify_at", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function updateNotificationStatus(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<
    Pick<NotificationRow, "status" | "attempt_count" | "last_attempt_at" | "provider_message_id">
  >,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
