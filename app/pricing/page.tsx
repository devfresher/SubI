import type { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PricingExperience } from "@/components/marketing/pricing-experience";
import { getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth/userMetadata";
import { createClient } from "@/lib/supabase/server";
import * as pricingRepo from "@/repositories/pricing.repository";
import * as userRepo from "@/repositories/user.repository";
import type { UserPlan } from "@/types";

export const metadata: Metadata = {
  title: "Pricing — SubI",
  description: "Free and Pro plans for SubI—multi-currency quotes, mailbox limits, and renewal reminders.",
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [plans, quotes] = await Promise.all([
    pricingRepo.listActivePricingPlans(supabase),
    pricingRepo.listActivePricingQuotes(supabase),
  ]);

  let currentPlan: UserPlan | null = null;
  let pricingAuth: {
    email: string | undefined;
    avatarUrl: string | null;
    displayName: string | null;
    plan: UserPlan;
  } | null = null;

  if (user) {
    const profile = await userRepo.getProfile(supabase, user.id);
    currentPlan = profile?.plan ?? "free";
    pricingAuth = {
      email: user.email,
      avatarUrl: getAuthAvatarUrl(user),
      displayName: getAuthDisplayName(user),
      plan: currentPlan,
    };
  }

  const paystackCheckoutReady = Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());

  return (
    <MarketingLayout auth={pricingAuth ?? undefined}>
      <PricingExperience
        plans={plans}
        quotes={quotes}
        currentPlan={currentPlan}
        isLoggedIn={!!user}
        paystackCheckoutReady={paystackCheckoutReady}
      />
    </MarketingLayout>
  );
}
