"use client";

import { PremiumSectionHeading } from "@/components/settings/settings-layout-primitives";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { cn } from "@/lib/utils/strings";
import Link from "next/link";

const HIGHLIGHTS = [
  {
    title: "Inbox hints",
    body: "Link a mailbox and we surface messages that look like renewals. You confirm, ignore, or edit. Nothing posts without your okay.",
    Icon: MailIcon,
  },
  {
    title: "Manual edits",
    body: "Add plans by hand, fix amounts and dates, dedupe by name. Spreadsheet brain is optional; structure is not.",
    Icon: PencilBoxIcon,
  },
  {
    title: "Reminders",
    body: "Email heads-ups before a charge, timed to your timezone. Tweak lead time when a yearly bill deserves an early ping.",
    Icon: ClockIcon,
  },
  {
    title: "Cancel links",
    body: "Keep billing and manage URLs beside each item so you are not hunting old threads when it is time to cancel.",
    Icon: LinkIconSvg,
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Sign in",
    body: "Open an account in a minute. Connecting a mailbox is a later step from Settings, not a gate at the door.",
  },
  {
    step: "02",
    title: "Sync or type",
    body: "Run inbox sync from mailboxes you approve, or enter renewals yourself. One list, sorted by what bills next.",
  },
  {
    step: "03",
    title: "Get reminded",
    body: "We notify you on your schedule so renewals are a choice, not a surprise line on a statement.",
  },
] as const;

function HeroLedgerMock({ className }: { className?: string }) {
  const rows = [
    { name: "Design suite", date: "Jun 12", amount: "$48" },
    { name: "Cloud host", date: "Jun 18", amount: "$89" },
    { name: "Analytics", date: "Jul 2", amount: "$120" },
  ];
  return (
    <div className={cn("relative w-full max-w-[22rem] lg:max-w-none", className)}>
      <div
        className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_30%_20%,var(--gold-glow),transparent_55%)] opacity-40 dark:opacity-55"
        aria-hidden
      />
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-premium-lg backdrop-blur-xl dark:bg-card/75">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/35 to-transparent" aria-hidden />
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">Due soon</span>
          <span className="rounded-full border border-gold/30 bg-gold-dim/40 px-2.5 py-0.5 text-[10px] font-semibold text-gold-bright">
            {rows.length} renewals
          </span>
        </div>
        <ul className="divide-y divide-border/30 px-3 py-2">
          {rows.map((row) => (
            <li
              key={row.name}
              className="flex items-center gap-3 px-2 py-3 first:pt-2 last:pb-2 sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                <p className="mt-0.5 text-[11px] tabular-nums text-muted">{row.date}</p>
              </div>
              <p className="shrink-0 font-display text-sm font-semibold tabular-nums text-gold-bright">{row.amount}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <MarketingLayout>
      <main className="relative z-10">
        {/* Hero */}
        <section className="relative mx-auto max-w-6xl px-4 pt-10 sm:px-6 sm:pt-14 lg:pt-16">
          <div className="relative overflow-hidden rounded-[1.75rem] border border-border/40 bg-gradient-to-br from-card/95 via-background/80 to-card/85 p-[1px] shadow-premium backdrop-blur-sm dark:from-card/80 dark:via-background/40 dark:to-card/50 sm:rounded-[2rem]">
            <div
              className="pointer-events-none absolute z-0 h-44 w-44 translate-x-[20%] -translate-y-[18%] rounded-full bg-[radial-gradient(circle,var(--vault-glow-tl)_0%,transparent_70%)] opacity-90 sm:h-72 sm:w-72 sm:translate-x-[40%] sm:-translate-y-[28%] lg:right-0 lg:top-0 lg:translate-x-[15%]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 z-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full border border-gold-bright/[0.07] dark:border-gold-bright/[0.05]"
              aria-hidden
            />
            <div className="relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-2 lg:py-2">
              <div className="px-5 pb-6 pt-10 sm:px-10 sm:pb-10 sm:pt-12 lg:px-12 lg:py-14">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-bright">Subscription ledger</p>
                <h1 className="mt-5 font-display text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.02]">
                  <span className="bg-gradient-to-br from-foreground via-foreground to-gold-bright/90 bg-clip-text text-transparent dark:to-gold-bright/80">
                    Renewals,
                  </span>
                  <br />
                  before they bill.
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                  SubI is one ledger for subscriptions you actually pay for: dates, amounts, and urgency in a single view.
                  Optional mailbox hints fill the list faster; your edits always win when something looks wrong.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-full bg-gold-bright px-8 text-sm font-semibold text-background shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(201,162,39,0.55)] transition hover:brightness-110 active:scale-[0.99] dark:text-background"
                  >
                    Get started
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex min-h-[3rem] items-center justify-center rounded-full border border-border/80 bg-background/50 px-7 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-gold/35 hover:bg-gold-dim/25 dark:bg-background/20"
                  >
                    Pricing
                  </Link>
                  <a
                    href="#flow"
                    className="inline-flex min-h-[3rem] items-center justify-center px-4 text-sm font-medium text-muted transition hover:text-foreground"
                  >
                    How it works
                  </a>
                </div>
                <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted/90">
                  <span>Manual or inbox</span>
                  <span className="text-gold-bright/40" aria-hidden>
                    ·
                  </span>
                  <span>No card to try</span>
                  <span className="text-gold-bright/40" aria-hidden>
                    ·
                  </span>
                  <span>You stay in charge</span>
                </div>
              </div>
              <div className="relative flex justify-center px-5 pb-10 sm:px-10 lg:justify-end lg:pb-0 lg:pr-10 lg:pt-10">
                <HeroLedgerMock />
              </div>
            </div>
          </div>
        </section>

        {/* Product highlights: titles only */}
        <section id="product" className="scroll-mt-24 section-rule-top py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <PremiumSectionHeading
              eyebrow="Product"
              title="What you get"
              description="A calm place to watch renewals without another enterprise stack. Intelligence where it helps; silence where it does not."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map(({ title, body, Icon }) => (
                <div
                  key={title}
                  className="group relative overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-b from-card/90 to-card/50 p-6 shadow-premium transition hover:border-gold/28 dark:from-card/60 dark:to-card/35"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim/40 text-gold-bright transition group-hover:border-gold/40"
                    aria-hidden
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Flow */}
        <section id="flow" className="scroll-mt-24 section-rule-top py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <PremiumSectionHeading
              eyebrow="Flow"
              title="Three steps"
              description="From empty list to informed renewals without a weekend migration project."
            />
            <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {STEPS.map(({ step, title, body }) => (
                <li key={step} className="relative text-center sm:text-left">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/35 bg-gradient-to-br from-gold-dim/55 to-gold-dim/25 font-mono text-sm font-bold text-gold-bright shadow-sm sm:mx-0">
                    {step}
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing */}
        <section className="section-rule-top pb-20 pt-6 sm:pb-24 sm:pt-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold-dim/30 via-card/85 to-background p-[1px] shadow-premium dark:from-gold-dim/15 dark:via-card/50">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_80%_0%,rgba(201,162,39,0.14),transparent_50%)]"
                aria-hidden
              />
              <div className="relative rounded-[calc(1.5rem-1px)] px-6 py-14 text-center sm:px-12 sm:py-16">
                <h2 className="mx-auto max-w-xl font-display text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                  Ready when you are.
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
                  Start on the free tier, invite your mailboxes when it makes sense, and upgrade when you need more inboxes
                  or reminder depth. No theatrics, no guilt-trip dashboards.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/login"
                    className="inline-flex min-w-[10rem] items-center justify-center rounded-full bg-gold-bright px-8 py-3.5 text-sm font-semibold text-background shadow-premium transition hover:brightness-110 active:scale-[0.99] dark:text-background"
                  >
                    Open SubI
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-full border border-border/80 bg-background/60 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-gold/40 dark:bg-background/25"
                  >
                    Plans
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

function PencilBoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.65}
        d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L13 14l-4 1 1-4 8.5-8.5z"
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
