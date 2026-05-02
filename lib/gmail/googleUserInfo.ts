/** Gmail OAuth access token → Google account email + stable id (for provider_user_id). */
export async function fetchGoogleOAuthUserInfo(
  accessToken: string,
): Promise<{ email: string; id: string } | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { email?: string; id?: string };
  if (!body.email || typeof body.email !== "string") return null;
  return { email: body.email, id: typeof body.id === "string" ? body.id : "" };
}
