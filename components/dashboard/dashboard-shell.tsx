"use client";

import { AppHeader } from "@/components/dashboard/app-header";
import type { UserPlan } from "@/types";

export function DashboardShell({
  email,
  avatarUrl,
  displayName,
  userPlan,
  children,
}: {
  email: string | undefined;
  avatarUrl?: string | null;
  displayName?: string | null;
  userPlan: UserPlan;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader brandHref="/dashboard" email={email} avatarUrl={avatarUrl} displayName={displayName} userPlan={userPlan} />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">{children}</main>
    </div>
  );
}
