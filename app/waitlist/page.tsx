import type { Metadata } from "next";
import { WaitlistShell } from "./waitlist-shell";
import { isPreLaunchWaitlistEnabled } from "@/lib/config/preLaunch";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Early access · SubI",
  description: "Join the waitlist for SubI. Renewals in one place, optional inbox hints, timezone-aware reminders.",
  robots: { index: false, follow: false },
};

export default function WaitlistPage() {
  if (!isPreLaunchWaitlistEnabled()) {
    redirect("/");
  }

  return <WaitlistShell />;
}
