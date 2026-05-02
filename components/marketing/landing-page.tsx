"use client";

import { MarketingLayout } from "@/components/marketing/marketing-layout";
import Link from "next/link";

const FEATURES = [
  {
    title: "Gmail-aware detection",
    body: "Scan renewal receipts in your inbox and merge them with subscriptions you add manually—one list, no dupes by name.",
  },
  {
    title: "You stay in control",
    body: "Ignore misfires, mark real subscriptions, and fix billing dates when parsing is wrong—trust beats blind automation.",
  },
  {
    title: "Reminders in your timezone",
    body: "Alerts respect your profile defaults, or set custom lead times per subscription when you need finer control.",
  },
  {
    title: "Cancel links & notes",
    body: "Keep manage/cancel URLs and context next to each plan so you’re not hunting through old emails under pressure.",
  },
] as const;

const STEPS = [
  { step: "1", title: "Sign in with Google", body: "One account for auth; connect Gmail separately when you’re ready to sync." },
  { step: "2", title: "Add or import", body: "Enter plans by hand or run a Gmail sync to surface what your inbox already knows." },
  { step: "3", title: "Stay ahead", body: "See renewals grouped by mailbox with clear urgency, then get email reminders before charges land." },
] as const;

export function LandingPage() {
  return (
    <MarketingLayout>
      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:pt-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright">
            For people who outgrew the spreadsheet
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
            Renewals, tamed—<span className="text-gold-bright">without</span> the noise.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            SubI is a calm hub for billing dates: optional Gmail hints, manual entries, and reminders
            that feel premium—not like another productivity guilt trip.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-gold-bright px-6 py-3.5 text-sm font-semibold text-background shadow-premium transition hover:brightness-110 active:scale-[0.99] dark:text-background"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card/80 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur-sm transition hover:border-gold/35 hover:bg-gold-dim/30"
            >
              View pricing
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-transparent px-6 py-3.5 text-sm font-medium text-muted transition hover:border-gold/25 hover:text-foreground"
            >
              How it works
            </a>
          </div>
        </section>

        <section
          id="features"
          className="section-rule-top scroll-mt-24 bg-card/35 py-16 dark:bg-card/15 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright">
                Features
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to see what&apos;s renewing
              </h2>
              <p className="mt-3 text-muted">
                Built for clarity first—dark obsidian and gold accents everywhere you already use the app.
              </p>
            </div>
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {FEATURES.map((item) => (
                <li
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-premium backdrop-blur-sm transition hover:border-gold/25 hover:shadow-premium-lg"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold-dim/50 text-gold-bright"
                    aria-hidden
                  >
                    <SparkIcon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-bright">
                How it works
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Three steps to a clearer month
              </h2>
            </div>
            <ol className="mt-12 grid gap-8 lg:grid-cols-3">
              {STEPS.map((s) => (
                <li
                  key={s.step}
                  className="relative rounded-2xl border border-border/45 bg-background/45 p-6 pt-8 backdrop-blur-sm dark:bg-background/35"
                >
                  <span className="absolute -top-3 left-6 flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-gold/30 bg-gold-dim/60 px-2 font-display text-sm font-bold text-gold-bright">
                    {s.step}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section-rule-top bg-gold-dim/20 py-16 dark:bg-gold-dim/12 sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Ready when you are
            </h2>
            <p className="mt-3 max-w-xl text-muted">
              Sign in to open your subscription hub. Gmail sync is optional and controlled from settings.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-gold-bright px-8 py-3.5 text-sm font-semibold text-background shadow-premium transition hover:brightness-110 active:scale-[0.99] dark:text-background"
              >
                Sign in to SubI
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card/90 px-8 py-3.5 text-sm font-medium text-foreground transition hover:border-gold/35"
              >
                Compare plans
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  );
}

function SparkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}
