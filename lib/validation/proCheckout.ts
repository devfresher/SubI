import { z } from "zod";

export const proCheckoutBodySchema = z.object({
  /** Paystack billing interval naming (stored plans use Paystack wording). */
  billingInterval: z.enum(["monthly", "annually"]),
  currency: z.enum(["NGN", "USD"]),
});

export type ProCheckoutBody = z.infer<typeof proCheckoutBodySchema>;
