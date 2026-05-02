import { createClient } from "@/lib/supabase/server";
import * as userRepo from "@/repositories/user.repository";
import { NextResponse } from "next/server";

/**
 * Proxies Paystack-hosted subscription manage page (card updates, cancellation path on Paystack).
 */

export async function GET() {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Billing isn’t available on this deployment yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await userRepo.getProfile(supabase, user.id);
  const code = profile?.paystack_subscription_code?.trim();
  if (!code) {
    return NextResponse.json(
      { error: "No active subscription linked yet. If you recently upgraded, wait a minute and refresh." },
      { status: 400 },
    );
  }

  const res = await fetch(`https://api.paystack.co/subscription/${encodeURIComponent(code)}/manage/link`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const json = (await res.json()) as { status?: boolean; message?: string; data?: { link?: string } };
  const link = json.data?.link;

  if (!res.ok || !json.status || !link) {
    return NextResponse.json(
      { error: json.message ?? "Couldn’t open the billing portal. Try again shortly.", detail: json },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: link });
}
