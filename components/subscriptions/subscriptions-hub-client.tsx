"use client";

import type { SubscriptionRow } from "@/types";
import { AddSubscriptionSheet } from "@/components/subscriptions/add-subscription-sheet";
import type { RenewalListSortMode } from "@/components/subscriptions/subscription-list-client";
import { SubscriptionListClient } from "@/components/subscriptions/subscription-list-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldControlClass } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { useSubscriptionQuery } from "@/hooks/useSubscriptionQuery";
import { getEmailProviderLabel } from "@/lib/email-providers/registry";
import { cn } from "@/lib/utils/strings";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const TABS: { id: "active" | "ignored" | "all"; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "ignored", label: "Ignored" },
  { id: "all", label: "All" },
];

export function SubscriptionsHubClient({
  timeZone,
  initialAll,
}: {
  timeZone: string;
  initialAll: SubscriptionRow[];
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<"active" | "ignored" | "all">("active");
  const [search, setSearch] = useState("");
  const [mailbox, setMailbox] = useState("all");
  const [renewalSort, setRenewalSort] = useState<RenewalListSortMode>("soonest");
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useSubscriptionQuery("all", initialAll);
  const rows = useMemo(() => data ?? [], [data]);

  const mailboxOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "all", label: "All sources" },
      { value: "manual", label: "Manual only" },
    ];
    const seen = new Set<string>(["all", "manual"]);
    for (const r of rows) {
      if (r.email_account_id && !seen.has(r.email_account_id)) {
        seen.add(r.email_account_id);
        const m = r.mailbox;
        const prov =
          m?.provider != null ? getEmailProviderLabel(m.provider) : "Inbox";
        const em =
          typeof m?.provider_email === "string" && m.provider_email.trim() ? m.provider_email : "—";
        opts.push({ value: r.email_account_id, label: `${prov} · ${em}` });
      }
    }
    return opts;
  }, [rows]);

  const filtered = useMemo(() => {
    let out = rows;
    if (tab !== "all") out = out.filter((s) => s.status === tab);
    const q = search.trim().toLowerCase();
    if (q) out = out.filter((s) => s.name.toLowerCase().includes(q) || s.normalized_name.toLowerCase().includes(q));
    if (mailbox === "manual") out = out.filter((s) => !s.email_account_id);
    else if (mailbox !== "all") out = out.filter((s) => s.email_account_id === mailbox);
    return out;
  }, [rows, tab, search, mailbox]);

  return (
    <div className="space-y-10">
      <div className="border-b border-border/50 pb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">Portfolio</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Subscriptions
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          Review renewals with clarity. Inbox parsing can be wrong—use{" "}
          <span className="font-medium text-foreground">Ignore</span>,{" "}
          <span className="font-medium text-foreground">Mark as subscription</span>, and{" "}
          <span className="font-medium text-foreground">Edit date</span> to stay in control.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-border/60 bg-card/80 p-1 shadow-premium">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold transition sm:text-sm",
                tab === t.id
                  ? "bg-gold-dim/55 text-foreground shadow-sm ring-1 ring-gold/25"
                  : "text-muted hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" type="button" onClick={() => setSheetOpen(true)} className="w-full shrink-0 sm:w-auto">
          Add manually
        </Button>
      </div>

      <div className="rounded-2xl border border-border/50 bg-gradient-to-b from-card/90 to-card/40 p-1 shadow-premium sm:p-1.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          <div className="relative min-h-[3rem] flex-1 sm:min-w-0">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
              </svg>
            </span>
            <input
              id="sub-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by service name"
              className={cn(
                fieldControlClass,
                "h-12 w-full rounded-xl border-border/60 bg-background/80 pl-11 pr-4 text-sm shadow-inner",
              )}
              aria-label="Search subscriptions"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:max-w-md md:shrink-0">
            <Select
              id="sub-mailbox"
              value={mailbox}
              onChange={(e) => setMailbox(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-background/80 text-sm shadow-inner"
              wrapperClassName="min-w-0"
              aria-label="Filter by source"
            >
              {mailboxOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <Select
              id="sub-sort"
              value={renewalSort}
              onChange={(e) => setRenewalSort(e.target.value as RenewalListSortMode)}
              className="h-12 rounded-xl border-border/60 bg-background/80 text-sm shadow-inner"
              wrapperClassName="min-w-0"
              aria-label="Sort renewals"
            >
              <option value="soonest">Soonest first · overdue last</option>
              <option value="calendar">By next billing date</option>
              <option value="name">Name A–Z</option>
            </Select>
          </div>
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

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : isError ? (
        <Card className="border-danger/35 bg-danger/5 p-6">
          <p className="text-sm text-danger">Could not load subscriptions.</p>
          <Button variant="ghost" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="border border-dashed border-border/60 bg-card/40 p-10 text-center">
          <p className="font-medium text-foreground">No subscriptions yet</p>
          <p className="mt-2 text-sm text-muted">
            Add one manually or connect Gmail under Settings → Mailboxes and run a sync—then curate with Ignore / Edit date when
            the importer is unsure.
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-border/50 bg-card/50 p-8 text-center">
          <p className="font-medium text-foreground">No matches</p>
          <p className="mt-2 text-sm text-muted">Adjust filters or search, or switch to another tab.</p>
        </Card>
      ) : (
        <SubscriptionListClient rows={filtered} timeZone={timeZone} enableManualControl renewalSort={renewalSort} />
      )}
    </div>
  );
}
