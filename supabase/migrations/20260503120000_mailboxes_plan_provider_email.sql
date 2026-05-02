-- User plan (server source of truth for mailbox caps)
alter table public.users
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro'));

comment on column public.users.plan is 'free | pro — enforces max connected mailboxes in app/API';

-- Mailbox identity + multi-provider prep
alter table public.email_accounts
  add column if not exists provider_email text;

alter table public.email_accounts
  add column if not exists provider_user_id text;

-- Normalize provider values for future providers
alter table public.email_accounts drop constraint if exists email_accounts_provider_check;

alter table public.email_accounts
  add constraint email_accounts_provider_check check (
    provider in ('gmail', 'outlook', 'yahoo', 'imap_stub')
  );

-- Backfill Gmail address from auth + public profile (best effort)
update public.email_accounts ea
set
  provider_email = coalesce(
    nullif(trim(au.email), ''),
    nullif(trim(pu.email), '')
  )
from auth.users au
  join public.users pu on pu.id = au.id
where
  ea.user_id = au.id
  and ea.provider = 'gmail'
  and (
    ea.provider_email is null
    or trim(ea.provider_email) = ''
  );

-- Placeholder for any row still missing (should be rare)
update public.email_accounts
set
  provider_email = 'legacy+' || id::text || '@subi.local'
where
  provider_email is null
  or trim(provider_email) = '';

alter table public.email_accounts
  alter column provider_email set not null;

create unique index if not exists email_accounts_user_provider_email_uidx on public.email_accounts (
  user_id,
  provider,
  lower(trim(provider_email))
);

-- Link subscriptions to source mailbox (merchant name stays in subscriptions.provider)
alter table public.subscriptions
  add column if not exists email_account_id uuid references public.email_accounts (id) on delete set null;

create index if not exists subscriptions_user_email_account_id_idx on public.subscriptions (user_id, email_account_id);

update public.subscriptions s
set
  email_account_id = ea.id
from
  public.email_accounts ea
where
  s.user_id = ea.user_id
  and ea.provider = 'gmail'
  and s.source = 'gmail'
  and s.email_account_id is null
  and ea.id = (
    select
      id
    from
      public.email_accounts e2
    where
      e2.user_id = s.user_id
      and e2.provider = 'gmail'
    order by
      e2.created_at desc
    limit
      1
  );

comment on column public.subscriptions.email_account_id is 'Mailbox that produced this row; null for manual entries';
