# SubI — agent / developer orientation

## Commands

- Install: `pnpm install`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`

Use **pnpm only** (enforced via `preinstall`).

## Stack

- Next.js 14 App Router, TypeScript (strict), Tailwind
- Supabase Auth + Postgres (RLS) + Edge Function `reminder-dispatch`
- Gmail API (separate OAuth from Supabase Google login)
- Multi-mailbox `email_accounts` with plan caps (`users.plan`: free | pro)
- Resend (transactional reminder email)

## Layout map

| Path | Purpose |
|------|---------|
| `app/waitlist/` | Pre-launch waitlist (`SUBI_PRE_LAUNCH=1`; middleware gates other routes) |
| `app/(auth)/` | Login |
| `app/(dashboard)/` | Authenticated shell: `/dashboard`, `/settings` |
| `app/api/` | Route handlers: Gmail OAuth, `POST /api/sync/gmail`, settings, `DELETE /api/email-accounts/[id]` |
| `app/auth/callback` | Supabase OAuth code exchange |
| `components/ui/` | Primitive UI |
| `components/dashboard/`, `components/subscriptions/`, `components/settings/` | Feature UI |
| `lib/supabase/` | Browser + server + middleware clients |
| `lib/gmail/`, `lib/email/`, `lib/email-providers/`, `lib/parsers/`, `lib/crypto/` | Integrations |
| `services/` | Orchestration (no direct HTTP) |
| `repositories/` | Supabase persistence |
| `types/` | Shared types |
| `hooks/` | Client hooks (React Query) |
| `supabase/migrations/` | SQL schema + RLS |
| `supabase/functions/reminder-dispatch/` | Cron-triggered reminders |
| `docs/` | Human-facing architecture, security, domain rules |

## Non‑negotiables

1. **Browser** only gets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never ship service role, Resend key, token encryption key, Google client secret, Paystack secret, or OpenAI (receipt LLM) keys to the client.
2. **RLS** is enabled on `users`, `email_accounts`, `subscriptions`, `notifications`. Policies scope by `auth.uid()` / `user_id`.
3. **Gmail tokens** are stored AES-256-GCM encrypted (`TOKEN_ENCRYPTION_KEY`, base64 32-byte) — see `docs/SECURITY.md`.
4. **Edge function** uses service role but must still filter by `user_id` when updating rows.
5. **Reminder times** use user IANA timezone + UTC stored `notify_at` — see `docs/DOMAIN.md`.

## Where to change what

- **Inbox parse pipeline (gates, templates, heuristics, optional Pro LLM):** `lib/parsers/pipeline/runInboxPipeline.ts`, `lib/parsers/templates/`, `lib/parsers/gates/`, `lib/parsers/llm/`
- **Keyword fallback parser:** `lib/parsers/basicKeywordParser.ts`
- **Gmail query / caps / history:** `lib/gmail/gmail.client.ts`
- **Sync orchestration:** `services/email.service.ts`
- **Dashboard data:** `hooks/useSubscriptions.ts`, `app/(dashboard)/dashboard/page.tsx`
- **DB schema:** `supabase/migrations/*.sql`

## Further reading

- [docs/SETUP.md](docs/SETUP.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/DOMAIN.md](docs/DOMAIN.md)
