# Security

## Secrets

| Variable | Where safe | Purpose |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase with RLS |
| `TOKEN_ENCRYPTION_KEY` | Server / Edge only* | AES-256-GCM for Gmail tokens |
| `GOOGLE_CLIENT_SECRET` | Server only | Gmail OAuth code exchange |
| `RESEND_API_KEY` | Server + Edge | Send email |
| `OPENAI_API_KEY` | Server only (optional) | Receipt extraction for **SubI Pro** during Gmail sync — see Receipt intelligence section |
| Service role key | Edge function env only | Batch notification dispatch |

*Next.js Route Handlers run on the server; never prefix these with `NEXT_PUBLIC_`.

Generate `TOKEN_ENCRYPTION_KEY`:

```bash
openssl rand -base64 32
```

## Encryption format

`lib/crypto/tokenEncryption.ts` stores: version byte + IV (12) + GCM tag (16) + ciphertext, base64-encoded in `encrypted_access_token` / `encrypted_refresh_token`.

## Row Level Security

All tenant tables have RLS enabled. Policies require `auth.uid()` to match `users.id` or `user_id`. The Edge Function uses the service role (bypasses RLS) but must still constrain updates by explicit `id` / `user_id` filters.

## OAuth / CSRF

- Gmail connect uses a random `state` stored in an HTTP-only cookie and compared on callback.
- Supabase handles PKCE/session for primary Google login.

## XSS

The dashboard does not render raw email HTML. Parser consumes text only.

## Rate limiting

Gmail sync (`POST /api/sync/gmail`) uses an in-memory per-user cooldown (`lib/utils/syncRateLimit.ts`) suitable for MVP; replace with Redis or DB-backed limits for multi-instance production.

## Receipt intelligence (optional LLM)

When `OPENAI_API_KEY` is set and `RECEIPT_LLM_DISABLED` is not set, **SubI Pro** users can use an extra parsing stage after rules/templates: a truncated copy of the message (subject, snippet, `From`, and a text-only body preview) is sent to the OpenAI Chat Completions API (see `lib/parsers/llm/receiptExtractor.ts`). Nothing is sent from the browser; only server-side sync invokes this path.

- **Secrets**: treat `OPENAI_API_KEY` like other server-only keys; never `NEXT_PUBLIC_*`.
- **Quota**: in-process daily cap per user (`RECEIPT_LLM_DAILY_CAP_PER_USER`, default 48); not suitable for multi-instance fleets without a shared store.
- **Opt out**: set `RECEIPT_LLM_DISABLED=1` to force rules/templates/heuristics only.
- **Logging**: set `LOG_INBOX_PARSE=1` for structured parse trace lines in server logs (never log full message bodies by default).

## Threat notes

- Stolen **anon** key alone cannot read other users’ rows if RLS policies are correct.
- Stolen **service role** key is full access: restrict to deployment secrets, never expose to browsers.
