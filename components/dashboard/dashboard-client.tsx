"use client";

import type { SubscriptionRow } from "@/types";
import { PremiumSectionHeading, PremiumSurface } from "@/components/settings/settings-layout-primitives";
import { AddSubscriptionSheet } from "@/components/subscriptions/add-subscription-sheet";
import { Button } from "@/components/ui/button";
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

const subscriptionsLinkClass = cn(
  "inline-flex min-h-[2.65rem] shrink-0 items-center justify-center rounded-xl border border-border/80 px-4 py-2.5 text-sm font-semibold shadow-sm transition",
  "bg-background/50 hover:border-gold/40 hover:bg-gold-dim/35 hover:text-foreground",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
);

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
          Next two weeks on this page. Full list on{" "}
          <Link href="/subscriptions" className="font-semibold text-gold-bright underline-offset-4 hover:underline">
            Subscriptions
          </Link>
          .
        </p>
      </div>

      <PremiumSurface>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-border/35 bg-gradient-to-br from-card/95 via-card/90 to-gold-dim/25 p-[1px] dark:to-gold-dim/15">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-gold-bright via-gold to-gold-bright/35 opacity-[0.85]"
              aria-hidden
            />
            <div className="rounded-[calc(1rem-1px)] px-6 py-6 sm:py-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Tracked items</p>
              <p className="mt-4 font-display text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-[2.65rem]">
                {activeCount}
              </p>
              <p className="mt-3 text-xs leading-snug text-muted">Active plans you track here.</p>
            </div>
          </div>
          <div className="rounded-2xl border border-border/25 bg-muted/10 px-6 py-6 sm:col-span-2 sm:py-7 dark:bg-muted/[0.08]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
              Renewal window · 14 days
            </p>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Anything billing inside 14 days shows below. Fix dates on Subscriptions if something looks off.
            </p>
          </div>
        </div>
      </PremiumSurface>

      {!hasGmail ? (
        <PremiumSurface>
          <div className="rounded-xl border border-gold/30 bg-gold-dim/25 px-5 py-4 dark:border-gold/25 dark:bg-gold-dim/18">
          <p className="text-sm text-muted">
            Connect Gmail in{" "}
            <Link href="/settings" className="font-semibold text-gold-bright underline-offset-2 hover:underline">
              Settings → Mailboxes
            </Link>
            . Tune imports on{" "}
            <Link href="/subscriptions" className="font-semibold text-foreground underline-offset-2 hover:underline">
              Subscriptions
            </Link>
            .
          </p>
          </div>
        </PremiumSurface>
      ) : null}

      <section className="space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <PremiumSectionHeading
            eyebrow="Horizon"
            title="Upcoming renewals"
            description="Charges in the next 14 days, most urgent first."
          />
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" type="button" onClick={() => setSheetOpen(true)} className="min-h-[2.65rem]">
              Add manually
            </Button>
            <Link href="/subscriptions" className={subscriptionsLinkClass}>
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

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        )}

        {isError && (
          <PremiumSurface className="border-danger/25">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-danger">We couldn’t reach your subscriptions. Check your connection and retry.</p>
              <Button variant="ghost" onClick={() => refetch()} className="shrink-0 text-danger hover:bg-danger/10">
                Retry
              </Button>
            </div>
          </PremiumSurface>
        )}

        {!isLoading && !isError && upcoming.length === 0 ? (
          <PremiumSurface>
            <div className="border border-dashed border-border/55 bg-muted/15 py-14 text-center dark:bg-muted/[0.08]">
              <p className="font-display text-lg font-semibold text-foreground">Nothing due soon</p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                Nothing due in two weeks. Add a plan or connect Gmail under Settings, then sync.
              </p>
              <Link href="/subscriptions" className={cn(subscriptionsLinkClass, "mx-auto mt-8 inline-flex max-w-fit")}>
                Browse Subscriptions
              </Link>
            </div>
          </PremiumSurface>
        ) : null}

        {!isLoading && !isError && upcoming.length > 0 ? (
          <ul className="space-y-4">
            {upcoming.map((s) => {
              const days = daysUntilBillingInUserTimeZone(s.next_billing_date, timeZone);
              const urgency = billingUrgency(days);
              return (
                <li key={s.id}>
                  <Link href="/subscriptions" className="block">
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-br from-card/95 via-card/90 to-gold-dim/12 shadow-premium transition",
                        "hover:-translate-y-0.5 hover:border-gold/35 hover:to-gold-dim/25 hover:shadow-premium-lg dark:to-gold-dim/[0.08]",
                      )}
                    >
                      <div className={cn("absolute inset-y-0 left-0 w-1 rounded-l-2xl", urgencyRailClass[urgency])} aria-hidden />
                      <div className="flex flex-wrap items-center justify-between gap-4 border-l border-transparent pl-5 pr-5 py-5 sm:pl-6">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-md border border-border/40 bg-background/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted dark:bg-background/30">
                            {days <= 0 ? "Action" : days <= 3 ? "Imminent" : "Approaching"}
                          </span>
                          <p className="mt-2 truncate font-display text-xl font-semibold tracking-tight text-foreground lg:text-[1.35rem]">
                            {s.name}
                          </p>
                          <p className="mt-2 text-sm tabular-nums text-muted">
                            Next billing&nbsp;
                            <span className="font-medium text-foreground">{s.next_billing_date}</span>
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold tabular-nums shadow-sm sm:text-[13px]",
                            urgencyBadgeClass[urgency],
                          )}
                        >
                          {urgencyBadgeLabel(days)}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
