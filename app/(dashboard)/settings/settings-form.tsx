"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { fieldLabelClass, fieldLegendClass } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { REMINDER_OFFSETS_BY_PLAN } from "@/lib/plan/entitlements";
import type { UserPlan } from "@/types";
import Link from "next/link";
import { useState } from "react";

const ALL_OFFSETS = [1, 3, 7, 14] as const;

export function SettingsForm({
  timezones,
  initialTimezone,
  initialReminders,
  plan,
}: {
  timezones: string[];
  initialTimezone: string;
  initialReminders: number[];
  plan: UserPlan;
}) {
  const allowed = REMINDER_OFFSETS_BY_PLAN[plan];
  const initialActive = initialReminders.filter((d) => allowed.includes(d));

  const [timezone, setTimezone] = useState(initialTimezone);
  const [day1, setDay1] = useState(initialActive.includes(1));
  const [day3, setDay3] = useState(initialActive.includes(3));
  const [day7, setDay7] = useState(initialActive.includes(7));
  const [day14, setDay14] = useState(initialActive.includes(14));
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setMsg(null);
    setErr(null);
    const reminder_preferences = [
      day1 ? 1 : null,
      day3 ? 3 : null,
      plan === "pro" ? (day7 ? 7 : null) : null,
      plan === "pro" ? (day14 ? 14 : null) : null,
    ].filter((x): x is number => x !== null);
    if (reminder_preferences.length === 0) {
      setErr("Select at least one reminder.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, reminder_preferences }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: unknown } | null;
      setErr(typeof j?.error === "string" ? j.error : "Could not save settings.");
      return;
    }
    setMsg("Saved.");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">Preferences</h2>
        <p className="mt-1 text-sm text-muted">
          Timezone and how many days before a renewal we email you. Options depend on your plan — see{" "}
          <Link href="/pricing" className="font-medium text-gold-bright underline-offset-2 hover:underline">
            Pricing
          </Link>
          .
        </p>
      </div>
      <Card className="space-y-6 border-border/60">
        <div>
          <label htmlFor="tz" className={fieldLabelClass}>
            Timezone
          </label>
          <Select id="tz" value={timezone} onChange={(e) => setTimezone(e.target.value)} wrapperClassName="mt-1.5">
            {timezones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </Select>
        </div>
        <fieldset className="rounded-2xl border border-border/45 bg-gold-dim/12 p-4 dark:bg-gold-dim/8">
          <legend className={fieldLegendClass}>Remind me before billing</legend>
          <p className="mt-2 text-xs text-muted">
            {plan === "free"
              ? "Free includes 1 and 3 days before. Pro adds a full week and two weeks out."
              : "Choose any combination of the options below."}
          </p>
          <div className="mt-3 space-y-3">
            {ALL_OFFSETS.map((offset) => {
              const eligible = allowed.includes(offset);
              const checked =
                offset === 1 ? day1 : offset === 3 ? day3 : offset === 7 ? day7 : day14;
              const setChecked =
                offset === 1
                  ? setDay1
                  : offset === 3
                    ? setDay3
                    : offset === 7
                      ? setDay7
                      : setDay14;
              const label =
                offset === 1 ? "1 day before" : `${offset} days before`;
              return (
                <div key={offset} className="flex flex-wrap items-center gap-2">
                  <Checkbox
                    id={`rem-${offset}`}
                    checked={checked}
                    disabled={!eligible}
                    onChange={(e) => setChecked(e.target.checked)}
                  >
                    {label}
                  </Checkbox>
                  {!eligible ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Pro —{" "}
                      <Link href="/pricing" className="text-gold-bright underline-offset-2 hover:underline">
                        Pricing
                      </Link>
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
        {err ? <p className="text-sm text-danger">{err}</p> : null}
        {msg ? <p className="text-sm font-medium text-gold-bright">{msg}</p> : null}
        <Button variant="primary" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </Card>
    </div>
  );
}
