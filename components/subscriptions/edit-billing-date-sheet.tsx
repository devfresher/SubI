"use client";

import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker";
import { fieldLabelClass } from "@/components/ui/form-primitives";
import { useEffect, useState } from "react";

export function EditBillingDateSheet({
  open,
  onClose,
  subscriptionId,
  subscriptionName,
  currentYmd,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  subscriptionId: string;
  subscriptionName: string;
  currentYmd: string;
  onSaved: () => void;
}) {
  const [date, setDate] = useState(currentYmd);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(currentYmd);
      setErr(null);
    }
  }, [open, currentYmd, subscriptionId]);

  if (!open) return null;

  async function save() {
    setErr(null);
    if (!date.trim()) {
      setErr("Choose a billing date.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ next_billing_date: date }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: unknown } | null;
      setErr(typeof j?.error === "string" ? j.error : "Could not update date.");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-background/85 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-bill-title"
        className="relative z-10 w-full max-w-md rounded-t-3xl border border-border bg-card p-6 shadow-premium-lg sm:rounded-3xl"
      >
        <h2 id="edit-bill-title" className="font-display text-lg font-semibold text-foreground">
          Edit renewal date
        </h2>
        <p className="mt-1 text-sm text-muted">
          <span className="font-medium text-foreground">{subscriptionName}</span> — parsing isn&apos;t perfect; adjust
          the next billing date when needed.
        </p>
        {err ? (
          <p className="mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{err}</p>
        ) : null}
        <div className="mt-5">
          <label htmlFor="edit-bill-date" className={fieldLabelClass}>
            Next billing date
          </label>
          <div className="mt-1.5">
            <DatePickerField id="edit-bill-date" value={date} onChange={setDate} placeholder="Select date" />
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="button" variant="primary" disabled={saving} onClick={() => void save()} className="w-full sm:w-auto">
            {saving ? "Saving…" : "Save date"}
          </Button>
        </div>
      </div>
    </div>
  );
}
