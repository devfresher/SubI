import { AccountDangerZone } from "@/components/settings/account-danger-zone";
import { SettingsMailboxes } from "@/components/settings/settings-mailboxes";
import * as emailAccountRepo from "@/repositories/email_account.repository";
import * as userRepo from "@/repositories/user.repository";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { SettingsForm } from "./settings-form";

const ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Africa/Lagos",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await userRepo.getProfile(supabase, user.id);
  const mailboxes = await emailAccountRepo.listEmailAccountsForUser(supabase, user.id);
  const plan = profile?.plan ?? "free";

  return (
    <div className="mx-auto max-w-2xl space-y-12">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-xl text-sm text-muted sm:text-base">
          Mailboxes, timezone, and how early we remind you before renewals.
        </p>
      </div>

      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-gold-dim/20" aria-hidden />}>
        <SettingsMailboxes initialAccounts={mailboxes} plan={plan} />
      </Suspense>

      <SettingsForm
        timezones={ZONES}
        initialTimezone={profile?.timezone ?? "UTC"}
        initialReminders={profile?.reminder_preferences ?? [1, 3]}
        plan={plan}
      />

      <AccountDangerZone email={user.email} />
    </div>
  );
}
