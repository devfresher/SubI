import { createClient } from "@/lib/supabase/server";
import { manualSubscriptionSchema } from "@/lib/validation/manualSubscription";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import * as userRepo from "@/repositories/user.repository";
import { reconcileNotificationsForUser } from "@/services/notification.service";
import { normalizeServiceName } from "@/lib/utils/strings";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json: unknown = await request.json();
  const parsed = manualSubscriptionSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const normalizedName = normalizeServiceName(body.name);

  const duplicate = await subscriptionRepo.findActiveByNormalizedName(
    supabase,
    user.id,
    normalizedName,
  );
  if (duplicate) {
    return NextResponse.json(
      {
        error: "duplicate",
        message: "You already track a subscription with this name.",
        normalized_name: normalizedName,
      },
      { status: 409 },
    );
  }

  const cancelUrl =
    body.cancel_url && body.cancel_url.length > 0 ? body.cancel_url : null;
  const notes = body.notes && body.notes.length > 0 ? body.notes : null;
  const currency =
    body.currency && body.currency.length === 3 ? body.currency : null;
  const reminderOffsets =
    body.reminder_offsets && body.reminder_offsets.length > 0
      ? body.reminder_offsets
      : null;

  const row = await subscriptionRepo.insertManualSubscription(supabase, user.id, {
    name: body.name.trim(),
    normalizedName,
    nextBillingDate: body.next_billing_date,
    cancelUrl,
    notes,
    amount: body.amount ?? null,
    currency,
    billingCadence: body.billing_cadence,
    reminderOffsets,
  });

  const profile = await userRepo.getProfile(supabase, user.id);
  if (profile) {
    await reconcileNotificationsForUser(supabase, user.id, profile);
  }

  return NextResponse.json({ subscription: row });
}
