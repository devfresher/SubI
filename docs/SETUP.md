# Setup

## Prerequisites

- Node 20+
- [pnpm](https://pnpm.io/) 9+
- Supabase project
- Google Cloud project (OAuth consent + Gmail API enabled)
- Resend account (for reminder email)

## 1. Clone and install

```bash
pnpm install
```

## 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Install [Supabase CLI](https://supabase.com/docs/guides/cli) if you want local apply:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
   Or apply all files under `supabase/migrations/` in timestamp order (required for mailboxes + `users.plan`).
3. Enable **Google** (and optionally **Apple**, **Email**) under Authentication → Providers. For Google, add the client ID/secret from Google Cloud (can be the same OAuth client as Gmail or a separate one for sign-in only).
4. **Apple (optional):** Configure Services ID, redirect URLs, and key in the Apple Developer portal; paste the same redirect URLs into Supabase (e.g. `https://<ref>.supabase.co/auth/v1/callback` plus your site callback if required by your setup).
5. **Email magic link:** Enable the Email provider; set the same **Site URL** and **Redirect URLs** as below so links land on `/auth/callback`.
6. Set **Site URL** and **Redirect URLs** in Authentication → URL Configuration:
   - `http://localhost:3000/auth/callback` (dev)
   - Production: `https://your-domain/auth/callback`

## 3. Google OAuth (Gmail)

1. In Google Cloud Console → APIs → enable **Gmail API**.
2. OAuth consent screen → add `.../auth/gmail.readonly` scope for your test users.
3. Credentials → OAuth client → **Web application**:
   - Authorized redirect URIs: one entry per environment, each your site origin plus `/api/gmail/callback` (same path you set as `GOOGLE_REDIRECT_URI`).
4. Copy client ID and secret into `.env.local` as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## 4. Resend

1. Verify a sending domain or use Resend’s sandbox domain for development.
2. Set `RESEND_API_KEY` and `RESEND_FROM` in `.env.local`.

## 5. App env

```bash
cp .env.example .env.local
# fill all values; generate TOKEN_ENCRYPTION_KEY with: openssl rand -base64 32
```

## 6. Edge function + cron

1. Deploy `supabase/functions/reminder-dispatch` via Supabase CLI or Dashboard.
2. Set secrets: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, and `SUPABASE_URL` if not auto-injected.
3. Schedule an external HTTP caller (e.g. GitHub Actions, cron-job.org) every **10–15 minutes**:
   - `GET` or `POST` `https://<project-ref>.supabase.co/functions/v1/reminder-dispatch`
   - Header: `x-cron-secret: <CRON_SECRET>`

## 7. Run locally

```bash
pnpm dev
```

Open `http://localhost:3000`, sign in (Google, Apple, or email link), open **Settings** to connect Gmail and run **Sync** from a mailbox card.
