import { encryptToken } from "@/lib/crypto/tokenEncryption";
import { fetchGoogleOAuthUserInfo } from "@/lib/gmail/googleUserInfo";
import { createGmailOAuth2 } from "@/lib/gmail/gmail.client";
import { createClient } from "@/lib/supabase/server";
import * as emailAccountRepo from "@/repositories/email_account.repository";
import * as userRepo from "@/repositories/user.repository";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STATE_COOKIE = "gmail_oauth_state";

function normEmail(e: string): string {
  return e.trim().toLowerCase();
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const settingsBase = `${origin}/settings`;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expected = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(`${settingsBase}?gmail=state_error`);
  }

  try {
    const oauth2 = createGmailOAuth2();
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${settingsBase}?gmail=no_refresh`);
    }

    const googleUser = await fetchGoogleOAuthUserInfo(tokens.access_token);
    if (!googleUser) {
      return NextResponse.redirect(`${settingsBase}?gmail=no_email`);
    }

    const profile = await userRepo.getProfile(supabase, user.id);
    const plan = profile?.plan ?? "free";

    if (plan === "free" && user.email) {
      if (normEmail(googleUser.email) !== normEmail(user.email)) {
        return NextResponse.redirect(`${settingsBase}?gmail=email_mismatch`);
      }
    }

    const result = await emailAccountRepo.upsertGmailOAuthAccount({
      supabase,
      userId: user.id,
      providerEmail: googleUser.email,
      providerUserId: googleUser.id || null,
      encryptedAccess: encryptToken(tokens.access_token),
      encryptedRefresh: encryptToken(tokens.refresh_token),
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      plan,
    });

    if (!result.ok) {
      if (result.reason === "mailbox_already_linked") {
        return NextResponse.redirect(`${settingsBase}?gmail=taken`);
      }
      return NextResponse.redirect(`${settingsBase}?gmail=limit`);
    }

    return NextResponse.redirect(`${settingsBase}?gmail=connected`);
  } catch (e) {
    console.error("Gmail OAuth callback error:", e);
    return NextResponse.redirect(`${settingsBase}?gmail=error`);
  }
}
