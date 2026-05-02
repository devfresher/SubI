import { createClient } from "@/lib/supabase/server";
import { allowedReminderOffsetsForPlan } from "@/lib/plan/entitlements";
import { settingsPatchSchema } from "@/lib/validation/settings";
import * as userRepo from "@/repositories/user.repository";
import { reconcileNotificationsForUser } from "@/services/notification.service";
import type { UserPlan } from "@/types";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileBefore = await userRepo.getProfile(supabase, user.id);
  const plan: UserPlan = profileBefore?.plan ?? "free";

  const json: unknown = await request.json();
  const parsed = settingsPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { timezone, reminder_preferences } = parsed.data;
  const allowed = allowedReminderOffsetsForPlan(plan);
  if (!reminder_preferences.every((d) => allowed.has(d))) {
    return NextResponse.json(
      {
        error:
          plan === "free"
            ? "On Free, reminders are available 1 and 3 days before billing. Upgrade to Pro for more options."
            : "One or more reminder offsets are not allowed for your plan.",
      },
      { status: 400 },
    );
  }

  await userRepo.updateProfile(supabase, user.id, {
    timezone,
    reminder_preferences,
  });

  const profile = await userRepo.getProfile(supabase, user.id);
  if (profile) {
    await reconcileNotificationsForUser(supabase, user.id, profile);
  }

  return NextResponse.json({ ok: true });
}
