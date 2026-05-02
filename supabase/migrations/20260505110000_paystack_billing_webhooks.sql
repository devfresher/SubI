-- Paystack billing: webhook receipts (idempotency), ledger UI, billing profile fields on users.
-- Ledger + receipts are mutable only via SECURITY DEFINER / service_role (no anon policies).

alter table public.users
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_subscription_code text,
  add column if not exists paystack_email_token text,
  add column if not exists paystack_subscription_status text;

comment on column public.users.paystack_subscription_status is 'Mirror Paystack subscription status when known (active, non-renewing, cancelled, etc.).';

create table public.billing_webhook_receipts (
  idempotency_key text primary key,
  event_type text not null,
  processed_ok boolean not null default false,
  last_error text,
  payload_excerpt jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index billing_webhook_receipts_unprocessed_created_idx
  on public.billing_webhook_receipts (created_at desc)
  where processed_ok = false;

create table public.billing_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  dedupe_key text not null unique,
  event_type text not null,
  kind text not null check (kind in ('payment', 'invoice', 'subscription')),
  status text,
  amount_minor bigint,
  currency text,
  reference text,
  invoice_code text,
  subscription_code text,
  occurred_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index billing_ledger_user_occurred_idx
  on public.billing_ledger_entries (user_id, occurred_at desc nulls last, created_at desc);

alter table public.billing_webhook_receipts enable row level security;
alter table public.billing_ledger_entries enable row level security;

-- Only service_role / bypass RLS inserts webhooks — no anon policies here.

create policy billing_ledger_owner_select on public.billing_ledger_entries
  for select
  to authenticated
  using (auth.uid () = user_id);
