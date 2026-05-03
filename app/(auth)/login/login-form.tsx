"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

const PILLARS = [
  {
    title: "One list",
    body: "Mailbox hints and manual subscriptions together—deduped by name so the list stays honest.",
    icon: StackIcon,
  },
  {
    title: "Thoughtful nudges",
    body: "Reminders respect your timezone, with defaults you control—or per-plan offsets when you need them.",
    icon: BellIcon,
  },
  {
    title: "You stay in charge",
    body: "Encrypted session via Supabase. Mailbox sync is optional and can be disconnected anytime.",
    icon: LockIcon,
  },
] as const;

function safeOAuthNext(next: string | undefined): string {
  if (!next || next.length === 0) return "/dashboard";
  if (!next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

export function LoginForm({ authError, redirectTo }: { authError?: string; redirectTo?: string }) {
  const nextPath = safeOAuthNext(redirectTo);
  const [busy, setBusy] = useState<null | "google" | "apple" | "email">(null);
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const signInGoogle = async () => {
    setBusy("google");
    const supabase = createClient();
    const origin = window.location.origin;
    const qp = `?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback${qp}` },
    });
    if (error) {
      setBusy(null);
      console.error(error);
    }
  };

  const signInApple = async () => {
    setBusy("apple");
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setBusy(null);
      console.error(error);
    }
  };

  const sendMagicLink = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy("email");
    setOtpSent(false);
    const supabase = createClient();
    const origin = window.location.origin;
    const qp = `?next=${encodeURIComponent(nextPath)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${origin}/auth/callback${qp}` },
    });
    setBusy(null);
    if (error) {
      console.error(error);
      return;
    }
    setOtpSent(true);
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <header className="relative z-20 border-b border-border/25 bg-background/65 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted transition group-hover:text-foreground"
          >
            <span className="transition-transform group-hover:-translate-x-0.5" aria-hidden>
              ←
            </span>
            Home
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-7xl lg:grid-cols-2 lg:min-h-[calc(100vh-4.5rem)]">
        {/* Left: brand narrative — hidden on small screens (landing covers story); fills space on lg+ */}
        <aside className="relative hidden flex-col justify-between overflow-hidden border-b border-border/25 bg-card/25 px-9 py-12 backdrop-blur-[2px] dark:bg-card/15 lg:flex lg:border-b-0 lg:border-r lg:border-border/20 xl:px-12 xl:py-16">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full border border-border/35 dark:border-white/[0.05]" />
            <div className="absolute -right-16 bottom-1/4 h-56 w-56 rounded-full border border-border/25 opacity-50 dark:border-white/[0.035]" />
            <div className="absolute bottom-10 left-8 h-px w-20 max-w-[40%] bg-gradient-to-r from-gold-bright/25 via-border/40 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-bright">
              Inside the vault
            </p>
            <h2 className="mt-5 max-w-[16ch] font-display text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground xl:text-[2.375rem]">
              Calm control over every renewal.
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted xl:text-[0.9375rem]">
              Receipts scatter across your inbox—SubI gathers what matters here:{" "}
              <span className="text-foreground">dates</span>, <span className="text-foreground">amounts</span>, and{" "}
              <span className="text-foreground">gentle reminders</span> before plans bill again.
            </p>

            <ul className="mt-10 space-y-5">
              {PILLARS.map(({ title, body, icon: Icon }) => (
                <li key={title} className="flex gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-gold-dim/25 text-gold-bright dark:border-gold/20 dark:bg-gold-dim/35">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 mt-10 border-t border-border/25 pt-8 font-display text-sm font-medium tracking-tight text-foreground">
            Sub<span className="text-gold-bright">I</span>
            <span className="ml-2 font-sans text-xs font-normal text-muted">— subscription intelligence</span>
          </p>
        </aside>

        {/* Right: sign-in */}
        <div className="flex flex-col justify-center px-5 pb-16 pt-10 sm:px-8 lg:px-10 lg:py-14 xl:px-14">
          <div className="mx-auto w-full max-w-[26.5rem]">
            <div className="mb-8 lg:mb-10">
              <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-bright lg:hidden">
                <span className="inline-block h-1 w-1 rounded-full bg-gold-bright shadow-[0_0_8px_var(--gold-glow)]" />
                Member access
              </p>
              <h1 className="mt-3 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[2rem] lg:mt-0">
                Welcome back
              </h1>
              <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-muted">
                Google, Sign in with Apple, or email magic link. Connect a mailbox later in Settings—it stays optional.
              </p>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute -inset-10 rounded-[2rem] bg-gold-dim/15 blur-3xl dark:bg-gold-dim/10"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[1.35rem] border border-border/80 bg-card/80 shadow-premium-lg backdrop-blur-xl dark:bg-card/70">
                <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright/22 to-transparent" />
                <div className="p-8 sm:p-9">
                  <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted">Authentication</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Choose a provider—we never see your password for social sign-in. Magic links expire quickly.
                  </p>

                  {authError && (
                    <p
                      role="alert"
                      className="mt-5 rounded-xl border border-danger/35 bg-danger/10 px-4 py-3 text-sm text-danger"
                    >
                      Sign-in didn&apos;t complete. Please try again.
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={signInGoogle}
                    className="mt-6 flex h-[3.25rem] w-full items-center justify-center gap-3 rounded-full border border-border/90 bg-gradient-to-b from-card-hover to-card/90 px-5 text-sm font-semibold tracking-tight text-foreground shadow-sm ring-1 ring-black/[0.03] transition hover:border-gold/40 hover:shadow-[0_0_0_1px_rgba(201,162,39,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.99] dark:from-card-hover dark:to-card/95 dark:ring-white/[0.06]"
                  >
                    <GoogleMark className="h-[1.125rem] w-[1.125rem] shrink-0" />
                    {busy === "google" ? "Redirecting…" : "Continue with Google"}
                  </button>

                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={signInApple}
                    className="mt-3 flex h-[3.25rem] w-full items-center justify-center gap-3 rounded-full border border-border/90 bg-[#000] px-5 text-sm font-semibold tracking-tight text-white shadow-sm transition hover:bg-[#1a1a1a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.99]"
                  >
                    <AppleMark className="h-[1.125rem] w-[1.125rem] shrink-0 text-white" />
                    {busy === "apple" ? "Redirecting…" : "Sign in with Apple"}
                  </button>

                  <div className="relative mt-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden>
                      <span className="h-px w-full bg-border/60" />
                    </div>
                    <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                      <span className="bg-card/95 px-3">Or email</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <label htmlFor="login-email" className="sr-only">
                      Email for magic link
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border/90 bg-card px-4 py-3 text-sm text-foreground shadow-sm placeholder:text-muted/80 focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15"
                    />
                    <button
                      type="button"
                      disabled={busy !== null || !email.trim()}
                      onClick={() => void sendMagicLink()}
                      className="flex h-[3.25rem] w-full items-center justify-center rounded-full border border-border/90 bg-gradient-to-b from-card to-card-hover px-4 text-sm font-semibold tracking-tight text-foreground shadow-sm ring-1 ring-black/[0.03] transition hover:border-gold/40 hover:shadow-[0_0_0_1px_rgba(201,162,39,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-45 active:scale-[0.99] dark:from-card-hover dark:to-card/90 dark:ring-white/[0.06]"
                    >
                      {busy === "email" ? "Sending…" : "Email me a sign-in link"}
                    </button>
                    {otpSent ? (
                      <p className="text-center text-xs leading-relaxed text-gold-bright">
                        Check your inbox for the link. It may take a minute to arrive.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
                    <div className="flex items-start gap-3">
                      <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-bright/80" />
                      <p className="text-xs leading-relaxed text-muted">
                        Protected session via Supabase auth.{" "}
                        <Link
                          href="/#features"
                          className="font-medium text-gold-bright underline-offset-4 transition hover:underline"
                        >
                          New to SubI?
                        </Link>
                      </p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-muted/90">
                      By continuing you agree to our{" "}
                      <Link href="/terms" className="font-medium text-gold-bright underline-offset-4 hover:underline">
                        Terms
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="font-medium text-gold-bright underline-offset-4 hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M8.25 6.75h12M8.25 12h12m-12 4.5h12M3.75 6.75h.008v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.008v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 4.5h.008v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function AppleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
