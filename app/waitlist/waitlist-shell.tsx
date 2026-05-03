"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

export function WaitlistShell() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = email.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Small corner accents only — large arcs were crossing headline/body on narrow viewports */}
        <div className="absolute -right-12 top-16 h-44 w-44 rounded-full border border-gold-bright/[0.09] opacity-80 dark:border-gold-bright/[0.06] sm:-right-8 sm:top-20 md:top-24" />
        <div className="absolute -bottom-8 -left-10 h-36 w-36 rounded-full border border-border/30 opacity-50 sm:-left-8" />
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-0.5" aria-hidden>
          <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Sub<span className="text-gold-bright">I</span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted">Subscription intelligence</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 flex-col justify-center px-5 pb-20 pt-6 sm:px-8 sm:pb-24">
        <div className="mx-auto w-full max-w-[26rem]">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-bright sm:text-left">
            Early access
          </p>
          <h1 className="mt-4 text-center font-display text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-balance sm:text-left sm:text-[2.375rem]">
            Know every renewal before it charges you.
          </h1>
          <p className="mt-5 text-center text-sm leading-relaxed text-muted sm:text-left sm:text-[0.9375rem]">
            SubI is the quiet ledger for your subscriptions—renewal dates, amounts, and optional inbox hints—so you plan
            instead of panic. We&apos;re opening the vault in measured waves.
          </p>

          <div className="relative mt-10">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gold-dim/20 blur-2xl dark:bg-gold-dim/10"
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-[1.35rem] border border-border/60 bg-card/75 shadow-premium-lg backdrop-blur-xl dark:bg-card/55">
              <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/28 to-transparent" />

              {done ? (
                <div className="p-9 sm:p-10">
                  <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-bright/25 bg-gold-dim/30 text-gold-bright dark:bg-gold-dim/20">
                      <VaultCheckIcon className="h-6 w-6" />
                    </span>
                    <p className="mt-6 font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      You&apos;re on the list.
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                      When your seat is ready, we&apos;ll send one calm note—no frenzy, no daily drip. Until then,
                      thanks for trusting us with your attention.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 sm:p-9">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Request invitation</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Leave a work or personal email. We never sell addresses and you can leave the list anytime.
                  </p>

                  <div className="mt-6 space-y-4">
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void submit();
                      }}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border/90 bg-background/40 px-4 py-3.5 text-sm text-foreground shadow-inner placeholder:text-muted/75 focus:border-gold/45 focus:outline-none focus:ring-2 focus:ring-gold/12"
                    />
                    {error ? (
                      <p role="alert" className="text-sm text-danger">
                        {error}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy || !email.trim()}
                      onClick={() => void submit()}
                      className="flex h-[3.25rem] w-full items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-[#a88b2a] px-6 text-sm font-semibold tracking-tight text-background shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition hover:brightness-[1.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.99] dark:from-[#e4c75a] dark:to-gold-bright dark:text-background"
                    >
                      {busy ? "Sending…" : "Join the waitlist"}
                    </button>
                  </div>
                  <p className="mt-6 text-center text-[11px] leading-relaxed text-muted sm:text-left">
                    No spam. Launch updates only—and only from us.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mt-auto border-t border-border/30 py-8 text-center">
        <p className="text-xs text-muted">SubI — subscription intelligence</p>
      </footer>
    </div>
  );
}

function VaultCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
