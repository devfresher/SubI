-- Waitlist emails collected before public launch (inserted via service-role API only).

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index waitlist_signups_email_lower_idx on public.waitlist_signups (lower(email));

alter table public.waitlist_signups enable row level security;

-- No grants to anon/authenticated: access only via service role (bypasses RLS).
