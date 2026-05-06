import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Confirms the secret is the service_role JWT, not the anon key.
 * Wrong keys cause RLS errors like 42501 on tables with no anon policies.
 */
function assertJwtRoleIsServiceRole(serviceKey: string): void {
  const parts = serviceKey.split(".");
  if (parts.length !== 3) return;
  const [, payloadB64] = parts;
  if (payloadB64 === undefined) return;
  try {
    let b64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = Buffer.from(b64, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    if (payload.role != null && payload.role !== "service_role") {
      throw new Error(
        `SUPABASE_SERVICE_ROLE_KEY must be the service_role secret from Supabase (Settings → API). ` +
          `This key's JWT role is "${payload.role}", not "service_role". Often the anon key was pasted by mistake.`,
      );
    }
  } catch (e) {
    if (e instanceof SyntaxError) return;
    throw e;
  }
}

/** Server-side only — bypasses RLS. Used for billing webhooks and account deletion. */
export function createServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  assertJwtRoleIsServiceRole(serviceKey);
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
