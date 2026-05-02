# Domain rules

## `subscriptions.next_billing_date`

Type: **`date`** (calendar date).

Interpretation: the billing calendar day for the subscription **in the user’s IANA timezone** (`users.timezone`). It is not a raw “UTC midnight” instant.

## Reminder offsets

`users.reminder_preferences` is an `int[]` of whole days **before** that billing date (MVP free tier: only `1` and/or `3`).

## `notifications.notify_at`

Type: **`timestamptz`** (UTC instant).

Computation (see `lib/utils/reminders.ts`):

1. For each offset `d`, compute a reminder calendar date by subtracting `d` days from `next_billing_date` using **UTC calendar component math** on `YYYY-MM-DD` (MVP simplification documented here).
2. Interpret **09:00** on that date in `users.timezone` and convert to UTC via `date-fns-tz` `toDate`.

Never use the hosting server’s local timezone for interpretation.

## Notification deduplication

Partial unique index on `(subscription_id, notify_at)` where `status = 'pending'` prevents duplicate pending sends for the same instant.

## Attempts and failures

- `attempt_count` increments on each dispatch try from the Edge function.
- Max **2** attempts; then `status = 'failed'`.

## Duplicates

MVP **allows** duplicate subscription rows (same service, different emails). UI groups lightly by `normalized_name` (lowercase, trimmed).
