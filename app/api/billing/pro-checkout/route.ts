import { resolveProPaystackPlanCode } from "@/lib/billing/paystackPlanCodes";
import { createClient } from "@/lib/supabase/server";
import { proCheckoutBodySchema } from "@/lib/validation/proCheckout";
import * as pricingRepo from "@/repositories/pricing.repository";
import * as userRepo from "@/repositories/user.repository";
import type { BillingInterval, PricingCurrency } from "@/types/pricing";
import { NextResponse } from "next/server";

function catalogIntervalFromPaystack(i: "monthly" | "annually"): BillingInterval {
  return i === "monthly" ? "month" : "year";
}

/**
 * Starts Paystack Subscribe flow for SubI **Pro** (billing for the SubI account).
 * API path uses `billing` to avoid overload with merchant `/api/subscriptions/*` (renewal tracking).
 */

function paystackInitialize(params: {
  secretKey: string;
  email: string;
  subiUserId: string;
  /** Subunit string (kobo / cents); Paystack expects a string. Required even when `plan` is set or some regions return "Invalid amount". */
  amountSubunits: string;
  currency: PricingCurrency;
  planCode: string;
  callbackUrl: string;
}) {
  return fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountSubunits,
      currency: params.currency,
      plan: params.planCode,
      callback_url: params.callbackUrl,
      metadata: { subi_user_id: params.subiUserId, subi_product: "subi_pro_checkout" },
    }),
  });
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "Paystack secret not configured (PAYSTACK_SECRET_KEY)." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await userRepo.getProfile(supabase, user.id);
  if ((profile?.plan ?? "free") === "pro") {
    return NextResponse.json({ error: "Already on SubI Pro." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = proCheckoutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const currency = parsed.data.currency as PricingCurrency;
  const paystackInterval = parsed.data.billingInterval;

  const resolved = resolveProPaystackPlanCode({ currency, paystackInterval });
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 500 });
  }

  const catalogInterval = catalogIntervalFromPaystack(paystackInterval);
  const quotes = await pricingRepo.listActivePricingQuotes(supabase);
  const quote = quotes.find(
    (q) => q.plan_key === "pro" && q.currency === currency && q.billing_interval === catalogInterval,
  );
  if (!quote || quote.unit_amount_minor < 1) {
    return NextResponse.json(
      { error: "No active Pro price in the catalog for this currency and billing period." },
      { status: 400 },
    );
  }

  const origin = new URL(req.url).origin.replace(/\/$/, "");
  const callbackUrl = `${origin}/dashboard?subiBilling=paystack`;

  const init = await paystackInitialize({
    secretKey: secret,
    email: user.email,
    subiUserId: user.id,
    amountSubunits: String(quote.unit_amount_minor),
    currency,
    planCode: resolved.planCode,
    callbackUrl,
  });

  const payJson = (await init.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; access_code?: string; reference?: string };
  };

  if (!init.ok || !payJson.status || !payJson.data?.authorization_url) {
    return NextResponse.json(
      { error: payJson.message ?? "Paystack initialization failed.", detail: payJson },
      { status: 502 },
    );
  }

  return NextResponse.json({
    authorizationUrl: payJson.data.authorization_url,
    reference: payJson.data.reference,
  });
}
