import { z } from "zod";

const IANA_TIMEZONE_MAX = 120;

export const settingsPatchSchema = z.object({
  timezone: z
    .string()
    .min(1)
    .max(IANA_TIMEZONE_MAX)
    .regex(/^[A-Za-z0-9_\/+\-]+$/, "Invalid timezone format"),
  reminder_preferences: z
    .array(z.number().int().min(1).max(30))
    .min(1)
    .max(5)
    .refine((a) => new Set(a).size === a.length, "Duplicate reminder offsets"),
});

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
