import type { MarketingLayoutAuth } from "@/components/marketing/marketing-layout";
import { getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth/userMetadata";
import * as userRepo from "@/repositories/user.repository";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function getMarketingLayoutAuth(
  supabase: SupabaseClient,
  user: User | null,
): Promise<MarketingLayoutAuth | undefined> {
  if (!user) return undefined;
  const profile = await userRepo.getProfile(supabase, user.id);
  return {
    email: user.email,
    avatarUrl: getAuthAvatarUrl(user),
    displayName: getAuthDisplayName(user),
    plan: profile?.plan ?? "free",
  };
}
