"use client";

import { SettingsSectionHeading, SettingsSurface } from "@/components/settings/settings-layout-primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { fieldLabelClass } from "@/components/ui/form-primitives";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils/strings";
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
    <section className="space-y-6">
      <SettingsSectionHeading
        eyebrow="Timing"
        title="Timezone & reminders"
        description={
          <>
            Renewal emails anchor to{" "}
            <span className="font-medium text-foreground">where you wake up</span>. Day offsets honor your{" "}
            <Link href="/pricing" className="font-semibold text-gold-bright underline-offset-2 hover:underline">
              plan tier
            </Link>
            —Pro unlocks a full week and two-week heads-ups.
          </>
        }
      />

      <SettingsSurface>
        <div className="space-y-8">
          <div>
            <label htmlFor="tz" className={fieldLabelClass}>
              Timezone
            </label>
            <Select
              id="tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              wrapperClassName="mt-2"
              className="h-12 rounded-xl border-border/60 bg-background/80 shadow-inner"
              aria-label="Timezone"
            >
              {timezones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </Select>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-border/45 bg-gradient-to-br from-gold-dim/30 via-transparent to-muted/15 p-[1px] dark:from-gold-dim/20",
            )}
          >
            <div className="rounded-[calc(1rem-1px)] bg-background/55 px-5 py-5 dark:bg-background/25 sm:px-6 sm:py-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
                Email reminders
              </p>
              <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted sm:text-sm">
                {plan === "free"
                  ? "Free includes 1- and 3-day nudges. Pro adds week-ahead planning."
                  : "Mix and match—we’ll honor every offset you toggle below."}
              </p>
              <div className="mt-5 space-y-3.5">
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
                  const label = offset === 1 ? "1 day before renewal" : `${offset} days before renewal`;
                  return (
                    <div
                      key={offset}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/30 bg-card/70 px-4 py-3 dark:bg-card/30",
                        eligible ? "opacity-100" : "opacity-85",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Checkbox
                          id={`rem-${offset}`}
                          checked={checked}
                          disabled={!eligible}
                          onChange={(e) => setChecked(e.target.checked)}
                        >
                          <span className="font-medium text-foreground">{label}</span>
                        </Checkbox>
                        {!eligible ? (
                          <span className="rounded-md border border-gold/25 bg-gold-dim/35 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            Pro •{" "}
                            <Link href="/pricing" className="text-gold-bright hover:underline">
                              Upgrade
                            </Link>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {err ? (
            <p className="rounded-xl border border-danger/35 bg-danger/10 px-4 py-2.5 text-sm text-danger">{err}</p>
          ) : null}
          {msg ? (
            <p className="rounded-xl border border-gold/35 bg-gold-dim/30 px-4 py-2.5 text-sm font-medium text-foreground dark:bg-gold-dim/18">
              {msg}
            </p>
          ) : null}

          <Button variant="primary" disabled={saving} onClick={save} className="min-h-[2.75rem] min-w-[8rem]">
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </SettingsSurface>
    </section>
  );
}
