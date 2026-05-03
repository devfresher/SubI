import { emailHaystack } from "@/lib/parsers/emailHaystack";
import { primaryFromEmail } from "@/lib/parsers/fromAddress";
import type { NormalizedEmail } from "@/lib/parsers/parser.interface";

const TRUSTED_BILLING_DOMAINS =
  /(?:^|@)(?:stripe\.com|paypal\.com|paystack\.com|paddle\.com|fastspring\.com|recurly\.com)\b/i;

/** Paid / receipt language strong enough to override “list” bulk signals without a currency line. */
const STRONG_BILLING_CONTEXT =
  /\b(receipt|invoice|charged|payment\s+(received|successful|completed)|amount\s+due|subscription\s+(renew|will\s+renew)|subscription\s+is\s+now\s+active|auto-?renew)\b/i;

const MONEY_CUE =
  /\b(NGN|USD|EUR|GBP|CAD|AUD|ZAR|₦|\$|€|£)\s*[\d]{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?\b|\b[\d]{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})\s*(?:NGN|USD|EUR|GBP|CAD)\b/i;

function hasMonetaryCue(haystack: string): boolean {
  return MONEY_CUE.test(haystack.slice(0, 12_000));
}

export function isTrustedBillingSender(fromHeader: string): boolean {
  const email = primaryFromEmail(fromHeader);
  const host = email.includes("@") ? email.split("@")[1] ?? "" : "";
  if (!host) return TRUSTED_BILLING_DOMAINS.test(fromHeader);
  return TRUSTED_BILLING_DOMAINS.test(`@${host}`);
}

/**
 * Drop obvious newsletter / marketing mail that matched Gmail’s broad keyword query
 * but is unlikely to be a payable subscription receipt.
 */
export function shouldSkipNewsletterLike(message: NormalizedEmail): boolean {
  if (isTrustedBillingSender(message.from)) {
    return false;
  }

  const hay = emailHaystack(message);
  const listUnsub = !!message.listUnsubscribe?.trim();
  const precedenceBulk = /\b(bulk|list|junk)\b/i.test(message.precedence ?? "");

  if (!listUnsub && !precedenceBulk) {
    return false;
  }

  const money = hasMonetaryCue(hay);
  const strongBilling = STRONG_BILLING_CONTEXT.test(hay.slice(0, 8000));

  if (money || strongBilling) {
    return false;
  }

  if (listUnsub || precedenceBulk) {
    return true;
  }
  return false;
}
