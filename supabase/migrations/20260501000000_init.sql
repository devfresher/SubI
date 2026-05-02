-- SubI core schema + RLS

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  timezone text not null default 'UTC',
  reminder_preferences int[] not null default array[1, 3]::int[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null,
  encrypted_access_token text not null,
  encrypted_refresh_token text not null,
  token_expires_at timestamptz,
  gmail_history_id text,
  sync_in_progress boolean not null default false,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  provider text,
  next_billing_date date not null,
  cancel_url text,
  status text not null check (status in ('active', 'ignored')),
  source_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  notify_at timestamptz not null,
  status text not null check (status in ('pending', 'sent', 'failed')),
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notifications_attempt_non_negative check (attempt_count >= 0)
);

create unique index notifications_pending_subscription_notify_at on public.notifications (
  subscription_id,
  notify_at
)
where
  status = 'pending';

create index email_accounts_user_id_idx on public.email_accounts (user_id);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create index subscriptions_user_status_idx on public.subscriptions (user_id, status);

create index subscriptions_next_bill_idx on public.subscriptions (next_billing_date);

create index notifications_pending_notify_at_idx on public.notifications (notify_at)
where
  status = 'pending';

create index notifications_user_sub_idx on public.notifications (user_id, subscription_id);

alter table public.users enable row level security;

alter table public.email_accounts enable row level security;

alter table public.subscriptions enable row level security;

alter table public.notifications enable row level security;

create policy users_select on public.users for select using (auth.uid () = id);

create policy users_update on public.users for update using (auth.uid () = id);

create policy users_insert on public.users for insert with check (auth.uid () = id);

create policy email_accounts_all on public.email_accounts for all using (auth.uid () = user_id);

create policy subscriptions_all on public.subscriptions for all using (auth.uid () = user_id);

create policy notifications_all on public.notifications for all using (auth.uid () = user_id);

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, timezone, reminder_preferences)
  values (new.id, new.email, 'UTC', array[1, 3]::int[])
  on conflict (id) do update
  set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();

create or replace function public.sync_user_email ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set
    email = new.email,
    updated_at = now()
  where
    id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users for each row
execute procedure public.sync_user_email ();
