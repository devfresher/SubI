"use client";

import { AppAlertDialog } from "@/components/ui/app-dialogs";
import { Button } from "@/components/ui/button";
import { formatMoneyAmount, formatPerMonthFromYearly } from "@/lib/pricing/format";
import { cn } from "@/lib/utils/strings";
import type { UserPlan } from "@/types";
import type { BillingInterval, PricingCurrency, PricingPlanPublic, PricingQuotePublic } from "@/types/pricing";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

const CURRENCIES: { code: PricingCurrency; label: string }[] = [
  { code: "NGN", label: "Naira" },
  { code: "USD", label: "US Dollar" },
];

function pickQuote(
  quotes: PricingQuotePublic[],
  planKey: PricingQuotePublic["plan_key"],
  currency: PricingCurrency,
  interval: BillingInterval,
): PricingQuotePublic | undefined {
  return quotes.find((q) => q.plan_key === planKey && q.currency === currency && q.billing_interval === interval);
}

function CurrencyIcon({ currency }: { currency: PricingCurrency }) {
  const isUsd = currency === "USD";
  return (
    <span
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full border text-[15px] font-semibold tabular-nums shadow-sm",
        isUsd
          ? "border-emerald-500/35 bg-gradient-to-br from-emerald-500/20 via-card to-card text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/35 bg-gradient-to-br from-amber-500/20 via-card to-card text-amber-800 dark:text-amber-200",
      )}
      aria-hidden
    >
      {isUsd ? (
        <span className="font-display text-lg font-semibold leading-none">$</span>
      ) : (
        <span className="font-display text-lg leading-none">₦</span>
      )}
    </span>
  );
}

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-2xl border border-border/70 bg-card/60 p-1 shadow-inner">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative rounded-xl px-4 py-2.5 text-sm font-medium transition",
              active
                ? "bg-gold-bright text-background shadow-md dark:text-background"
                : "text-muted hover:text-foreground",
            )}
          >
            {opt.label}
            {opt.hint ? (
              <span
                className={cn(
                  "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  active ? "bg-background/20 text-background" : "bg-gold-dim/40 text-gold-bright",
                )}
              >
                {opt.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function FeatureRow({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-relaxed text-muted">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold-dim/30 text-gold-bright"
        aria-hidden
      >
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}

export function PricingExperience({
  plans,
  quotes,
  currentPlan,
  isLoggedIn,
  paystackCheckoutReady,
}: {
  plans: PricingPlanPublic[];
  quotes: PricingQuotePublic[];
  currentPlan: UserPlan | null;
  isLoggedIn: boolean;
  /** Server: PAYSTACK_SECRET_KEY set; checkout still fails until plan envs are filled. */
  paystackCheckoutReady: boolean;
}) {
  const [currency, setCurrency] = useState<PricingCurrency>("NGN");
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingAlert, setBillingAlert] = useState<string | null>(null);

  const planByKey = useMemo(() => Object.fromEntries(plans.map((p) => [p.plan_key, p])), [plans]);

  const monthlyPro = pickQuote(quotes, "pro", currency, "month");
  const yearlyPro = pickQuote(quotes, "pro", currency, "year");

  const annualSavingsPct = useMemo(() => {
    if (!monthlyPro || !yearlyPro || monthlyPro.unit_amount_minor <= 0) return null;
    const full = monthlyPro.unit_amount_minor * 12;
    if (full <= 0) return null;
    const pct = Math.round((1 - yearlyPro.unit_amount_minor / full) * 100);
    return pct > 0 ? pct : null;
  }, [monthlyPro, yearlyPro]);

  const activeProQuote = interval === "month" ? monthlyPro : yearlyPro;

  const intervalOptions = useMemo(() => {
    const opts: { value: BillingInterval; label: string; hint?: string }[] = [{ value: "month", label: "Monthly" }];
    if (annualSavingsPct != null) {
      opts.push({ value: "year", label: "Yearly", hint: `Save ${annualSavingsPct}%` });
    } else {
      opts.push({ value: "year", label: "Yearly" });
    }
    return opts;
  }, [annualSavingsPct]);

  const freePlan = planByKey.free;
  const proPlan = planByKey.pro;

  const startSubiProCheckout = useCallback(async () => {
    setBillingAlert(null);
    setBillingBusy(true);
    const paystackInterval = interval === "month" ? ("monthly" as const) : ("annually" as const);
    try {
      const res = await fetch("/api/billing/pro-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingInterval: paystackInterval,
          currency,
        }),
      });
      const json = (await res.json()) as { error?: string; authorizationUrl?: string };
      if (!res.ok || !json.authorizationUrl) {
        setBillingAlert(typeof json.error === "string" ? json.error : "Could not start SubI Pro checkout.");
        setBillingBusy(false);
        return;
      }
      window.location.href = json.authorizationUrl;
    } catch {
      setBillingAlert("Network error starting checkout.");
      setBillingBusy(false);
    }
  }, [interval, currency]);

  if (!plans.length) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-muted">
          Pricing catalog isn&apos;t available yet. Run the latest database migration, then refresh this page.
        </p>
      </main>
    );
  }

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.16),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(212,175,55,0.12),transparent_55%)]"
        aria-hidden
      />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-bright">Plans & pricing</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Simple pricing for calm renewals
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
            Choose billing cadence and currency. Rates are pulled from our live catalog.
          </p>
        </div>

        <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-6 sm:max-w-none sm:flex-row sm:justify-center sm:gap-10">
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Currency</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CURRENCIES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setCurrency(code)}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-4 py-3 text-left transition",
                    currency === code
                      ? "border-gold/50 bg-gold-dim/25 shadow-premium ring-1 ring-gold/20"
                      : "border-border/70 bg-card/50 hover:border-gold/25",
                  )}
                  aria-pressed={currency === code}
                  aria-label={`${label}, ${code}`}
                >
                  <CurrencyIcon currency={code} />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{code}</span>
                    <span className="text-xs text-muted">{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Billing</p>
            <ToggleGroup value={interval} onChange={setInterval} options={intervalOptions} label="Billing period" />
          </div>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {freePlan ? (
            <article
              className={cn(
                "flex flex-col rounded-3xl border bg-card/80 p-8 shadow-premium backdrop-blur-sm outline outline-2 -outline-offset-2 transition-[outline-color]",
                currentPlan === "free"
                  ? "border-gold/40 outline-gold/50 ring-1 ring-gold/25"
                  : "border-border/60 outline-transparent",
              )}
              aria-current={currentPlan === "free" ? "true" : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-foreground">{freePlan.display_name}</h2>
                  {freePlan.subtitle ? <p className="mt-2 text-sm text-muted">{freePlan.subtitle}</p> : null}
                </div>
                {isLoggedIn && currentPlan === "free" ? (
                  <span className="shrink-0 rounded-full border border-gold/35 bg-gold-dim/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-bright ring-1 ring-gold/25">
                    Your plan
                  </span>
                ) : null}
              </div>
              <div className="mt-8">
                <p className="flex items-baseline gap-1 font-display text-5xl font-bold tabular-nums tracking-tight text-foreground">
                  {formatMoneyAmount(currency, 0)}
                </p>
                <p className="mt-1 text-sm text-muted">Free tier. No card to start.</p>
              </div>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {freePlan.feature_bullets.map((line) => (
                  <FeatureRow key={line}>{line}</FeatureRow>
                ))}
              </ul>
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className="mt-10 inline-flex w-full items-center justify-center rounded-xl border border-border/90 bg-gold-dim/50 px-4 py-6 text-base font-semibold tracking-tight text-foreground shadow-sm transition hover:border-gold/35 hover:bg-gold-dim/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Get started free
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="mt-10 inline-flex w-full items-center justify-center rounded-xl border border-border/90 bg-transparent px-4 py-6 text-base font-semibold tracking-tight text-foreground shadow-sm transition hover:border-gold/35 hover:bg-gold-dim/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Back to dashboard
                </Link>
              )}
            </article>
          ) : null}

          {proPlan ? (
            <article
              className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-b p-8 shadow-premium-lg backdrop-blur-md outline outline-2 -outline-offset-2 transition-[outline-color]",
                "from-gold-dim/25 via-card/95 to-card dark:from-gold-dim/15 dark:via-card/90 dark:to-card",
                currentPlan === "pro"
                  ? "border-gold/55 outline-gold/55 ring-2 ring-gold/35"
                  : "border-gold/30 outline-transparent ring-1 ring-gold/15",
              )}
              aria-current={currentPlan === "pro" ? "true" : undefined}
            >
              {isLoggedIn && currentPlan === "pro" ? (
                <span className="absolute right-6 top-6 rounded-full border border-gold/40 bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-bright backdrop-blur-sm dark:bg-background/60">
                  Your plan
                </span>
              ) : proPlan.badge_label ? (
                <span className="absolute right-6 top-6 rounded-full border border-gold/40 bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gold-bright backdrop-blur-sm dark:bg-background/50">
                  {proPlan.badge_label}
                </span>
              ) : null}
              <div className="pr-24">
                <h2 className="font-display text-2xl font-semibold text-foreground">{proPlan.display_name}</h2>
                {proPlan.subtitle ? <p className="mt-2 text-sm text-muted">{proPlan.subtitle}</p> : null}
              </div>
              <div className="mt-8">
                {activeProQuote ? (
                  <>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      {activeProQuote.compare_at_amount_minor != null &&
                      activeProQuote.compare_at_amount_minor > activeProQuote.unit_amount_minor ? (
                        <span className="text-lg font-medium tabular-nums text-muted line-through decoration-border">
                          {formatMoneyAmount(currency, activeProQuote.compare_at_amount_minor)}
                        </span>
                      ) : null}
                      <p className="font-display text-5xl font-bold tabular-nums tracking-tight text-foreground">
                        {formatMoneyAmount(currency, activeProQuote.unit_amount_minor)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {interval === "month" ? "Per month · cancel anytime" : "Per year · "}
                      {interval === "year" ? (
                        <>
                          <span className="font-medium text-foreground">
                            {formatPerMonthFromYearly(currency, activeProQuote.unit_amount_minor)}
                          </span>{" "}
                          / month billed annually
                        </>
                      ) : null}
                    </p>
                  </>
                ) : (
                  <p className="text-muted">We&apos;re updating this combo. Check back shortly.</p>
                )}
              </div>
              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {proPlan.feature_bullets.map((line) => (
                  <FeatureRow key={line}>{line}</FeatureRow>
                ))}
              </ul>
              {currentPlan === "pro" ? (
                <p className="mt-10 text-center text-sm text-muted">You&apos;re on Pro. Thanks for the support.</p>
              ) : !isLoggedIn ? (
                <Link
                  href={`/login?next=${encodeURIComponent("/pricing")}`}
                  className="mt-10 inline-flex w-full items-center justify-center rounded-xl bg-gold-bright px-4 py-6 text-base font-semibold text-background shadow-premium ring-1 ring-black/5 transition hover:brightness-110 dark:text-background"
                >
                  Sign in to upgrade to SubI Pro
                </Link>
              ) : (
                <Button
                  variant="primary"
                  type="button"
                  disabled={billingBusy || !paystackCheckoutReady || !activeProQuote}
                  className="mt-10 w-full py-6 text-base shadow-premium"
                  onClick={() => void startSubiProCheckout()}
                >
                  {billingBusy ? "Redirecting…" : "Upgrade to SubI Pro"}
                </Button>
              )}
              <p className="mt-4 text-center text-xs text-muted">
                <span className="font-medium text-foreground">Billing note:</span> this charges your SubI Pro workspace
                (mailboxes &amp; reminders). It is unrelated to tracked services listed under{" "}
                <Link href="/subscriptions" className="font-medium text-gold-bright underline-offset-2 hover:underline">
                  Subscriptions
                </Link>
                .
                {!isLoggedIn || currentPlan === "pro"
                  ? null
                  : !paystackCheckoutReady
                    ? " Checkout is unavailable until billing is configured."
                    : ""}
              </p>
            </article>
          ) : null}
        </div>

        <p className="mx-auto mt-16 max-w-2xl text-center text-xs leading-relaxed text-muted">
          Mailbox sync is available today. Additional providers will appear in Settings when OAuth is ready. Taxes may
          apply by region. The total at checkout is final.
        </p>
      </main>

      <AppAlertDialog
        open={billingAlert !== null}
        title="Checkout"
        message={billingAlert ?? ""}
        onClose={() => setBillingAlert(null)}
      />
    </div>
  );
}
