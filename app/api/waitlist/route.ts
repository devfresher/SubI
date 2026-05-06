import { isPreLaunchWaitlistEnabled } from "@/lib/config/preLaunch";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { allowWaitlistSignup } from "@/lib/utils/waitlistRateLimit";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email().max(320),
  /** Honeypot — hidden field; bots fill it. */
  website: z.string().optional(),
});

function clientKeyFromRequest(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: Request) {
  if (!isPreLaunchWaitlistEnabled()) {
    return NextResponse.json({ error: "Waitlist is closed." }, { status: 404 });
  }

  const key = clientKeyFromRequest(request);
  if (!allowWaitlistSignup(key)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (parsed.data.website != null && parsed.data.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.trim().toLowerCase();

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch (err) {
    console.error("[waitlist] createServiceRoleClient failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Waitlist is temporarily unavailable." }, { status: 503 });
  }

  const { error } = await admin.from("waitlist_signups").insert({ email });

  if (error && error.code !== "23505") {
    console.error("[waitlist] insert failed:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json({ error: "Could not save your email. Try again." }, { status: 500 });
  }

  // Same response for new signups and duplicates — avoids email enumeration.
  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
