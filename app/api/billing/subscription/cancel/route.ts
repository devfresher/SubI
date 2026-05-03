import { createClient } from "@/lib/supabase/server";
import * as userRepo from "@/repositories/user.repository";
import { NextResponse } from "next/server";

/**
 * Ends SubI Pro on Paystack (subscription/disable). Final state syncs via webhooks.
 */

export async function POST() {
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
  const token = profile?.paystack_email_token?.trim();
  if (!code || !token) {
    return NextResponse.json(
      { error: "No subscription found yet. Finish upgrade from Pricing, then try again in a minute." },
      { status: 400 },
    );
  }

  const res = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code, token }),
  });

  const body = (await res.json()) as { status?: boolean; message?: string };

  if (!res.ok || body.status === false) {
    console.error("[billing] Paystack subscription disable failed:", body.message, body);
    return NextResponse.json(
      {
        error:
          "We couldn’t complete that billing change. Try again in a moment, or open the billing portal from your subscription email.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, message: body.message ?? "Subscription disable requested." });
}
