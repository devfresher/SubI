import { createHash } from "node:crypto";

/** Stable dedupe ID per webhook delivery (retry-safe identical payloads ⇒ same key). */
export function buildWebhookIdempotencyKey(eventName: string, data: unknown): string {
  const d = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const reference = typeof d.reference === "string" ? d.reference : "";
  const invoice_code = typeof d.invoice_code === "string" ? d.invoice_code : "";
  const subscription_code =
    typeof d.subscription_code === "string"
      ? d.subscription_code
      : typeof (d.subscription as { subscription_code?: string } | undefined)?.subscription_code === "string"
        ? (d.subscription as { subscription_code: string }).subscription_code
        : "";
  const numericId =
    typeof d.id === "number" || typeof d.id === "string" ? String(d.id) : typeof d.ids === "string" ? d.ids : "";
  const compound = [reference, invoice_code, subscription_code, numericId].filter(Boolean).join("|");
  if (compound.length > 0) {
    return `paystack:v1:${eventName}:${compound}`;
  }
  const h = createHash("sha256").update(`${eventName}:`).update(JSON.stringify(d)).digest("hex");
  return `paystack:v1:${eventName}:h:${h.slice(0, 56)}`;
}
