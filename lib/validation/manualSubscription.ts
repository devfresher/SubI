import { z } from "zod";

const CADENCES = [
  "unknown",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
] as const;

export const manualSubscriptionSchema = z.object({
  name: z.string().min(1).max(200),
  next_billing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  cancel_url: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.string().url().nullable().optional(),
  ),
  notes: z.preprocess(
    (v) => (v === "" || v === null ? null : v),
    z.string().max(2000).nullable().optional(),
  ),
  amount: z.preprocess((v) => {
    if (v === "" || v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(String(v));
    return Number.isFinite(n) ? n : undefined;
  }, z.union([z.number().positive().max(999_999_999), z.null()]).optional()),
  currency: z.preprocess(
    (v) => {
      if (v === "" || v === null || v === undefined) return null;
      return String(v).toUpperCase();
    },
    z
      .string()
      .length(3)
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
  ),
  billing_cadence: z.enum(CADENCES),
  reminder_offsets: z.preprocess(
    (v) => (Array.isArray(v) && v.length === 0 ? null : v),
    z
      .array(z.number().int().min(1).max(90))
      .max(6)
      .optional()
      .nullable()
      .refine((a) => !a || new Set(a).size === a.length, "Duplicate offsets"),
  ),
});

export type ManualSubscriptionPayload = z.infer<typeof manualSubscriptionSchema>;
