"use client";

import type { SubscriptionRow } from "@/types";
import { AddSubscriptionSheet } from "@/components/subscriptions/add-subscription-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import {
  billingUrgency,
  urgencyBadgeClass,
  urgencyBadgeLabel,
  urgencyRailClass,
} from "@/lib/subscriptions/billingUrgency";
import { daysUntilBillingInUserTimeZone } from "@/lib/subscriptions/billingCalendar";
import { compareRenewalsByDate } from "@/lib/subscriptions/renewalSort";
import { cn } from "@/lib/utils/strings";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function DashboardClient({
  initialSubscriptions,
  timeZone,
  hasGmail,
}: {
  initialSubscriptions: SubscriptionRow[];
  timeZone: string;
  hasGmail: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useSubscriptions(initialSubscriptions);

  const upcoming = useMemo(() => {
    const list = data ?? [];
    return [...list]
      .filter((s) => {
        const days = daysUntilBillingInUserTimeZone(s.next_billing_date, timeZone);
        return days <= 14;
      })
      .sort((a, b) => compareRenewalsByDate(a, b, timeZone))
      .slice(0, 8);
  }, [data, timeZone]);

  const activeCount = data?.length ?? 0;

  return (
    <div className="space-y-12">
      <div className="border-b border-border/50 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Overview</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Renewal timeline and quick actions. Your full catalog—with filters and manual controls—is on{" "}
          <Link href="/subscriptions" className="font-semibold text-foreground underline-offset-4 hover:underline">
            Subscriptions
          </Link>
          .
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/80 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Active tracked</p>
          <p className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">{activeCount}</p>
        </Card>
        <Card className="border-border/60 bg-card/80 p-5 sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Next 14 days</p>
          <p className="mt-2 text-sm text-muted">
            Items renewing soon appear here. Review urgency on the full list and correct dates when imports miss.
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-foreground">Upcoming renewals</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" type="button" onClick={() => setSheetOpen(true)} className="text-xs sm:text-sm">
            Add manually
          </Button>
          <Link
            href="/subscriptions"
            className="inline-flex items-center justify-center rounded-xl border border-border/90 bg-transparent px-4 py-2.5 text-xs font-semibold text-foreground shadow-sm transition hover:border-gold/35 hover:bg-gold-dim/25 sm:text-sm"
          >
            Open subscriptions
          </Link>
        </div>
      </div>

      <AddSubscriptionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={() => {
          void qc.invalidateQueries({ queryKey: ["subscriptions"] });
          void refetch();
        }}
      />

      {!hasGmail ? (
        <p className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-muted">
          Connect Gmail in{" "}
          <Link href="/settings" className="font-semibold text-foreground underline-offset-2 hover:underline">
            Settings
          </Link>{" "}
          to import hints—then curate them on Subscriptions.
        </p>
      ) : null}

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}
      {isError && (
        <Card className="border-danger/35 bg-danger/5">
          <p className="text-sm text-danger">Could not load data.</p>
          <Button variant="ghost" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      )}

      {!isLoading && !isError && upcoming.length === 0 ? (
        <Card className="border border-dashed border-border/60 bg-card/40 p-8 text-center">
          <p className="font-medium text-foreground">No renewals in the next two weeks</p>
          <p className="mt-2 text-sm text-muted">
            Add subscriptions or sync Gmail. When something is due, it will surface here with urgency.
          </p>
        </Card>
      ) : null}

      {!isLoading && !isError && upcoming.length > 0 ? (
        <ul className="space-y-2">
          {upcoming.map((s) => {
            const days = daysUntilBillingInUserTimeZone(s.next_billing_date, timeZone);
            const urgency = billingUrgency(days);
            return (
              <li key={s.id}>
                <Link href="/subscriptions">
                  <Card className="group relative overflow-hidden border-border/70 transition hover:border-gold/30 hover:bg-card-hover">
                    <div
                      className={cn("absolute left-0 top-0 h-full w-1", urgencyRailClass[urgency])}
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3 pl-4 pr-4 py-4 sm:pl-5">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground group-hover:text-gold-bright">{s.name}</p>
                        <p className="mt-1 text-sm tabular-nums text-muted">
                          Next {s.next_billing_date}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-semibold tabular-nums",
                          urgencyBadgeClass[urgency],
                        )}
                      >
                        {urgencyBadgeLabel(days)}
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
