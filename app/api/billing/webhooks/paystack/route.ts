import { verifyPaystackWebhookSignature } from "@/lib/billing/paystackSignature";
import { buildWebhookIdempotencyKey } from "@/lib/billing/webhookIdempotencyKey";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  PAYSTACK_BILLING_HANDLED_EVENTS,
  buildReceiptExcerpt,
  processPaystackWebhookEvent,
} from "@/services/billingWebhook.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function reconcileReceipt(admin: ReturnType<typeof createServiceRoleClient>, idempotencyKey: string) {
  await admin
    .from("billing_webhook_receipts")
    .update({ processed_ok: true, processed_at: new Date().toISOString(), last_error: null })
    .eq("idempotency_key", idempotencyKey);
}

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Paystack is not configured on this deployment." }, { status: 503 });
  }

  const rawUtf8 = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawUtf8, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let parsed: { event?: string; data?: unknown };
  try {
    parsed = JSON.parse(rawUtf8) as { event?: string; data?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const eventName = typeof parsed.event === "string" ? parsed.event.trim() : "";
  if (!eventName) {
    return NextResponse.json({ error: "Missing event name." }, { status: 400 });
  }

  const dataUnknown = parsed.data;

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Server missing SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  const dataObj =
    dataUnknown && typeof dataUnknown === "object" && dataUnknown !== null
      ? (dataUnknown as Record<string, unknown>)
      : {};

  const idempotencyKey = buildWebhookIdempotencyKey(eventName, dataUnknown);
  const excerpt = buildReceiptExcerpt(eventName, dataObj);

  const { error: insErr } = await admin.from("billing_webhook_receipts").insert({
    idempotency_key: idempotencyKey,
    event_type: eventName,
    processed_ok: false,
    payload_excerpt: excerpt,
  });

  const duplicateReceipt =
    insErr?.code === "23505" ||
    (typeof insErr?.message === "string" && /duplicate key|unique constraint/i.test(insErr.message));

  if (insErr && !duplicateReceipt) {
    console.error("[paystack webhook] receipt insert:", insErr.message);
    return NextResponse.json({ error: "Could not persist idempotency receipt." }, { status: 500 });
  }

  const { data: existing, error: selErr } = await admin
    .from("billing_webhook_receipts")
    .select("processed_ok")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (selErr) {
    console.error("[paystack webhook] receipt select:", selErr.message);
    return NextResponse.json({ error: "Idempotency read failed." }, { status: 500 });
  }

  if (existing?.processed_ok === true) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (!PAYSTACK_BILLING_HANDLED_EVENTS.has(eventName)) {
    await reconcileReceipt(admin, idempotencyKey);
    return NextResponse.json({ received: true, ignored_event: eventName });
  }

  try {
    await processPaystackWebhookEvent(admin, eventName, dataUnknown);
    await reconcileReceipt(admin, idempotencyKey);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("billing_webhook_receipts")
      .update({ last_error: msg.slice(0, 1900), processed_ok: false })
      .eq("idempotency_key", idempotencyKey);
    console.error("[paystack webhook] processing:", msg);
    return NextResponse.json({ received: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
