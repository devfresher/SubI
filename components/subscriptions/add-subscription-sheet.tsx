"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fieldLabelClass, fieldLegendClass } from "@/components/ui/form-primitives";
import { DatePickerField } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CADENCE_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "weekly", label: "Weekly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "custom", label: "Custom" },
  { value: "unknown", label: "Not sure" },
] as const;

const REMINDER_PRESETS = [1, 3, 7, 14, 30];

export function AddSubscriptionSheet({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [cancelUrl, setCancelUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [billingCadence, setBillingCadence] = useState<string>("monthly");
  const [reminderSelection, setReminderSelection] = useState<number[]>([]);
  const [useDefaultReminders, setUseDefaultReminders] = useState(true);

  function toggleReminder(d: number) {
    setUseDefaultReminders(false);
    setReminderSelection((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!nextBillingDate.trim()) {
      setFormError("Choose a next billing date.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        next_billing_date: nextBillingDate,
        billing_cadence: billingCadence,
        cancel_url: cancelUrl.trim() || null,
        notes: notes.trim() || null,
        amount: amount.trim() === "" ? null : Number(amount),
        currency: currency.trim().length === 3 ? currency.trim().toUpperCase() : null,
        reminder_offsets:
          useDefaultReminders || reminderSelection.length === 0 ? null : reminderSelection,
      };
      const res = await fetch("/api/subscriptions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: unknown;
        message?: string;
      } | null;
      if (res.status === 409) {
        setFormError(data?.message ?? "You already track this subscription name.");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        setFormError("Could not save. Check the form and try again.");
        setSubmitting(false);
        return;
      }
      setName("");
      setNextBillingDate("");
      setCancelUrl("");
      setNotes("");
      setAmount("");
      setCurrency("USD");
      setBillingCadence("monthly");
      setReminderSelection([]);
      setUseDefaultReminders(true);
      onCreated();
      onClose();
      router.refresh();
    } catch {
      setFormError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-sub-title"
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card shadow-premium-lg sm:max-h-[85vh] sm:rounded-3xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur-sm">
          <h2 id="add-sub-title" className="font-display text-lg font-semibold text-foreground">
            Add subscription
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted hover:bg-gold-dim/40 hover:text-foreground"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-5 sm:space-y-5 sm:px-6 sm:py-6">
          <p className="text-sm text-muted">
            Track a plan manually. Name must be unique among active subscriptions (same as Gmail imports).
          </p>

          {formError ? (
            <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {formError}
            </div>
          ) : null}

          <div>
            <label htmlFor="sub-name" className={fieldLabelClass}>
              Name <span className="text-danger">*</span>
            </label>
            <Input
              id="sub-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix"
            />
          </div>

          <div>
            <label htmlFor="sub-date" className={fieldLabelClass}>
              Next billing date <span className="text-danger">*</span>
            </label>
            <div className="mt-1.5">
              <DatePickerField
                id="sub-date"
                value={nextBillingDate}
                onChange={setNextBillingDate}
                placeholder="Select renewal date"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sub-amt" className={fieldLabelClass}>
                Amount
              </label>
              <Input
                id="sub-amt"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="sub-cur" className={fieldLabelClass}>
                Currency
              </label>
              <Input
                id="sub-cur"
                maxLength={3}
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="uppercase"
                placeholder="USD"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sub-cadence" className={fieldLabelClass}>
              Billing cadence
            </label>
            <Select
              id="sub-cadence"
              value={billingCadence}
              onChange={(e) => setBillingCadence(e.target.value)}
            >
              {CADENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label htmlFor="sub-url" className={fieldLabelClass}>
              Manage / cancel URL
            </label>
            <Input id="sub-url" type="url" value={cancelUrl} onChange={(e) => setCancelUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label htmlFor="sub-notes" className={fieldLabelClass}>
              Notes
            </label>
            <Textarea id="sub-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>

          <fieldset className="rounded-2xl border border-border/50 bg-gold-dim/15 p-4 dark:bg-gold-dim/10">
            <legend className={fieldLegendClass}>Reminders</legend>
            <div className="mt-1">
              <Checkbox
                id="sub-rem-default"
                checked={useDefaultReminders}
                onChange={(e) => {
                  setUseDefaultReminders(e.target.checked);
                  if (e.target.checked) setReminderSelection([]);
                }}
              >
                Use account defaults (Settings)
              </Checkbox>
            </div>
            {!useDefaultReminders ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {REMINDER_PRESETS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleReminder(d)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                      reminderSelection.includes(d)
                        ? "border-gold-bright/80 bg-gold-dim/70 text-foreground shadow-sm"
                        : "border-border/70 bg-card/60 text-muted hover:border-gold/35 hover:bg-gold-dim/30"
                    }`}
                  >
                    {d}d before
                  </button>
                ))}
              </div>
            ) : null}
          </fieldset>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Saving…" : "Save subscription"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
