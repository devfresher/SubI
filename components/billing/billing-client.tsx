"use client";

import { AppConfirmDialog } from "@/components/ui/app-dialogs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BillingLedgerEntryRow } from "@/types";
import { cn } from "@/lib/utils/strings";
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
  if (!raw?.trim()) return "Not set yet";
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

function kindChipClass(kind: BillingLedgerEntryRow["kind"]) {
  if (kind === "payment") {
    return "border-emerald-500/35 bg-emerald-500/[0.08] text-foreground dark:border-emerald-400/35 dark:bg-emerald-400/[0.1]";
  }
  if (kind === "invoice") {
    return "border-gold/35 bg-gold-dim/50 text-foreground dark:border-gold/40 dark:bg-gold-dim/30";
  }
  return "border-border/80 bg-muted/15 text-muted";
}

function rowStatusMuted(status: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (!s || s === "success" || s === "active") return "";
  if (s.includes("fail") || s.includes("cancel")) return "text-danger";
  return "text-muted";
}

function shortenDetail(s: string | null): string {
  if (!s) return "—";
  const t = s.trim();
  if (t.length <= 14) return t;
  return `…${t.slice(-8)}`;
}

/** Primary CTA as `Link` (avoid invalid `<a><button>` nesting). */
const pricingCtaLinkClass = cn(
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight transition",
  "bg-gold-bright text-background shadow-premium ring-1 ring-black/5 hover:brightness-110",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  "active:scale-[0.98] dark:text-background dark:ring-white/10 dark:hover:brightness-110",
);

function LedgerMobileRow({ row }: { row: BillingLedgerEntryRow }) {
  return (
    <Card className="border-border/55 bg-gradient-to-br from-card/95 to-card/60 p-4 shadow-premium">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
            kindChipClass(row.kind),
          )}
        >
          {kindLabel(row.kind)}
        </span>
        <span className="text-xs tabular-nums text-muted">{formatWhen(row.occurred_at)}</span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-snug text-foreground">{activityLabel(row.event_type)}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-border/40 pt-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Status</p>
          <p className={cn("mt-0.5 text-sm font-medium", rowStatusMuted(row.status))}>
            {formatSubscriptionStatus(row.status) || "—"}
          </p>
        </div>
        <p className="text-right text-lg font-semibold tabular-nums text-foreground">
          {formatMinor(row.amount_minor, row.currency)}
        </p>
      </div>
      <p
        className="mt-2 truncate font-mono text-[11px] text-muted/90"
        title={(row.reference ?? row.invoice_code ?? row.subscription_code) ?? undefined}
      >
        {shortenDetail(row.reference ?? row.invoice_code ?? row.subscription_code)}
      </p>
    </Card>
  );
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
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-br from-card/95 via-card/85 to-gold-dim/25 shadow-premium backdrop-blur-sm dark:from-card dark:via-card/95 dark:to-gold-dim/15 dark:shadow-premium-lg">
        <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-gold-bright via-gold to-gold-bright/50 opacity-95" aria-hidden />
        <div className="relative pl-6 pr-5 py-7 sm:pl-8 sm:pr-8 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">Your SubI plan</p>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
                  Manage your subscription, saved payment method, and renewal. Detailed history stays in the ledger below.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3.5 py-1 text-xs font-bold uppercase tracking-wide",
                    plan === "pro"
                      ? "border-gold/45 bg-gold-dim/50 text-gold-bright shadow-sm ring-1 ring-gold/15"
                      : "border-border/70 bg-muted/15 text-muted",
                  )}
                >
                  {plan === "pro" ? "Pro" : "Free"}
                </span>
                <span className="text-sm text-muted">·</span>
                <span className="text-sm text-muted">
                  Renewal:{" "}
                  <strong className="font-semibold text-foreground">{formatSubscriptionStatus(paystackStatus)}</strong>
                </span>
              </div>

              {message ? (
                <div
                  role="status"
                  className="rounded-xl border border-gold/30 bg-gold-dim/35 px-4 py-3 text-sm text-foreground dark:border-gold/25 dark:bg-gold-dim/20"
                >
                  {message}
                </div>
              ) : null}
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:flex-col xl:flex-row xl:flex-wrap lg:justify-end">
              {plan === "free" ? (
                <Link href="/pricing" className={cn(pricingCtaLinkClass, "w-full sm:w-auto")}>
                  View plans
                </Link>
              ) : null}
              {plan === "pro" ? (
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={busy !== null}
                    className="w-full min-h-[2.75rem] border-border/80 sm:w-auto"
                    onClick={openManageLink}
                  >
                    {busy === "manage" ? "Opening…" : "Payment & renewal"}
                  </Button>
                  {showSubscriberActions ? (
                    <Button
                      variant="outline"
                      type="button"
                      disabled={busy !== null}
                      className="w-full min-h-[2.75rem] border-danger/40 text-danger hover:border-danger hover:bg-danger/10 sm:w-auto"
                      onClick={() => setCancelConfirmOpen(true)}
                    >
                      {busy === "cancel" ? "Working…" : "Turn off renewal"}
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">History</p>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Activity</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
              Recent charges and subscription updates for your account.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Last {ledger.length} entries</p>
        </div>

        <div className="rounded-2xl border border-border/45 bg-gradient-to-b from-card/90 to-card/50 p-1 shadow-premium sm:p-1.5 dark:shadow-premium-lg">
          {ledger.length === 0 ? (
            <Card className="border-dashed border-border/65 bg-muted/10 py-14 text-center shadow-none">
              <p className="font-display text-lg font-semibold text-foreground">Nothing here yet</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                Once you subscribe or make a payment, your activity timeline will populate automatically.
              </p>
              {plan === "free" ? (
                <Link href="/pricing" className={cn(pricingCtaLinkClass, "mt-6")}>
                  Explore plans
                </Link>
              ) : null}
            </Card>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block md:rounded-xl md:border md:border-border/40 md:bg-background/40">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-gold-dim/20 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                      <th className="px-5 py-3.5 pl-6">Date</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">What happened</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right tabular-nums">Amount</th>
                      <th className="px-5 py-3.5 pr-6 font-normal">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((row, i) => (
                      <tr
                        key={row.id}
                        className={cn(
                          "border-b border-border/35 transition-colors last:border-0 hover:bg-gold-dim/25 dark:hover:bg-gold-dim/15",
                          i % 2 === 1 ? "bg-background/[0.35] dark:bg-background/[0.2]" : "",
                        )}
                      >
                        <td className="whitespace-nowrap px-5 py-3.5 pl-6 text-muted tabular-nums">{formatWhen(row.occurred_at)}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                              kindChipClass(row.kind),
                            )}
                          >
                            {kindLabel(row.kind)}
                          </span>
                        </td>
                        <td className="max-w-[260px] px-5 py-3.5 font-medium text-foreground">
                          {activityLabel(row.event_type)}
                        </td>
                        <td className={cn("px-5 py-3.5 font-medium", rowStatusMuted(row.status))}>
                          {formatSubscriptionStatus(row.status) || "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-foreground">
                          {formatMinor(row.amount_minor, row.currency)}
                        </td>
                        <td
                          className="max-w-[120px] truncate px-5 py-3.5 pr-6 font-mono text-[11px] text-muted"
                          title={(row.reference ?? row.invoice_code ?? row.subscription_code) ?? undefined}
                        >
                          {shortenDetail(row.reference ?? row.invoice_code ?? row.subscription_code)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-2 md:hidden">
                {ledger.map((row) => (
                  <LedgerMobileRow key={row.id} row={row} />
                ))}
              </div>
            </>
          )}
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
