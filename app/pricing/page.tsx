import type { Metadata } from "next";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { PricingExperience } from "@/components/marketing/pricing-experience";
import { getMarketingLayoutAuth } from "@/lib/auth/marketingLayoutAuth";
import { createClient } from "@/lib/supabase/server";
import * as pricingRepo from "@/repositories/pricing.repository";
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
  let pricingAuth = undefined;

  if (user) {
    pricingAuth = await getMarketingLayoutAuth(supabase, user);
    currentPlan = pricingAuth?.plan ?? "free";
  }

  const paystackCheckoutReady = Boolean(process.env.PAYSTACK_SECRET_KEY?.trim());

  return (
    <MarketingLayout auth={pricingAuth}>
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
