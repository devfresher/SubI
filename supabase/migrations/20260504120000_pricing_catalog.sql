-- Public pricing catalog (plans + quotes). Readable without auth for marketing.

create table public.pricing_plans (
  plan_key text primary key check (plan_key in ('free', 'pro')),
  display_name text not null,
  subtitle text,
  badge_label text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  feature_bullets jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pricing_plans is 'Marketing/plan copy and bullets; entitlements (caps) still enforced in app code from plan_key.';

create table public.pricing_quotes (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null references public.pricing_plans (plan_key) on delete cascade,
  currency text not null check (currency in ('USD', 'NGN')),
  billing_interval text not null check (billing_interval in ('month', 'year')),
  unit_amount_minor int not null check (unit_amount_minor >= 0),
  compare_at_amount_minor int check (compare_at_amount_minor is null or compare_at_amount_minor >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_key, currency, billing_interval)
);

comment on column public.pricing_quotes.unit_amount_minor is 'Smallest currency unit (USD cents, NGN kobo).';
comment on column public.pricing_quotes.compare_at_amount_minor is 'Optional strike-through / compare-at in same minor units.';

alter table public.pricing_plans enable row level security;
alter table public.pricing_quotes enable row level security;

create policy pricing_plans_public_read
  on public.pricing_plans
  for select
  to anon, authenticated
  using (is_active = true);

create policy pricing_quotes_public_read
  on public.pricing_quotes
  for select
  to anon, authenticated
  using (is_active = true);

grant select on public.pricing_plans to anon, authenticated;
grant select on public.pricing_quotes to anon, authenticated;

insert into public.pricing_plans (plan_key, display_name, subtitle, sort_order, feature_bullets, badge_label)
values
  (
    'free',
    'Free',
    'Get organized with one inbox',
    0,
    '["One Gmail inbox matched to your sign-in email","Email reminders 1 and 3 days before renewals","Full list, filters, manual entries, optional Gmail sync"]'::jsonb,
    null
  ),
  (
    'pro',
    'Pro',
    'Power users juggling more than one mailbox',
    1,
    '["Up to 10 Gmail mailboxes","Reminders up to two weeks before billing","Everything in Free, scaled for work and personal inboxes"]'::jsonb,
    'Most popular'
  )
on conflict (plan_key) do update
set
  display_name = excluded.display_name,
  subtitle = excluded.subtitle,
  badge_label = excluded.badge_label,
  sort_order = excluded.sort_order,
  feature_bullets = excluded.feature_bullets,
  updated_at = now();

-- Paid quotes only; Free displays as 0 in the app.
insert into public.pricing_quotes (plan_key, currency, billing_interval, unit_amount_minor, compare_at_amount_minor)
values
  ('pro', 'USD', 'month', 900, null),
  ('pro', 'USD', 'year', 8800, 10800),
  ('pro', 'NGN', 'month', 1500000, null),
  ('pro', 'NGN', 'year', 15000000, 18000000)
on conflict (plan_key, currency, billing_interval) do update
set
  unit_amount_minor = excluded.unit_amount_minor,
  compare_at_amount_minor = excluded.compare_at_amount_minor,
  updated_at = now();
