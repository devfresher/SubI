import type { SupabaseClient } from "@supabase/supabase-js";
import * as billingRepo from "@/repositories/billing.repository";
import * as userRepo from "@/repositories/user.repository";

type PaystackCustomer = Record<string, unknown>;

/** Events handled with business writes (beyond idempotent receipt accounting). */
export const PAYSTACK_BILLING_HANDLED_EVENTS = new Set([
  "subscription.create",
  "subscription.enable",
  "subscription.not_renew",
  "subscription.disable",
  "charge.success",
  "invoice.create",
  "invoice.update",
  "invoice.success",
  "invoice.failure",
  "invoice.payment_failed",
]);

function payloadExcerpt(event: string, data: Record<string, unknown>) {
  const subNested =
    typeof data.subscription === "object" && data.subscription !== null
      ? (data.subscription as Record<string, unknown>)
      : undefined;
  return {
    event,
    reference: typeof data.reference === "string" ? data.reference : null,
    subscription_code:
      typeof data.subscription_code === "string"
        ? data.subscription_code
        : typeof subNested?.subscription_code === "string"
          ? (subNested.subscription_code as string)
          : null,
    invoice_code: typeof data.invoice_code === "string" ? data.invoice_code : null,
  };
}

export function buildReceiptExcerpt(event: string, data: Record<string, unknown>) {
  return payloadExcerpt(event, data);
}

function readSubscriptionCode(data: Record<string, unknown>): string | null {
  const subNested =
    typeof data.subscription === "object" && data.subscription !== null
      ? (data.subscription as Record<string, unknown>)
      : undefined;
  const raw =
    (typeof data.subscription_code === "string" ? data.subscription_code : null) ??
    (typeof subNested?.subscription_code === "string" ? (subNested.subscription_code as string) : null);
  return raw?.trim() ? raw : null;
}

function readEmailToken(data: Record<string, unknown>): string | null {
  const token =
    typeof data.email_token === "string"
      ? data.email_token
      : typeof (data.authorization as Record<string, unknown> | undefined)?.email_token === "string"
        ? ((data.authorization as { email_token: string }).email_token as string)
        : null;
  return typeof token === "string" && token.trim() ? token.trim() : null;
}

function readCustomerCode(data: Record<string, unknown>): string | null {
  const cust = typeof data.customer === "object" && data.customer !== null ? (data.customer as PaystackCustomer) : undefined;
  const cc =
    cust && typeof cust.customer_code === "string"
      ? cust.customer_code
      : typeof data.customer_code === "string"
        ? data.customer_code
        : null;
  return cc?.trim() ? cc.trim() : null;
}

function readCustomerEmail(data: Record<string, unknown>): string | null {
  const cust = typeof data.customer === "object" && data.customer !== null ? (data.customer as PaystackCustomer) : undefined;
  const e =
    cust && typeof cust.email === "string"
      ? cust.email
      : typeof data.customer_email === "string"
        ? data.customer_email
        : typeof data.email === "string"
          ? data.email
          : null;
  return e?.trim() ? e.trim().toLowerCase() : null;
}

function readSubiUserIdFromMetadata(data: Record<string, unknown>): string | null {
  const meta = data.metadata;
  let obj: Record<string, unknown> | null = null;
  if (meta && typeof meta === "object" && !Array.isArray(meta)) obj = meta as Record<string, unknown>;
  else if (typeof meta === "string") {
    try {
      const p = JSON.parse(meta) as unknown;
      if (p && typeof p === "object" && !Array.isArray(p)) obj = p as Record<string, unknown>;
    } catch {
      obj = null;
    }
  }
  const uid = obj?.subi_user_id;
  return typeof uid === "string" && /^[0-9a-f-]{36}$/i.test(uid) ? uid : null;
}

async function resolveWebhookUserId(
  admin: SupabaseClient,
  data: Record<string, unknown>,
): Promise<{ userId: string | null }> {
  const fromMeta = readSubiUserIdFromMetadata(data);
  if (fromMeta) {
    const { data: row } = await admin.from("users").select("id").eq("id", fromMeta).maybeSingle();
    if (row?.id) return { userId: row.id as string };
  }
  const email = readCustomerEmail(data);
  if (email) {
    const id = await userRepo.getUserIdByEmailNormalized(admin, email);
    if (id) return { userId: id };
  }
  const subCode = readSubscriptionCode(data);
  if (subCode) {
    const { data: u } = await admin
      .from("users")
      .select("id")
      .eq("paystack_subscription_code", subCode)
      .maybeSingle();
    if (u?.id) return { userId: u.id as string };
  }
  return { userId: null };
}

function coerceAmountMinor(amount: unknown): number | null {
  if (typeof amount === "number" && Number.isFinite(amount)) return Math.trunc(amount);
  if (typeof amount === "string" && /^\d+$/.test(amount)) return Number.parseInt(amount, 10);
  return null;
}

function coerceOccurredAt(data: Record<string, unknown>): string | null {
  const cands = ["paid_at", "paidAt", "created_at", "createdAt", "transaction_date"];
  for (const k of cands) {
    const v = data[k];
    if (typeof v === "string") {
      const d = Date.parse(v);
      if (!Number.isNaN(d)) return new Date(d).toISOString();
    }
  }
  return null;
}

function currencyOf(data: Record<string, unknown>): string | null {
  const c = typeof data.currency === "string" ? data.currency : null;
  return c?.trim() ? c.trim().toUpperCase() : null;
}

async function ledgerPayment(
  admin: SupabaseClient,
  params: {
    userId: string;
    dedupe_key: string;
    event_type: string;
    amount_minor: number | null;
    currency: string | null;
    reference: string | null;
    occurred_at: string | null;
    summary: Record<string, unknown>;
  },
) {
  await billingRepo.tryInsertLedgerEntry(admin, {
    user_id: params.userId,
    dedupe_key: params.dedupe_key,
    event_type: params.event_type,
    kind: "payment",
    status: typeof params.summary.status === "string" ? (params.summary.status as string) : "success",
    amount_minor: params.amount_minor,
    currency: params.currency,
    reference: params.reference,
    invoice_code: null,
    subscription_code: null,
    occurred_at: params.occurred_at,
    summary: params.summary,
  });
}

async function ledgerInvoiceLike(
  admin: SupabaseClient,
  params: {
    userId: string;
    dedupe_key: string;
    event_type: string;
    status: string | null;
    amount_minor: number | null;
    currency: string | null;
    reference: string | null;
    invoice_code: string | null;
    subscription_code: string | null;
    occurred_at: string | null;
    summary: Record<string, unknown>;
  },
) {
  await billingRepo.tryInsertLedgerEntry(admin, {
    user_id: params.userId,
    dedupe_key: params.dedupe_key,
    event_type: params.event_type,
    kind: "invoice",
    status: params.status,
    amount_minor: params.amount_minor,
    currency: params.currency,
    reference: params.reference,
    invoice_code: params.invoice_code,
    subscription_code: params.subscription_code,
    occurred_at: params.occurred_at,
    summary: params.summary,
  });
}

async function ledgerSubscriptionLike(
  admin: SupabaseClient,
  params: {
    userId: string;
    dedupe_key: string;
    event_type: string;
    status: string | null;
    subscription_code: string | null;
    occurred_at: string | null;
    summary: Record<string, unknown>;
  },
) {
  await billingRepo.tryInsertLedgerEntry(admin, {
    user_id: params.userId,
    dedupe_key: params.dedupe_key,
    event_type: params.event_type,
    kind: "subscription",
    status: params.status,
    amount_minor: null,
    currency: null,
    reference: null,
    invoice_code: null,
    subscription_code: params.subscription_code,
    occurred_at: params.occurred_at,
    summary: params.summary,
  });
}

async function requireUser(admin: SupabaseClient, data: Record<string, unknown>): Promise<string> {
  const { userId } = await resolveWebhookUserId(admin, data);
  if (!userId) throw new Error("billing: cannot resolve Paystack payload to an app user.");
  return userId;
}

export async function processPaystackWebhookEvent(
  admin: SupabaseClient,
  eventName: string,
  dataUnknown: unknown,
): Promise<void> {
  const data =
    dataUnknown && typeof dataUnknown === "object" && dataUnknown !== null
      ? (dataUnknown as Record<string, unknown>)
      : {};

  switch (eventName) {
    case "subscription.create":
    case "subscription.enable": {
      const userId = await requireUser(admin, data);
      const subscription_code = readSubscriptionCode(data);
      const email_token = readEmailToken(data);
      const customer_code = readCustomerCode(data);
      const status = typeof data.status === "string" ? data.status : "active";

      await userRepo.updateUserBilling(admin, userId, {
        plan: "pro",
        paystack_customer_code: customer_code ?? undefined,
        paystack_subscription_code: subscription_code ?? undefined,
        paystack_email_token: email_token ?? undefined,
        paystack_subscription_status: status,
      });

      if (subscription_code) {
        await ledgerSubscriptionLike(admin, {
          userId,
          dedupe_key: `ps:sub:${subscription_code}:${eventName}`,
          event_type: eventName,
          status,
          subscription_code,
          occurred_at: coerceOccurredAt(data),
          summary: { snapshot: payloadExcerpt(eventName, data) },
        });
      }
      return;
    }
    case "subscription.not_renew": {
      const userId = await requireUser(admin, data);
      const subscription_code = readSubscriptionCode(data);
      const status =
        typeof data.status === "string"
          ? data.status
          : typeof data.next_payment_date === "string"
            ? "non-renewing"
            : "non-renewing";
      await userRepo.updateUserBilling(admin, userId, {
        paystack_subscription_status: status,
      });
      if (subscription_code) {
        await ledgerSubscriptionLike(admin, {
          userId,
          dedupe_key: `ps:sub:${subscription_code}:${eventName}`,
          event_type: eventName,
          status,
          subscription_code,
          occurred_at: coerceOccurredAt(data),
          summary: { snapshot: payloadExcerpt(eventName, data) },
        });
      }
      return;
    }
    case "subscription.disable": {
      const userId = await requireUser(admin, data);
      const subscription_code = readSubscriptionCode(data);
      await userRepo.updateUserBilling(admin, userId, {
        plan: "free",
        paystack_subscription_status: typeof data.status === "string" ? data.status : "cancelled",
        paystack_subscription_code: null,
        paystack_email_token: null,
      });
      if (subscription_code) {
        await ledgerSubscriptionLike(admin, {
          userId,
          dedupe_key: `ps:sub:${subscription_code}:${eventName}`,
          event_type: eventName,
          status: typeof data.status === "string" ? data.status : "cancelled",
          subscription_code,
          occurred_at: coerceOccurredAt(data),
          summary: { snapshot: payloadExcerpt(eventName, data) },
        });
      }
      return;
    }
    case "charge.success": {
      const userId = await requireUser(admin, data);
      const reference = typeof data.reference === "string" ? data.reference : null;
      if (!reference) throw new Error("billing: charge.success missing reference.");

      const amt = coerceAmountMinor(data.amount);
      const cur = currencyOf(data);
      await ledgerPayment(admin, {
        userId,
        dedupe_key: `ps:charge:${reference}:${eventName}`,
        event_type: eventName,
        amount_minor: amt,
        currency: cur,
        reference,
        occurred_at: coerceOccurredAt(data),
        summary: { gateway_status: data.status, excerpt: payloadExcerpt(eventName, data) },
      });

      const sub_code = readSubscriptionCode(data);
      if (sub_code) {
        await userRepo.updateUserBilling(admin, userId, {
          plan: "pro",
          paystack_subscription_code: sub_code,
        });
      }
      return;
    }
    case "invoice.create":
    case "invoice.update":
    case "invoice.success":
    case "invoice.failure":
    case "invoice.payment_failed": {
      const userId = await requireUser(admin, data);
      const invoice_code =
        typeof data.invoice_code === "string"
          ? data.invoice_code
          : typeof (data as { code?: unknown }).code === "string"
            ? ((data as { code: string }).code as string)
            : null;
      if (!invoice_code) throw new Error(`billing: ${eventName} missing invoice identifier.`);

      const subscription_code = readSubscriptionCode(data);
      const amt = coerceAmountMinor(data.amount ?? data.requested_amount ?? (data as { amount_due?: unknown }).amount_due);
      const status =
        typeof data.status === "string"
          ? data.status
          : eventName === "invoice.payment_failed" || eventName === "invoice.failure"
            ? "failed"
            : "issued";

      await ledgerInvoiceLike(admin, {
        userId,
        dedupe_key: `ps:inv:${invoice_code}:${eventName}`,
        event_type: eventName,
        status,
        amount_minor: amt,
        currency: currencyOf(data),
        reference: typeof data.reference === "string" ? data.reference : null,
        invoice_code,
        subscription_code,
        occurred_at: coerceOccurredAt(data),
        summary: { excerpt: payloadExcerpt(eventName, data) },
      });
      return;
    }
    default:
      throw new Error(`billing: unsupported event ${eventName}`);
  }
}
