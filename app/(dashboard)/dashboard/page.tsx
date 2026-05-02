import { DashboardClient } from "@/components/dashboard/dashboard-client";
import * as emailAccountRepo from "@/repositories/email_account.repository";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import * as userRepo from "@/repositories/user.repository";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await userRepo.getProfile(supabase, user.id);
  const tz = profile?.timezone ?? "UTC";
  const subs = await subscriptionRepo.listSubscriptionsForUser(supabase, user.id);
  const gmail = await emailAccountRepo.getPrimaryGmailAccount(supabase, user.id);

  return (
    <DashboardClient
      initialSubscriptions={subs}
      timeZone={tz}
      hasGmail={!!gmail}
    />
  );
}
