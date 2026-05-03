import { google, type gmail_v1 } from "googleapis";
import type { NormalizedEmail } from "@/lib/parsers/parser.interface";

export const GMAIL_KEYWORD_QUERY =
  "newer_than:90d (subscription OR billing OR trial OR renewal)";

export const INITIAL_MESSAGE_CAP = 120;
export const HISTORY_PAGE_CAP = 50;

export interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  expiryDateMillis: number | null;
}

export function createGmailOAuth2() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailApi(auth: InstanceType<typeof google.auth.OAuth2>) {
  return google.gmail({ version: "v1", auth });
}

export async function refreshAccessTokenIfNeeded(
  auth: InstanceType<typeof google.auth.OAuth2>,
  creds: GmailCredentials,
): Promise<{ accessToken: string; expiryDateMillis: number | null }> {
  auth.setCredentials({
    access_token: creds.accessToken,
    refresh_token: creds.refreshToken,
    expiry_date: creds.expiryDateMillis ?? undefined,
  });
  const now = Date.now();
  if (!creds.expiryDateMillis || creds.expiryDateMillis < now + 60_000) {
    const { credentials } = await auth.refreshAccessToken();
    return {
      accessToken: credentials.access_token ?? creds.accessToken,
      expiryDateMillis: credentials.expiry_date ?? null,
    };
  }
  return { accessToken: creds.accessToken, expiryDateMillis: creds.expiryDateMillis };
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBody(data: string | undefined): string {
  if (!data) return "";
  try {
    return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
  } catch {
    return "";
  }
}

function flattenParts(
  parts: gmail_v1.Schema$MessagePart[] | undefined,
  bodies: { mimeType?: string | null; body?: gmail_v1.Schema$MessagePartBody | null }[],
): void {
  if (!parts?.length) return;
  for (const p of parts) {
    if (p.parts?.length) {
      flattenParts(p.parts, bodies);
    } else if (p.body?.data) {
      bodies.push({ mimeType: p.mimeType, body: p.body });
    }
  }
}

function headerValue(
  headers: { name?: string | null; value?: string | null }[],
  name: string,
): string | null {
  const want = name.toLowerCase();
  const raw = headers.find((h) => h.name?.toLowerCase() === want)?.value?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function messageToNormalized(
  full: gmail_v1.Schema$Message,
  messageId: string,
): NormalizedEmail {
  const headers = full.payload?.headers ?? [];
  const subject = headerValue(headers, "Subject") ?? "";
  const from = headerValue(headers, "From") ?? "";
  const listUnsubscribe = headerValue(headers, "List-Unsubscribe");
  const replyTo = headerValue(headers, "Reply-To");
  const precedence = headerValue(headers, "Precedence");
  const snippet = full.snippet ?? "";
  const bodies: { mimeType?: string | null; body?: gmail_v1.Schema$MessagePartBody | null }[] =
    [];
  if (full.payload?.parts?.length) {
    flattenParts(full.payload.parts, bodies);
  } else if (full.payload?.body?.data) {
    bodies.push({ mimeType: full.payload.mimeType, body: full.payload.body });
  }
  let bodyText = "";
  const plain = bodies.find((b) => b.mimeType === "text/plain");
  const html = bodies.find((b) => b.mimeType === "text/html");
  if (plain?.body?.data) {
    bodyText = decodeBody(plain.body.data);
  } else if (html?.body?.data) {
    bodyText = stripHtml(decodeBody(html.body.data));
  }
  return {
    messageId,
    subject,
    snippet,
    bodyText,
    from,
    listUnsubscribe,
    replyTo,
    precedence,
  };
}

function isGmailMessageNotFound(err: unknown): boolean {
  const e = err as { code?: number; status?: number; errors?: Array<{ reason?: string }> };
  if (e.code === 404 || e.status === 404) return true;
  return e.errors?.[0]?.reason === "notFound";
}

export async function fetchFullMessage(
  gmail: gmail_v1.Gmail,
  id: string,
): Promise<NormalizedEmail | null> {
  try {
    const full = await gmail.users.messages.get({ userId: "me", id, format: "full" });
    return messageToNormalized(full.data, id);
  } catch (err: unknown) {
    if (isGmailMessageNotFound(err)) {
      return null;
    }
    throw err;
  }
}

export async function getCurrentHistoryId(gmail: gmail_v1.Gmail): Promise<string | null> {
  const prof = await gmail.users.getProfile({ userId: "me" });
  return prof.data.historyId ?? null;
}

export async function listInitialMessageIds(gmail: gmail_v1.Gmail): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: GMAIL_KEYWORD_QUERY,
      maxResults: 50,
      pageToken,
    });
    const messages = res.data.messages ?? [];
    for (const m of messages) {
      if (m.id) ids.push(m.id);
      if (ids.length >= INITIAL_MESSAGE_CAP) return ids;
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken && ids.length < INITIAL_MESSAGE_CAP);
  return ids;
}

export async function listHistoryMessageIds(
  gmail: gmail_v1.Gmail,
  startHistoryId: string,
): Promise<{ ids: string[]; latestHistoryId: string | null; expired: boolean }> {
  const ids: string[] = [];
  let pageToken: string | undefined;
  let latestHistoryId: string | null = null;
  try {
    do {
      const res = await gmail.users.history.list({
        userId: "me",
        startHistoryId,
        maxResults: HISTORY_PAGE_CAP,
        pageToken,
        historyTypes: ["messageAdded"],
      });
      latestHistoryId = res.data.historyId ?? latestHistoryId;
      const history = res.data.history ?? [];
      for (const h of history) {
        for (const added of h.messagesAdded ?? []) {
          if (added.message?.id) ids.push(added.message.id);
        }
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return { ids: Array.from(new Set(ids)), latestHistoryId, expired: false };
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err.code === 404 || err.message?.includes("history")) {
      return { ids: [], latestHistoryId: null, expired: true };
    }
    throw e;
  }
}
