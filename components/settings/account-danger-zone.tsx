"use client";

import { SettingsSectionHeading } from "@/components/settings/settings-layout-primitives";
import { AppConfirmDialog } from "@/components/ui/app-dialogs";
import { fieldControlClass } from "@/components/ui/form-primitives";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils/strings";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DELETE_PHRASE = "DELETE MY ACCOUNT";

export function AccountDangerZone({ email }: { email: string | undefined }) {
  const router = useRouter();
  const [phrase, setPhrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const phraseOk = phrase === DELETE_PHRASE;
  const canRequest = phraseOk && !loading;

  async function executeDelete() {
    setConfirmOpen(false);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: DELETE_PHRASE }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6 pb-4">
      <SettingsSectionHeading
        eyebrow="Closure"
        title="Delete workspace"
        description="Permanently remove your SubI data—the kind of irreversible decision we only take when you insist."
      />

      <div className="relative overflow-hidden rounded-2xl border border-danger/30 bg-gradient-to-br from-danger/[0.07] via-card/40 to-muted/40 p-[1px] shadow-premium dark:border-danger/28 dark:from-danger/[0.1] dark:via-card dark:to-background/55">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-gradient-to-b from-danger via-danger to-danger/55 opacity-95"
          aria-hidden
        />
        <div className="relative rounded-[0.965rem] border border-border/25 bg-background/70 px-6 py-7 backdrop-blur-sm dark:border-border/20 dark:bg-background/45 sm:px-8 sm:py-8">
          <p className="text-sm leading-relaxed text-muted">
            Ends everything for{" "}
            <span className="font-semibold text-foreground">{email ?? "this account"}</span>
            —subscriptions you track here, mailbox links, reminders, and billing snapshots stored in SubI. Services you
            pay for outside SubI are still yours to cancel elsewhere.
          </p>
          <label className="mt-6 block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Type phrase to unlock
            </span>
            <input
              type="text"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              autoComplete="off"
              className={cn(
                fieldControlClass,
                "mt-2 h-12 rounded-xl border-border/70 bg-background/95 shadow-inner",
                "focus:border-danger/45 focus:ring-danger/15",
              )}
              placeholder={DELETE_PHRASE}
            />
          </label>
          {error ? <p className="mt-4 text-sm font-medium text-danger">{error}</p> : null}
          <button
            type="button"
            onClick={() => {
              if (!phraseOk) {
                setError(`Type "${DELETE_PHRASE}" exactly.`);
                return;
              }
              setError(null);
              setConfirmOpen(true);
            }}
            disabled={!canRequest}
            className="mt-6 min-h-[2.65rem] rounded-xl border border-danger bg-danger px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Deleting…" : "Delete my account forever"}
          </button>
        </div>
      </div>

      <AppConfirmDialog
        open={confirmOpen}
        title="Delete your SubI account?"
        description="This cannot be undone. If you have an active paid SubI plan, cancel renewal from Billing first so you aren’t charged again depending on billing timing."
        confirmLabel="Yes, delete forever"
        cancelLabel="Keep my account"
        dangerConfirm
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void executeDelete()}
      />
    </section>
  );
}
