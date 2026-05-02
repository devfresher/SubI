import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Validates `x-paystack-signature` (HMAC-SHA512 hex of raw POST body).
 * Payload must be the exact wire bytes Paystack signed (do not JSON.parse before verifying).
 */
export function verifyPaystackWebhookSignature(rawBodyUtf8: string, signatureHeader: string | null, secretKey: string): boolean {
  if (!signatureHeader || !secretKey) return false;
  const digest = createHmac("sha512", secretKey).update(rawBodyUtf8, "utf8").digest("hex");
  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(signatureHeader.trim(), "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
