import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types";
import { computeNotificationTimes } from "@/lib/utils/reminders";
import * as notificationRepo from "@/repositories/notification.repository";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import { getResend, reminderEmailHtml } from "@/lib/email/resend.client";

export async function reconcileNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
  profile: ProfileRow,
): Promise<void> {
  const subs = await subscriptionRepo.listActiveSubscriptionsWithDate(supabase, userId);
  for (const sub of subs) {
    await notificationRepo.deletePendingForSubscription(supabase, userId, sub.id);
    const offsets =
      sub.reminder_offsets && sub.reminder_offsets.length > 0
        ? sub.reminder_offsets
        : profile.reminder_preferences?.length
          ? profile.reminder_preferences
          : [1, 3];
    const times = computeNotificationTimes(sub.next_billing_date, profile.timezone, offsets);
    for (const t of times) {
      await notificationRepo.insertNotificationIfNotExists(supabase, {
        user_id: userId,
        subscription_id: sub.id,
        notify_at: t.toISOString(),
      });
    }
  }
}

export async function sendDueReminderEmail(params: {
  to: string;
  subscriptionName: string;
  nextBillingDate: string;
  manageUrl: string | null;
}): Promise<{ id: string | null }> {
  const from = process.env.RESEND_FROM;
  if (!from) {
    throw new Error("RESEND_FROM is not set");
  }
  const resend = getResend();
  const html = reminderEmailHtml({
    subscriptionName: params.subscriptionName,
    nextBillingDate: params.nextBillingDate,
    manageUrl: params.manageUrl,
  });
  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `Reminder: ${params.subscriptionName} renews soon`,
    html,
  });
  if (error) throw error;
  return { id: data?.id ?? null };
}
