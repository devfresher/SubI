"use client";

import type { BillingCadence, SubscriptionRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppAlertDialog, AppConfirmDialog } from "@/components/ui/app-dialogs";
import { EditBillingDateSheet } from "@/components/subscriptions/edit-billing-date-sheet";
import { daysUntilBillingInUserTimeZone } from "@/lib/subscriptions/billingCalendar";
import { compareRenewalsByDate } from "@/lib/subscriptions/renewalSort";
import {
  billingUrgency,
  urgencyBadgeClass,
  urgencyBadgeLabel,
  urgencyRailClass,
} from "@/lib/subscriptions/billingUrgency";
import { cn } from "@/lib/utils/strings";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

const CADENCE_LABEL: Record<BillingCadence, string> = {
  unknown: "Renewal pattern unknown",
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  custom: "Custom",
};

function formatMoney(amount: number | null, currency: string | null): string | null {
  if (amount == null) return null;
  const cur = currency && currency.length === 3 ? currency : "USD";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(amount);
  } catch {
    return `${amount} ${cur}`;
  }
}

function mailboxSectionKey(row: SubscriptionRow): string {
  return row.email_account_id ?? "manual";
}

function mailboxSectionLabel(rows: SubscriptionRow[]): string {
  const r0 = rows[0];
  if (!r0?.email_account_id) return "Manual";
  const m = r0.mailbox;
  if (!m) return "Inbox";
  const provLabel = m.provider === "gmail" ? "Gmail" : m.provider;
  const email =
    typeof m.provider_email === "string" && m.provider_email.trim() ? m.provider_email : "—";
  return `${provLabel} · ${email}`;
}

export type RenewalListSortMode = "soonest" | "calendar" | "name";

function sortRowsByMode(rows: SubscriptionRow[], timeZone: string, mode: RenewalListSortMode): SubscriptionRow[] {
  const next = [...rows];
  if (mode === "soonest") {
    next.sort((a, b) => compareRenewalsByDate(a, b, timeZone));
  } else if (mode === "calendar") {
    next.sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date));
  } else {
    next.sort((a, b) => (a.normalized_name || a.name).localeCompare(b.normalized_name || b.name));
  }
  return next;
}

function sortSectionKeys(keys: string[], byKey: Map<string, SubscriptionRow[]>): string[] {
  return [...keys].sort((a, b) => {
    if (a === "manual") return -1;
    if (b === "manual") return 1;
    const ea = byKey.get(a)?.[0]?.mailbox?.provider_email ?? "";
    const eb = byKey.get(b)?.[0]?.mailbox?.provider_email ?? "";
    return ea.localeCompare(eb);
  });
}

export function SubscriptionListClient({
  rows,
  timeZone,
  enableManualControl = true,
  renewalSort = "soonest",
}: {
  rows: SubscriptionRow[];
  timeZone: string;
  enableManualControl?: boolean;
  renewalSort?: RenewalListSortMode;
}) {
  const qc = useQueryClient();
  const [editTarget, setEditTarget] = useState<SubscriptionRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [ignoreConfirmForId, setIgnoreConfirmForId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const invalidateSubscriptions = () => {
    void qc.invalidateQueries({ queryKey: ["subscriptions"] });
  };

  async function patchSubscription(id: string, body: { status?: string; next_billing_date?: string }) {
    setBusyId(id);
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { message?: string } | null;
      setAlertMessage(j?.message ?? "Something went wrong.");
      return;
    }
    invalidateSubscriptions();
  }

  const sections = useMemo(() => {
    const byKey = new Map<string, SubscriptionRow[]>();
    for (const r of rows) {
      const k = mailboxSectionKey(r);
      const list = byKey.get(k) ?? [];
      list.push(r);
      byKey.set(k, list);
    }
    for (const [, list] of byKey) {
      if (renewalSort === "soonest") {
        list.sort((a, b) => compareRenewalsByDate(a, b, timeZone));
      } else if (renewalSort === "calendar") {
        list.sort((a, b) => a.next_billing_date.localeCompare(b.next_billing_date));
      } else {
        list.sort((a, b) => (a.normalized_name || a.name).localeCompare(b.normalized_name || b.name));
      }
    }
    const keys = sortSectionKeys([...byKey.keys()], byKey);
    return keys.map((k) => ({
      key: k,
      label: mailboxSectionLabel(byKey.get(k) ?? []),
      rows: byKey.get(k) ?? [],
    }));
  }, [rows, timeZone, renewalSort]);

  if (rows.length === 0) {
    return (
      <Card className="border border-border/60 border-dashed bg-card/40 text-center">
        <p className="font-medium text-foreground">Nothing matches</p>
        <p className="mt-2 text-sm text-muted">
          Try another filter, or add subscriptions from Gmail sync in Settings.
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-12">
        {sections.map(({ key, label, rows: sectionRows }) => {
          const groups = new Map<string, SubscriptionRow[]>();
          for (const r of sectionRows) {
            const list = groups.get(r.normalized_name) ?? [];
            list.push(r);
            groups.set(r.normalized_name, list);
          }

          return (
            <section key={key}>
              <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</h2>
              <div className="space-y-10">
                {Array.from(groups.entries()).map(([norm, rawItems]) => {
                  const items = sortRowsByMode(rawItems, timeZone, renewalSort);
                  return (
                  <div key={`${key}:${norm}`}>
                    <h3 className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                      <span className="text-foreground">{items[0]?.name ?? norm}</span>
                      {items.length > 1 ? (
                        <span className="rounded-md border border-border/80 bg-background/80 px-2 py-0.5 text-[10px] font-medium normal-case tabular-nums text-muted">
                          {items.length} entries
                        </span>
                      ) : null}
                    </h3>
                    <ul className="space-y-3">
                      {items.map((s: SubscriptionRow) => {
                        const days = daysUntilBillingInUserTimeZone(s.next_billing_date, timeZone);
                        const urgency = billingUrgency(days);
                        const source = s.source ?? "gmail";
                        const money = formatMoney(s.amount ?? null, s.currency ?? null);
                        const cadence = CADENCE_LABEL[s.billing_cadence ?? "unknown"] ?? CADENCE_LABEL.unknown;
                        const isIgnored = s.status === "ignored";
                        const loading = busyId === s.id;

                        return (
                          <li key={s.id}>
                            <Card
                              className={cn(
                                "relative overflow-hidden border-border/70 transition hover:border-border hover:bg-card-hover",
                                isIgnored && "border-dashed opacity-[0.92]",
                              )}
                            >
                              <div
                                className={cn("absolute left-0 top-0 h-full w-1", urgencyRailClass[urgency])}
                                aria-hidden
                              />
                              <div className="flex flex-col gap-4 border-l border-transparent pl-4 pr-4 py-4 sm:flex-row sm:items-stretch sm:justify-between sm:pl-5">
                                <div className="min-w-0 flex-1 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "rounded-md border px-2.5 py-1 text-[11px] font-semibold tabular-nums tracking-tight",
                                        urgencyBadgeClass[urgency],
                                      )}
                                    >
                                      {urgencyBadgeLabel(days)}
                                    </span>
                                    {isIgnored ? (
                                      <span className="rounded-md border border-border/80 bg-muted/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                                        Ignored
                                      </span>
                                    ) : null}
                                    <span
                                      className={cn(
                                        "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                        source === "manual"
                                          ? "border-gold/35 bg-gold-dim/35 text-foreground"
                                          : "border-border/80 bg-background/80 text-muted",
                                      )}
                                    >
                                      {source === "manual" ? "Manual" : "Inbox"}
                                    </span>
                                    <span className="text-[11px] text-muted">{cadence}</span>
                                    {money ? (
                                      <span className="text-sm font-semibold tabular-nums text-foreground">{money}</span>
                                    ) : null}
                                  </div>
                                  <p className="text-lg font-semibold leading-snug tracking-tight text-foreground">
                                    {s.name}
                                  </p>
                                  <p className="text-sm text-muted">
                                    Renews{" "}
                                    <span className="font-medium tabular-nums text-foreground">
                                      {s.next_billing_date}
                                    </span>
                                  </p>
                                  {s.notes ? (
                                    <p className="line-clamp-2 text-xs text-muted/90" title={s.notes}>
                                      {s.notes}
                                    </p>
                                  ) : null}

                                  {enableManualControl ? (
                                    <div className="flex flex-wrap gap-2 border-t border-border/40 pt-3">
                                      {isIgnored ? (
                                        <Button
                                          type="button"
                                          variant="secondary"
                                          disabled={loading}
                                          className="text-xs"
                                          onClick={() =>
                                            void patchSubscription(s.id, { status: "active" })
                                          }
                                        >
                                          {loading ? "…" : "Mark as subscription"}
                                        </Button>
                                      ) : (
                                        <>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            disabled={loading}
                                            className="text-xs text-muted hover:text-foreground"
                                            onClick={() => setEditTarget(s)}
                                          >
                                            Edit date
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            disabled={loading}
                                            className="border-danger/35 text-xs text-danger hover:bg-danger/10 hover:text-danger"
                                            onClick={() => setIgnoreConfirmForId(s.id)}
                                          >
                                            {loading ? "…" : "Ignore"}
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex shrink-0 flex-col justify-center gap-2 sm:items-end sm:pl-2">
                                  {s.cancel_url ? (
                                    <a
                                      href={s.cancel_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border-2 border-gold-bright/90 bg-gold-bright px-4 py-2.5 text-center text-sm font-semibold !text-zinc-950 shadow-sm transition hover:brightness-110 focus-visible:outline focus-visible:ring-2 focus-visible:ring-gold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-card dark:border-gold-bright dark:bg-gold-bright dark:!text-zinc-950"
                                    >
                                      Manage with provider
                                    </a>
                                  ) : (
                                    <span className="text-center text-[11px] font-medium text-muted sm:text-right">
                                      No provider link on file
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {editTarget ? (
        <EditBillingDateSheet
          open={!!editTarget}
          subscriptionId={editTarget.id}
          subscriptionName={editTarget.name}
          currentYmd={editTarget.next_billing_date}
          onClose={() => setEditTarget(null)}
          onSaved={invalidateSubscriptions}
        />
      ) : null}

      <AppConfirmDialog
        open={ignoreConfirmForId !== null}
        title="Ignore this item?"
        description="It stays in your account but won’t receive reminders or appear in your active list. You can restore it from the Ignored tab anytime."
        confirmLabel="Ignore"
        cancelLabel="Cancel"
        dangerConfirm
        onCancel={() => setIgnoreConfirmForId(null)}
        onConfirm={() => {
          const id = ignoreConfirmForId;
          setIgnoreConfirmForId(null);
          if (id) void patchSubscription(id, { status: "ignored" });
        }}
      />

      <AppAlertDialog
        open={alertMessage !== null}
        title="Couldn’t update"
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />
    </>
  );
}
