"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppConfirmDialog } from "@/components/ui/app-dialogs";
import { EMAIL_SYNC_PROVIDER_REGISTRY } from "@/lib/email-providers/registry";
import type { EmailAccountRow, UserPlan } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

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
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Mailboxes</h2>
        <p className="mt-1 text-sm text-muted">
          Connect Gmail to import subscription hints. Free plan: one mailbox, matching your sign-in email. Manage sync
          here—reminders still follow timezone settings below.
        </p>
      </div>

      {gmailFlag === "connected" && (
        <p className="rounded-xl border border-gold/30 bg-gold-dim/20 px-4 py-3 text-sm text-foreground">
          Gmail connected. Run <strong>Sync</strong> on a mailbox card when you want a fresh pass.
        </p>
      )}
      {gmailFlag === "limit" && (
        <p className="rounded-xl border border-gold/30 bg-gold-dim/15 px-4 py-3 text-sm text-foreground">
          Mailbox limit reached on your plan.{" "}
          <Link href="/pricing" className="font-semibold text-gold-bright underline-offset-2 hover:underline">
            Pro
          </Link>{" "}
          adds more inboxes.
        </p>
      )}
      {gmailFlag === "email_mismatch" && (
        <p className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-danger">
          On the free plan, Gmail must match your account email. Use the same Google address you signed in with, or
          see{" "}
          <Link href="/pricing" className="font-semibold text-gold-bright underline-offset-2 hover:underline">
            Pricing
          </Link>{" "}
          for Pro.
        </p>
      )}
      {(gmailFlag === "error" ||
        gmailFlag === "state_error" ||
        gmailFlag === "no_refresh" ||
        gmailFlag === "no_email") && (
        <p className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-danger">
          Gmail connection failed. Check Google OAuth settings and try again.
        </p>
      )}

      {err ? (
        <Card className="border-danger/40 bg-danger/10">
          <p className="text-sm text-danger">{err}</p>
        </Card>
      ) : null}

      <div className="space-y-3">
        {gmailAccounts.map((a) => (
          <Card key={a.id} className="space-y-4 border-border/70 p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Gmail</p>
                <p className="mt-1 font-medium text-foreground">{maskMailboxEmail(a.provider_email)}</p>
                <p className="mt-1 text-xs text-muted">{formatSyncedAt(a.last_sync_at)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  type="button"
                  disabled={pendingSyncId === a.id}
                  onClick={() => syncMailbox(a.id)}
                  className="sm:min-w-[5.5rem]"
                >
                  {pendingSyncId === a.id ? "Syncing…" : "Sync"}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  disabled={pendingDeleteId === a.id}
                  onClick={() => disconnect(a.id)}
                >
                  {pendingDeleteId === a.id ? "…" : "Disconnect"}
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <Card className="border-dashed border-border/80 bg-gold-dim/10 p-5 dark:bg-gold-dim/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">Add Gmail</p>
              <p className="mt-1 text-sm text-muted">
                {atFreeMailboxCap ? (
                  <>
                    Add more mailboxes on{" "}
                    <Link href="/pricing" className="font-medium text-gold-bright underline-offset-2 hover:underline">
                      Pro
                    </Link>
                    .
                  </>
                ) : (
                  "Opens Google consent to grant read-only Gmail access."
                )}
              </p>
            </div>
            {atFreeMailboxCap ? (
              <Link
                href="/pricing"
                className="inline-flex w-fit items-center rounded-full border border-gold/35 bg-gold-dim/30 px-3 py-1.5 text-xs font-semibold text-gold-bright hover:bg-gold-dim/45"
              >
                View Pro
              </Link>
            ) : (
              <a
                href="/api/gmail/auth"
                className="inline-flex items-center justify-center rounded-xl border border-gold-bright/40 bg-gold-dim/25 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-gold-dim/40"
              >
                Connect Gmail
              </a>
            )}
          </div>
        </Card>

        {lockedProviders.map((p) => (
          <Card
            key={p.id}
            className="border-border/50 bg-card/50 p-5 opacity-80 dark:bg-card/40"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">{p.label}</p>
                <p className="mt-1 text-sm text-muted">Coming soon.</p>
              </div>
              <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                Locked
              </span>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted">
        Gmail sync is available today. Other providers will roll out here when ready. Your subscriptions live on{" "}
        <Link href="/subscriptions" className="font-medium text-gold-bright underline-offset-2 hover:underline">
          Subscriptions
        </Link>
        .
      </p>

      <AppConfirmDialog
        open={disconnectConfirmId !== null}
        title="Disconnect mailbox?"
        description="Imported subscriptions stay on your list. You can reconnect Gmail later from Settings."
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
    </div>
  );
}
