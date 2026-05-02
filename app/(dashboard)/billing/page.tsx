import { BillingClient } from "@/components/billing/billing-client";
import { createClient } from "@/lib/supabase/server";
import * as billingRepo from "@/repositories/billing.repository";
import * as userRepo from "@/repositories/user.repository";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await userRepo.getProfile(supabase, user.id);
  const ledger = await billingRepo.listLedgerForUser(supabase, user.id, 100);

  return (
    <div className="space-y-10">
      <div className="border-b border-border/50 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Account</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Billing</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Your SubI plan, payments, and subscription activity in one view. Renewals and saved cards stay on our secure billing page — updates here typically follow within moments.
        </p>
      </div>

      <BillingClient
        ledger={ledger}
        plan={(profile?.plan ?? "free") as "free" | "pro"}
        paystackStatus={profile?.paystack_subscription_status ?? null}
      />
    </div>
  );
}
