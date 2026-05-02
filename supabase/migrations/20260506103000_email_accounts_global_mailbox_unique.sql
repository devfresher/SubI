-- Prevent the same mailbox (provider + inbox address) from being linked to more than one SubI user.

drop index if exists public.email_accounts_user_provider_email_uidx;

create unique index if not exists email_accounts_global_provider_mailbox_uidx on public.email_accounts (
  provider,
  lower(trim(provider_email))
);

comment on index public.email_accounts_global_provider_mailbox_uidx is 'One Gmail/Outlook/etc. inbox address globally per deployment.';
