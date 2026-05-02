import type { User } from "@supabase/supabase-js";

export type SubscriptionStatus = "active" | "ignored";

export type NotificationStatus = "pending" | "sent" | "failed";

export type SubscriptionSource = "gmail" | "manual";

export type UserPlan = "free" | "pro";

/** Inbound email / sync provider (mailbox), not the merchant/service name on a subscription row. */
export type EmailSyncProvider = "gmail" | "outlook" | "yahoo" | "imap_stub";

export type BillingCadence =
  | "unknown"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "custom";

export interface ProfileRow {
  id: string;
  email: string | null;
  timezone: string;
  reminder_preferences: number[];
  plan: UserPlan;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  paystack_email_token: string | null;
  paystack_subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

export type BillingLedgerKind = "payment" | "invoice" | "subscription";

export interface BillingLedgerEntryRow {
  id: string;
  user_id: string;
  dedupe_key: string;
  event_type: string;
  kind: BillingLedgerKind;
  status: string | null;
  amount_minor: number | null;
  currency: string | null;
  reference: string | null;
  invoice_code: string | null;
  subscription_code: string | null;
  occurred_at: string | null;
  summary: Record<string, unknown>;
  created_at: string;
}

export interface EmailAccountRow {
  id: string;
  user_id: string;
  provider: EmailSyncProvider;
  provider_email: string;
  provider_user_id: string | null;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  token_expires_at: string | null;
  gmail_history_id: string | null;
  sync_in_progress: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Nested mailbox summary for subscription list UI */
export type EmailAccountMailboxSummary = Pick<EmailAccountRow, "id" | "provider" | "provider_email">;

export interface SubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  normalized_name: string;
  /** Merchant / service label from receipt parsing (e.g. Netflix), not the email provider. */
  provider: string | null;
  email_account_id: string | null;
  next_billing_date: string;
  cancel_url: string | null;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  source_message_id: string | null;
  notes: string | null;
  amount: number | null;
  currency: string | null;
  billing_cadence: BillingCadence;
  reminder_offsets: number[] | null;
  created_at: string;
  updated_at: string;
  /** Populated when listing with mailbox join */
  mailbox?: EmailAccountMailboxSummary | null;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  subscription_id: string;
  notify_at: string;
  status: NotificationStatus;
  attempt_count: number;
  last_attempt_at: string | null;
  provider_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AuthUser = User;
