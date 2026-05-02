import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthAvatarUrl, getAuthDisplayName } from "@/lib/auth/userMetadata";
import * as userRepo from "@/repositories/user.repository";
import { redirect } from "next/navigation";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await userRepo.getProfile(supabase, user.id);

  return (
    <DashboardShell
      email={user.email}
      avatarUrl={getAuthAvatarUrl(user)}
      displayName={getAuthDisplayName(user)}
      userPlan={profile?.plan ?? "free"}
    >
      {children}
    </DashboardShell>
  );
}
