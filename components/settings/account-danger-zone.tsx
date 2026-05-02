"use client";

import { AppConfirmDialog } from "@/components/ui/app-dialogs";
import { createClient } from "@/lib/supabase/client";
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
    <section className="rounded-2xl border border-danger/35 bg-danger/5 p-6">
      <h2 className="font-display text-lg font-semibold text-danger">Delete account</h2>
      <p className="mt-2 text-sm text-muted">
        This permanently deletes your SubI workspace for{" "}
        <span className="font-medium text-foreground">{email ?? "this account"}</span>
        {" — "}including tracked subscriptions, connected mailboxes, reminders, and billing activity stored in SubI. Canceling unrelated services you use outside SubI is still your responsibility.
      </p>
      <label className="mt-5 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Type confirmation phrase</span>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          autoComplete="off"
          className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-0 transition focus:border-danger/50"
          placeholder={DELETE_PHRASE}
        />
      </label>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
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
        className="mt-5 rounded-xl border border-danger bg-danger px-4 py-2.5 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Deleting…" : "Delete my account forever"}
      </button>

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
