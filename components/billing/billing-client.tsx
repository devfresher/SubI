"use client";

import { AppConfirmDialog } from "@/components/ui/app-dialogs";
import type { BillingLedgerEntryRow } from "@/types";
import { formatISO, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

function formatMinor(amountMinor: number | null, currency: string | null): string {
  if (amountMinor == null) return "—";
  const cur = currency?.trim().toUpperCase() ?? "";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: cur && cur.length === 3 ? cur : "NGN",
    }).format(amountMinor / 100);
  } catch {
    return `${(amountMinor / 100).toFixed(2)} ${cur || ""}`.trim();
  }
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return formatISO(parseISO(iso), { representation: "date" });
  } catch {
    return iso;
  }
}

function formatSubscriptionStatus(raw: string | null): string {
  if (!raw?.trim()) return "—";
  const s = raw.trim().toLowerCase();
  if (s === "active") return "Active";
  if (s === "non-renewing" || s === "non_renewing") return "Ends after current period";
  if (s === "cancelled" || s === "canceled") return "Cancelled";
  return s
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const ACTIVITY_LABEL: Record<string, string> = {
  "charge.success": "Payment received",
  "subscription.create": "Subscription started",
  "subscription.enable": "Subscription active",
  "subscription.not_renew": "Renewal turned off",
  "subscription.disable": "Subscription ended",
  "invoice.create": "Invoice issued",
  "invoice.update": "Invoice updated",
  "invoice.success": "Invoice paid",
  "invoice.failure": "Invoice issue",
  "invoice.payment_failed": "Payment did not complete",
};

function activityLabel(eventType: string): string {
  return ACTIVITY_LABEL[eventType] ?? "Update";
}

function kindLabel(kind: BillingLedgerEntryRow["kind"]): string {
  if (kind === "payment") return "Payment";
  if (kind === "invoice") return "Invoice";
  return "Subscription";
}

function shortenDetail(s: string | null): string {
  if (!s) return "—";
  const t = s.trim();
  if (t.length <= 14) return t;
  return `…${t.slice(-8)}`;
}

export function BillingClient({
  ledger,
  plan,
  paystackStatus,
}: {
  ledger: BillingLedgerEntryRow[];
  plan: "free" | "pro";
  paystackStatus: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"cancel" | "manage" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  async function openManageLink() {
    setBusy("manage");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/manage-link");
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setMessage(json.error ?? "Couldn't open your billing portal. Try again in a moment.");
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(null);
    }
  }

  async function confirmCancelSubscription() {
    setCancelConfirmOpen(false);
    setBusy("cancel");
    setMessage(null);
    try {
      const res = await fetch("/api/billing/subscription/cancel", { method: "POST" });
      const json = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error ?? "Couldn't turn off renewal. Try again.");
        return;
      }
      setMessage(json.message ?? "Renewal turned off.");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  const showSubscriberActions =
    plan === "pro" &&
    (paystackStatus === "active" ||
      paystackStatus === "non-renewing" ||
      paystackStatus === "non_renewing" ||
      !paystackStatus);

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm backdrop-blur sm:p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Your SubI plan</h2>
        <p className="mt-1 text-sm text-muted">
          Manage your subscription, payment method, and renewal. Activity below is your recent billing history from us.
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Plan</dt>
            <dd className="mt-0.5 font-medium capitalize text-foreground">{plan === "pro" ? "Pro" : "Free"}</dd>
          </div>
          <div>
            <dt className="text-muted">Renewal</dt>
            <dd className="mt-0.5 font-medium text-foreground">{formatSubscriptionStatus(paystackStatus)}</dd>
          </div>
        </dl>

        {plan === "free" ? (
          <div className="mt-6">
            <Link
              href="/pricing"
              className="inline-flex rounded-xl border border-gold/40 bg-gold-dim/30 px-4 py-2.5 text-sm font-semibold text-gold-bright transition hover:bg-gold-dim/50"
            >
              View plans
            </Link>
          </div>
        ) : null}

        {plan === "pro" ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openManageLink}
              disabled={busy !== null}
              className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-gold/30 disabled:opacity-50"
            >
              {busy === "manage" ? "Opening…" : "Payment & renewal"}
            </button>
            {showSubscriberActions ? (
              <button
                type="button"
                onClick={() => setCancelConfirmOpen(true)}
                disabled={busy !== null}
                className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger/18 disabled:opacity-50"
              >
                {busy === "cancel" ? "Working…" : "Turn off renewal"}
              </button>
            ) : null}
          </div>
        ) : null}

        {message ? <p className="mt-4 text-sm text-muted">{message}</p> : null}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-foreground">Activity</h2>
        <p className="mt-1 text-sm text-muted">
          Charges, invoices, and subscription changes tied to your account.
        </p>

        <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border/60 bg-gold-dim/15">
              <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">What happened</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No activity yet — when you subscribe or pay, entries will appear here shortly.
                  </td>
                </tr>
              ) : (
                ledger.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0 hover:bg-gold-dim/10">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatWhen(row.occurred_at)}</td>
                    <td className="px-4 py-3">{kindLabel(row.kind)}</td>
                    <td className="max-w-[220px] px-4 py-3 text-foreground">{activityLabel(row.event_type)}</td>
                    <td className="px-4 py-3">{formatSubscriptionStatus(row.status) || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {formatMinor(row.amount_minor, row.currency)}
                    </td>
                    <td className="max-w-[120px] truncate px-4 py-3 text-xs text-muted" title={(row.reference ?? row.invoice_code ?? row.subscription_code) ?? undefined}>
                      {shortenDetail(row.reference ?? row.invoice_code ?? row.subscription_code)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AppConfirmDialog
        open={cancelConfirmOpen}
        title="Turn off renewal?"
        description="Your Pro access may continue until the end of the period you already paid for. You can subscribe again anytime from Pricing."
        confirmLabel="Turn off renewal"
        cancelLabel="Keep Pro"
        dangerConfirm
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => void confirmCancelSubscription()}
      />
    </div>
  );
}
