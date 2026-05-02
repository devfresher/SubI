# Security

## Secrets

| Variable | Where safe | Purpose |
|----------|------------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | Supabase with RLS |
| `TOKEN_ENCRYPTION_KEY` | Server / Edge only* | AES-256-GCM for Gmail tokens |
| `GOOGLE_CLIENT_SECRET` | Server only | Gmail OAuth code exchange |
| `RESEND_API_KEY` | Server + Edge | Send email |
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

## Threat notes

- Stolen **anon** key alone cannot read other users’ rows if RLS policies are correct.
- Stolen **service role** key is full access: restrict to deployment secrets, never expose to browsers.
