-- Manual subscription fields + source; dedupe is enforced in application layer

alter table public.subscriptions
  add column if not exists source text not null default 'gmail'
    check (source in ('gmail', 'manual'));

alter table public.subscriptions
  add column if not exists notes text;

alter table public.subscriptions
  add column if not exists amount numeric(14, 2);

alter table public.subscriptions
  add column if not exists currency text;

alter table public.subscriptions
  add column if not exists billing_cadence text not null default 'unknown'
    check (
      billing_cadence in (
        'unknown',
        'weekly',
        'monthly',
        'quarterly',
        'yearly',
        'custom'
      )
    );

alter table public.subscriptions
  add column if not exists reminder_offsets int[];

comment on column public.subscriptions.source is 'gmail = from sync; manual = user entered';

comment on column public.subscriptions.reminder_offsets is 'Per-subscription days-before offsets; null = use user.reminder_preferences';
