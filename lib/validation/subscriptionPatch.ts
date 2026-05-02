import { z } from "zod";

export const subscriptionPatchSchema = z
  .object({
    status: z.enum(["active", "ignored"]).optional(),
    next_billing_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected yyyy-MM-dd")
      .optional(),
  })
  .refine((o) => o.status !== undefined || o.next_billing_date !== undefined, {
    message: "At least one of status, next_billing_date is required",
  });

export type SubscriptionPatchInput = z.infer<typeof subscriptionPatchSchema>;
