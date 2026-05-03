import { resolveSingleGmailMailboxId, syncGmailMailbox } from "@/services/email.service";
import { createClient } from "@/lib/supabase/server";
import { canSync } from "@/lib/utils/syncRateLimit";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { emailAccountId?: unknown } = {};
  try {
    body = (await request.json()) as { emailAccountId?: unknown };
  } catch {
    // empty body — resolve single mailbox if possible
  }

  let mailboxId =
    typeof body.emailAccountId === "string" && body.emailAccountId.length > 0
      ? body.emailAccountId
      : null;

  if (!mailboxId) {
    mailboxId = await resolveSingleGmailMailboxId(supabase, user.id);
    if (!mailboxId) {
      return NextResponse.json(
        {
          error:
            "Specify emailAccountId in the JSON body when you have more than one mailbox connected.",
        },
        { status: 400 },
      );
    }
  }

  if (!canSync(user.id, mailboxId)) {
    return NextResponse.json({ error: "Rate limited: wait before syncing again." }, { status: 429 });
  }

  try {
    const result = await syncGmailMailbox(supabase, user.id, mailboxId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
