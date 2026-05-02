import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const DELETE_CONFIRMATION_PHRASE = "DELETE MY ACCOUNT";

const deleteBodySchema = z.object({
  confirmation: z.literal(DELETE_CONFIRMATION_PHRASE),
});

/** Irrevocably removes the signed-in Auth user — `public.users` and related rows cascade. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = deleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `Confirmation must be the exact phrase: ${DELETE_CONFIRMATION_PHRASE}`,
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let admin;
  try {
    admin = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Account deletion is not configured (service role)." }, { status: 503 });
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account delete]", error.message);
    return NextResponse.json({ error: "Could not delete account. Try again or contact support." }, { status: 500 });
  }

  /** Client should sign out locally; session is invalid server-side too. */
  return NextResponse.json({ ok: true });
}
