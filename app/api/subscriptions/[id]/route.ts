import { createClient } from "@/lib/supabase/server";
import { subscriptionPatchSchema } from "@/lib/validation/subscriptionPatch";
import * as notificationRepo from "@/repositories/notification.repository";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import * as userRepo from "@/repositories/user.repository";
import { reconcileNotificationsForUser } from "@/services/notification.service";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json: unknown = await request.json();
  const parsed = subscriptionPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  const existing = await subscriptionRepo.getSubscriptionForUser(supabase, user.id, params.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (body.status === "active" && existing.status === "ignored") {
    const conflict = await subscriptionRepo.findActiveByNormalizedName(
      supabase,
      user.id,
      existing.normalized_name,
    );
    if (conflict) {
      return NextResponse.json(
        {
          error: "duplicate",
          message:
            "You already have an active subscription with this name. Remove or rename the other one first.",
        },
        { status: 409 },
      );
    }
  }

  const patch: { status?: "active" | "ignored"; next_billing_date?: string } = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.next_billing_date !== undefined) patch.next_billing_date = body.next_billing_date;

  const row = await subscriptionRepo.updateSubscriptionForUser(supabase, user.id, params.id, patch);
  const profile = await userRepo.getProfile(supabase, user.id);

  if (row.status === "ignored") {
    await notificationRepo.deletePendingForSubscription(supabase, user.id, row.id);
  } else if (profile) {
    await reconcileNotificationsForUser(supabase, user.id, profile);
  }

  return NextResponse.json({ subscription: row });
}
