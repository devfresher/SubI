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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Billing</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted sm:text-base">
          See your plan, payments, and subscription changes in one place. Renewal and card updates happen on our secure billing page — your plan here updates shortly after changes complete.
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
