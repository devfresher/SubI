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
    <div className="space-y-12">
      <div className="border-b border-border/50 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Account</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Connect mailboxes, tune reminders, and keep renewal emails aligned with where you actually live — all in one
          calm workspace.
        </p>
      </div>

      <div className="mx-auto flex max-w-3xl flex-col gap-14">
        <Suspense fallback={<div className="h-36 animate-pulse rounded-2xl bg-gold-dim/20" aria-hidden />}>
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
    </div>
  );
}
