"use client";

import { SettingsSectionHeading, SettingsSurface } from "@/components/settings/settings-layout-primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppConfirmDialog } from "@/components/ui/app-dialogs";
import { EMAIL_SYNC_PROVIDER_REGISTRY, getEmailProviderLabel } from "@/lib/email-providers/registry";
import { cn } from "@/lib/utils/strings";
import type { EmailAccountRow, UserPlan } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const pricingCtaLinkClass = cn(
  "inline-flex min-h-[2.75rem] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight transition",
  "bg-gold-bright text-background shadow-premium ring-1 ring-black/5 hover:brightness-110",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  "active:scale-[0.98] dark:text-background dark:ring-white/10 dark:hover:brightness-110",
);

function maskMailboxEmail(email: string | null | undefined): string {
  const s = typeof email === "string" ? email.trim() : "";
  if (!s) return "•••";
  const at = s.indexOf("@");
  if (at === -1) return "•••";
  const local = s.slice(0, at);
  const domain = s.slice(at + 1);
  if (!domain) return "•••";
  const vis = local.slice(0, 2);
  return `${vis}•••@${domain}`;
}

function formatSyncedAt(iso: string | null): string {
  if (!iso) return "Never synced";
  try {
    return `Last synced ${new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`;
  } catch {
    return "Last synced";
  }
}

export function SettingsMailboxes({
  initialAccounts,
  plan,
}: {
  initialAccounts: EmailAccountRow[];
  plan: UserPlan;
}) {
  const q = useSearchParams();
  const router = useRouter();
  const gmailFlag = q.get("gmail");
  const [accounts, setAccounts] = useState(initialAccounts);
  const [err, setErr] = useState<string | null>(null);
  const [pendingSyncId, setPendingSyncId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [disconnectConfirmId, setDisconnectConfirmId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const gmailAccounts = accounts.filter((a) => a.provider === "gmail");
  const atFreeMailboxCap = plan === "free" && gmailAccounts.length >= 1;
  const lockedProviders = EMAIL_SYNC_PROVIDER_REGISTRY.filter(
    (p) => p.status === "coming" && (p.id === "outlook" || p.id === "yahoo"),
  );

  const syncMailbox = (emailAccountId: string) => {
    setErr(null);
    setPendingSyncId(emailAccountId);
    startTransition(async () => {
      const res = await fetch("/api/sync/gmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAccountId }),
      });
      setPendingSyncId(null);
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        setErr(j?.error ?? "Sync failed.");
        return;
      }
      router.refresh();
    });
  };

  const disconnect = (emailAccountId: string) => {
    setDisconnectConfirmId(emailAccountId);
  };

  const runDisconnect = (emailAccountId: string) => {
    setErr(null);
    setPendingDeleteId(emailAccountId);
    startTransition(async () => {
      const res = await fetch(`/api/email-accounts/${emailAccountId}`, { method: "DELETE" });
      setPendingDeleteId(null);
      if (!res.ok) {
        setErr("Could not disconnect.");
        return;
      }
      setAccounts((prev) => prev.filter((a) => a.id !== emailAccountId));
      router.refresh();
    });
  };

  return (
    <section className="space-y-6">
      <SettingsSectionHeading
        eyebrow="Sources"
        title="Mailboxes"
        description={
          <>
            Link mailboxes by provider—<span className="font-medium text-foreground">Gmail</span> is available now; others land
            here when ready. SubI suggests renewals from messages in each connected inbox.{" "}
            <span className="font-medium text-foreground">
              Free: one inbox, aligned with how you signed in unless you upgrade.
            </span>{" "}
            Sync runs on demand from each card below.
          </>
        }
      />

      <SettingsSurface>
        <div className="space-y-4">
          {gmailFlag === "connected" && (
            <div className="rounded-xl border border-gold/35 bg-gold-dim/30 px-4 py-3 text-sm text-foreground shadow-sm dark:border-gold/25 dark:bg-gold-dim/15">
              Gmail connected. Tap <strong>Sync</strong> on your Gmail card when you want the latest receipts parsed.
            </div>
          )}
          {gmailFlag === "limit" && (
            <div className="rounded-xl border border-gold/40 bg-gold-dim/25 px-4 py-3 text-sm text-foreground shadow-sm dark:border-gold/30 dark:bg-gold-dim/12">
              You’ve reached the inbox limit on your plan.{" "}
              <Link href="/pricing" className="font-semibold text-gold-bright underline-offset-2 hover:underline">
                Pro
              </Link>{" "}
              adds more mailboxes for power users.
            </div>
          )}
          {gmailFlag === "email_mismatch" && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger dark:bg-danger/[0.12]">
              On Free, Gmail must match your SubI login email—or{" "}
              <Link href="/pricing" className="font-semibold text-gold-bright underline-offset-2 hover:underline">
                upgrade
              </Link>{" "}
              for flexibility.
            </div>
          )}
          {gmailFlag === "taken" && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger dark:bg-danger/[0.12]">
              That Gmail inbox is already tied to another SubI account. Use a different Gmail address, or disconnect it from the other
              profile first.
            </div>
          )}
          {(gmailFlag === "error" ||
            gmailFlag === "state_error" ||
            gmailFlag === "no_refresh" ||
            gmailFlag === "no_email") && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger dark:bg-danger/[0.12]">
              Gmail didn’t finish connecting. Confirm Google OAuth redirects and scopes, then try again.
            </div>
          )}

          {err ? (
            <div className="rounded-xl border border-danger/40 bg-danger/[0.08] px-4 py-3 text-sm font-medium text-danger">
              {err}
            </div>
          ) : null}

          <div className="space-y-3 pt-1">
            {gmailAccounts.map((a) => (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-2xl border border-border/55 bg-gradient-to-br from-card/95 via-card/90 to-gold-dim/15 shadow-premium transition hover:border-border/80 hover:shadow-premium-lg dark:to-gold-dim/10"
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-gold-bright via-gold to-gold-bright/40 opacity-90"
                  aria-hidden
                />
                <div className="relative flex flex-col gap-5 border-l border-transparent pl-5 pr-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:pl-6 sm:pr-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-gold/30 bg-gold-dim/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-bright">
                        {getEmailProviderLabel(a.provider)}
                      </span>
                      <span className="text-xs text-muted">{formatSyncedAt(a.last_sync_at)}</span>
                    </div>
                    <p className="mt-2 font-display text-lg font-semibold tracking-tight text-foreground">
                      {maskMailboxEmail(a.provider_email)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      variant="primary"
                      type="button"
                      disabled={pendingSyncId === a.id}
                      onClick={() => syncMailbox(a.id)}
                      className="min-h-[2.65rem] min-w-[6.25rem]"
                    >
                      {pendingSyncId === a.id ? "Syncing…" : "Sync"}
                    </Button>
                    <Button
                      variant="ghost"
                      type="button"
                      disabled={pendingDeleteId === a.id}
                      onClick={() => disconnect(a.id)}
                      className="min-h-[2.65rem] text-muted"
                    >
                      {pendingDeleteId === a.id ? "…" : "Disconnect"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/65 bg-muted/15 p-[1px] dark:bg-muted/10">
              <div className="rounded-[0.875rem] bg-gradient-to-br from-background/95 to-card/80 px-5 py-5 sm:px-6 sm:py-6 dark:from-background/40 dark:to-card/60">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
                      Connect another
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                      {atFreeMailboxCap
                        ? "Your current plan supports one Gmail inbox here. Unlock more destinations on Pro."
                        : "Google opens for consent—SubI asks for Gmail read-only access to spot subscription hints."}
                    </p>
                  </div>
                  {atFreeMailboxCap ? (
                    <Link href="/pricing" className={cn(pricingCtaLinkClass, "w-full shrink-0 sm:w-auto")}>
                      Unlock Pro mailboxes
                    </Link>
                  ) : (
                    <a href="/api/gmail/auth" className={cn(pricingCtaLinkClass, "w-full shrink-0 text-center sm:w-auto")}>
                      Connect Gmail
                    </a>
                  )}
                </div>
              </div>
            </div>

            {lockedProviders.map((p) => (
              <Card key={p.id} className="border border-border/35 border-dashed bg-muted/10 p-5 opacity-95 shadow-none">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{p.label}</p>
                    <p className="mt-1 text-sm text-muted">On the roadmap—check back soon.</p>
                  </div>
                  <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-border/50 bg-background/50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Soon
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </SettingsSurface>

      <p className="text-xs leading-relaxed text-muted">
        Your parsed services live under{" "}
        <Link href="/subscriptions" className="font-medium text-gold-bright underline-offset-2 hover:underline">
          Subscriptions
        </Link>
        .
      </p>

      <AppConfirmDialog
        open={disconnectConfirmId !== null}
        title="Disconnect mailbox?"
        description="Subscriptions we already inferred stay on your list. You can reconnect Gmail anytime from Mailboxes."
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        dangerConfirm
        onCancel={() => setDisconnectConfirmId(null)}
        onConfirm={() => {
          const id = disconnectConfirmId;
          setDisconnectConfirmId(null);
          if (id) runDisconnect(id);
        }}
      />
    </section>
  );
}
