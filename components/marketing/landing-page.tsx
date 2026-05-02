"use client";

import { PremiumSectionHeading, PremiumSurface } from "@/components/settings/settings-layout-primitives";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { cn } from "@/lib/utils/strings";
import Link from "next/link";

const TRUST_ITEMS = [
  "Gmail is optional—you can run everything manually.",
  "Reminders follow your timezone and per-plan lead times.",
  "You approve what counts as a subscription; no blind automation.",
] as const;

const AUDIENCE = [
  {
    title: "Solo builders & freelancers",
    body:
      "You carry a dozen tools—analytics, CRM, AI, hosting. SubI gives you one ledger so invoices never ambush your month.",
    icon: LayersIcon,
  },
  {
    title: "Ops & finance-minded teams",
    body:
      "Need visibility without another enterprise stack? Delegate mailboxes per inbox, reconcile renewals centrally, cancel under pressure.",
    icon: CompassIcon,
  },
  {
    title: "Anyone tired of spreadsheets",
    body:
      "If chasing renewal emails in search isn’t sustainable, swap the chaos for structured dates, notes, and quiet alerts.",
    icon: ClipboardIcon,
  },
] as const;

const FEATURES = [
  {
    title: "Gmail-aware detection",
    body:
      "Surface renewal receipts alongside what you enter by hand—one list across mailboxes without duplicate noise.",
    Icon: MailIcon,
  },
  {
    title: "You stay in authority",
    body: "Dismiss misfires, confirm real subscriptions, correct dates—the system assists; you approve.",
    Icon: ShieldCheckIcon,
  },
  {
    title: "Timezone-smart reminders",
    body:
      "Default lead times respect your profile, or customise when a yearly hit needs an earlier ping.",
    Icon: ClockIcon,
  },
  {
    title: "Cancel links & context",
    body: "Manage URLs and notes sit next to every plan—no scrambling through archived threads.",
    Icon: LinkIconSvg,
  },
] as const;

const STEPS = [
  {
    step: "1",
    title: "Sign in with Google",
    body: "One identity for auth; connect Gmail from Settings whenever you’re ready—never forced upfront.",
  },
  {
    step: "2",
    title: "Add or let your inbox hint",
    body: "Type plans manually or run a Gmail sync—merge results into one polished roster grouped by mailbox.",
  },
  {
    step: "3",
    title: "Renew with foresight",
    body: "Skim urgency at a glance, then let email reminders land before Stripe or PayPal do.",
  },
] as const;

export function LandingPage() {
  return (
    <MarketingLayout>
      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pb-14 sm:pt-16 lg:pb-16 lg:pt-20">
          <div className="relative overflow-hidden rounded-3xl border border-border/35 bg-gradient-to-br from-card/90 via-background/65 to-card/80 p-[1px] shadow-premium backdrop-blur-sm dark:from-card/70 dark:to-card/40 dark:shadow-premium-lg sm:rounded-[1.85rem]">
            <div
              className="pointer-events-none absolute -right-[18%] -top-[55%] h-[min(28rem,90vw)] w-[min(28rem,90vw)] rounded-full bg-[radial-gradient(circle,var(--vault-glow-tl)_0%,transparent_68%)] opacity-95 dark:opacity-100"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-6 left-0 w-px bg-gradient-to-b from-transparent via-gold-bright/50 to-transparent sm:inset-y-8"
              aria-hidden
            />
            <div className="relative rounded-[calc(1.85rem-1px)] px-5 pb-10 pt-9 sm:px-10 sm:pb-14 sm:pt-12 lg:px-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-bright">
                For people who forgot which tab holds the renewal
              </p>
              <h1 className="mt-4 max-w-[20ch] font-display text-4xl font-bold leading-[1.08] tracking-tight text-balance sm:max-w-3xl sm:text-5xl lg:text-[3.35rem]">
                Know every renewal before it charges—not after the receipt.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted text-balance sm:text-xl">
                SubI is a composed subscription HQ: optional Gmail intelligence, tactile manual controls, reminders that feel luxurious,
                never nagging—built for anyone paying for SaaS like it&apos;s another utility bill.
              </p>
              <div className="mt-11 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-gold-bright px-6 py-3.5 text-sm font-semibold text-background shadow-premium transition hover:brightness-110 active:scale-[0.99] dark:text-background"
                >
                  Start free—no card
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card/80 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:border-gold/35 hover:bg-gold-dim/30"
                >
                  See plans
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-transparent px-6 py-3.5 text-sm font-medium text-muted transition hover:border-gold/25 hover:text-foreground"
                >
                  How it works
                </a>
              </div>
            </div>
          </div>

          <ul className="mt-10 flex flex-col gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
            {TRUST_ITEMS.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 text-sm leading-snug text-muted sm:max-w-[17rem] sm:items-center"
              >
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold-dim/40 text-gold-bright sm:mt-0"
                  aria-hidden
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Audience */}
        <section id="built-for" className="scroll-mt-24 section-rule-top py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <PremiumSectionHeading
              eyebrow="Audience"
              title="Built for people who own the software stack"
              description="Whether you’re self-employed or keeping a team lean, SubI respects how you work—no enterprise theatre, no guilt-tripping dashboards."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {AUDIENCE.map(({ title, body, icon: Icon }) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-b from-card/88 to-card/55 p-6 shadow-premium transition hover:border-gold/30 hover:shadow-premium-lg dark:from-card/60 dark:to-card/40"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim/45 text-gold-bright transition group-hover:border-gold/40"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="section-rule-top scroll-mt-24 bg-card/35 py-16 dark:bg-card/15 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <PremiumSectionHeading
              eyebrow="Product"
              title="Signals you can verify—then reminders you can trust"
              description={
                <>
                  Elegant obsidian styling carries through the app—not a bolt-on spreadsheet skin. Combine mailbox hints with decisive manual tuning.
                </>
              }
            />
            <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ title, body, Icon }) => (
                <li key={title}>
                  <PremiumSurface className="h-full">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim/45 text-gold-bright"
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                  </PremiumSurface>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <PremiumSurface>
              <div className="pb-6 sm:pb-8">
                <PremiumSectionHeading
                  eyebrow="Flow"
                  title="Three moves to reclaim the renewal calendar"
                  description="From first login to reminders, SubI stays out of your way until it needs to whisper."
                />
              </div>
              <ol className="grid gap-8 border-t border-border/25 pt-10 lg:grid-cols-3 lg:gap-10">
                {STEPS.map((s) => (
                  <li key={s.step} className="lg:pb-2">
                    <div className="flex gap-5">
                      <span className="flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-gradient-to-br from-gold-dim/60 to-gold-dim/35 font-display text-sm font-bold text-gold-bright shadow-sm">
                        {s.step}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </PremiumSurface>
          </div>
        </section>

        {/* Finale CTA */}
        <section className="section-rule-top pb-20 pt-8 sm:pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-gold-dim/35 via-card/80 to-background/90 p-[1px] shadow-premium dark:from-gold-dim/20 dark:to-card/50">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_85%_-10%,rgba(228,199,90,0.18),transparent_55%)]"
                aria-hidden
              />
              <div className="relative rounded-[calc(1.5rem-1px)] px-6 py-12 text-center sm:px-10 sm:py-14">
                <h2 className="mx-auto max-w-xl font-display text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                  Keep the stack you love—without surprise renewals
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-muted">
                  Sign in, connect mailboxes when you’re ready, and let SubI keep the optics clear across every subscription surface.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex min-w-[11rem] items-center justify-center rounded-xl bg-gold-bright px-8 py-3.5 text-sm font-semibold text-background shadow-premium transition hover:brightness-110 active:scale-[0.99] dark:text-background"
                  >
                    Open SubI
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-xl border border-border/90 bg-background/65 px-8 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:border-gold/40 dark:bg-background/25"
                  >
                    Compare tiers
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("text-gold-bright", className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      />
    </svg>
  );
}

function CompassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.65} d="M17 7l-3.5 8.5L7 17l3.5-8.5L17 7z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.65} d="M9 12h6m-6 4h4" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.65} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function LinkIconSvg({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
