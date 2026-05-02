import { SubscriptionsHubClient } from "@/components/subscriptions/subscriptions-hub-client";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import * as userRepo from "@/repositories/user.repository";
import { createClient } from "@/lib/supabase/server";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await userRepo.getProfile(supabase, user.id);
  const all = await subscriptionRepo.listSubscriptionsForUser(supabase, user.id, "all");

  return (
    <SubscriptionsHubClient timeZone={profile?.timezone ?? "UTC"} initialAll={all} />
  );
}
