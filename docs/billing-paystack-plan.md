# Paystack-backed SubI billing (lifecycle plan)

Aligned with Paystack’s [Subscriptions](https://paystack.com/docs/payments/subscriptions/) model: **plans** → **checkout / authorization** → **subscription** → **webhooks** → **app entitlements**.

## Naming in the codebase

- **`/subscriptions`** and **`SubscriptionRow`** = services the user tracks (Netflix-style renewals inside SubI).
- **`/pricing`**, **`/api/billing/*`**, **`PAYSTACK_SUBI_PRO_PLAN_*`** = **SubI Pro** billing (paying SubI for mailbox limits / reminder tiers).
- Prefer **“billing”**, **“SubI Pro”**, or **`users.plan`** when talking about app entitlements versus **merchant subscriptions** stored in `subscriptions`.

## Data you will add (beyond today’s pricing catalog)

Store on `users` or a dedicated `billing_subscriptions` row (recommended):

| Field | Purpose |
| ----- | ------- |
| `paystack_customer_code` | Stable customer (`CUS_*`) |
| `paystack_subscription_code` | Active Pro subscription (`SUB_*`) |
| `paystack_email_token` | Manage link / emailed flows |
| `paystack_plan_code_used` | Which `PLN_*` was purchased (month/year, currency-specific) |
| `billing_interval` | `month` \| `year` mirrors UI |
| `subscription_status` | Mirror Paystack (`active`, `non-renewing`, `attention`, `cancelled`, `completed`) |

Keep **product entitlements** (`users.plan` = `free` \| `pro`) as the gate for mailbox caps and reminders; update it **only from trusted paths** (webhook + authenticated server job after verify).

## 1 — Catalog sync (operators / migrations)

Paystack defines **plans** with `interval` (`monthly` / `annually`) and **`amount`** in smallest currency units (consistent with SubI `unit_amount_minor`).

- Maintain `pricing_quotes` in Supabase for display.
- Maintain matching **Paystack Plans** (`PLN_*`) — one per SKU (e.g. Pro NGN monthly, Pro USD yearly).
- Optionally add nullable `paystack_plan_code` on quotes or an internal mapping table so checkout never guesses codes.

## 2 — Upgrade (Free → Pro)

**Preferred flow for first-time subscribers:** [`transaction/initialize`](https://paystack.com/docs/api/transaction#initialize) with `plan: PLN_xxx`.

- Backend route creates/refreshes Paystack Customer with the user email.
- Returns `authorization_url`; client redirects.
- Paystack charges the plan amount; on **`charge.success`** + **`subscription.create`**, webhook handler sets `users.plan = 'pro'` and persists `subscription_code`, status, renewal dates.

**Alternative:** If the customer already has a reusable **`authorization`** from a prior charge, [**create subscription API**](https://paystack.com/docs/api/subscription#create) (`customer`, `plan`, optional `start_date`). Still requires webhook-driven reconciliation.

Record `billing_interval`, `currency`, and Stripe/Paystack customer idempotency metadata for support.

## 3 — Renewal & failures

Subscriptions **do not auto-retry** failed debits ([docs](https://paystack.com/docs/payments/subscriptions/)).

- Consume **`invoice.create`** (heads-up ~3 days before debit), **`invoice.update`**, **`charge.success`** / **`invoice.payment_failed`**.
- If status becomes **`attention`**, surface in-app messaging; use **`fetch subscription`** and `most_recent_invoice` for decline reasons.
- Pro policy: downgrade to Free after a grace policy you define, **or** keep Pro until period end once payment succeeds again.

Use **`subscription.expiring_cards`** to email/prompt users to update card before renewal.

## 4 — Changing plan / price

Updating a Paystack Plan has global effects; use **`update_existing_subscriptions`** carefully ([docs](https://paystack.com/docs/payments/subscriptions/)).

Operational pattern:

1. Ship new `PLN_*` for price changes where possible—subscribe **existing** users by cancel + new checkout, or use Paystack migrate tools only when you intend mass updates.
2. Keep Supabase quotes and Paystack amounts in sync for what **new** buyers see.

## 5 — Cancel & “manage billing”

- **`subscription/disable`** webhook when subscription ends ([docs](https://paystack.com/docs/payments/subscriptions/)).
- **`subscription.not_renew`** indicates cancel-at-period-end semantics.
- For self-serve UX: **`subscription/:code/manage/link`** opens Paystack hosted management (swap card / cancel).

App behavior after cancel:

1. Until period end Pro remains active **if Paystack keeps status active/non-renewing** per your UX contract.
2. On **`subscription.disable`** with entitlement loss, set `users.plan = 'free'` (and revoke over-cap mailboxes with prior notice if needed).

## 6 — Why webhooks matter

Treat webhooks as the **source of truth** after initial redirect (never trust query params alone). Verify Paystack signatures, handle idempotent delivery, and reconcile `users.plan` asynchronously.

Sequence reference: **`subscription.create`**, **`charge.success`** on first debit, then **`invoice.*`** cycles, **`subscription.disable`** / **`subscription.not_renew`** on exit—see Paystack subscription events table in their docs.

## 7 — Next implementation steps (engineering)

1. Server-only Paystack secret; env `PAYSTACK_SECRET_KEY` plus `PAYSTACK_SUBI_PRO_PLAN_{NGN|USD}_{MONTHLY|ANNUALLY}` (`PLN_*` from Paystack).
2. `POST /api/billing/pro-checkout` (authenticated) → `transaction/initialize` with `plan` → return Paystack **`authorization_url`**.
3. `POST /api/webhooks/paystack` → verify signature → update `billing_*` facts + `users.plan`.
4. Settings + Pricing “Upgrade” call checkout route.
5. Pro users: Settings link “Manage billing” calling **manage/link** endpoint and redirect.

This document is descriptive; entitlement rules (`lib/plan/entitlements.ts`) remain code until synced with stored subscription state.
