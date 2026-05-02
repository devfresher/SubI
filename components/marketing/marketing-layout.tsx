"use client";

import { AppHeader } from "@/components/dashboard/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserPlan } from "@/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/strings";

export type MarketingLayoutAuth = {
  email: string | undefined;
  avatarUrl?: string | null;
  displayName?: string | null;
  plan: UserPlan;
};

function GuestNavItem({
  href,
  children,
  anchor,
}: {
  href: string;
  children: React.ReactNode;
  anchor?: boolean;
}) {
  const path = usePathname();
  const active = !anchor && path === href;
  const className = cn(
    "rounded-lg px-3 py-2 text-sm font-medium transition",
    active ? "bg-gold-dim/45 text-foreground ring-1 ring-gold/25" : "text-muted hover:bg-gold-dim/40 hover:text-foreground",
  );
  if (anchor) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function GuestMarketingHeader() {
  return (
    <header className="relative z-20 border-b border-border/25 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex flex-col gap-0.5">
          <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Sub<span className="text-gold-bright">I</span>
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-muted sm:block">
            Subscription intelligence
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Site">
          <GuestNavItem href="/#built-for" anchor>
            Who it&apos;s for
          </GuestNavItem>
          <GuestNavItem href="/#features" anchor>
            Features
          </GuestNavItem>
          <GuestNavItem href="/#how-it-works" anchor>
            How it works
          </GuestNavItem>
          <GuestNavItem href="/pricing">Pricing</GuestNavItem>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-gold-dim/40 hover:text-foreground"
          >
            Sign in
          </Link>
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden rounded-lg bg-gold-bright px-4 py-2.5 text-sm font-semibold text-background shadow-premium transition hover:brightness-110 sm:inline-flex sm:items-center sm:justify-center dark:text-background"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingLayout({
  children,
  auth,
}: {
  children: React.ReactNode;
  auth?: MarketingLayoutAuth | null;
}) {
  const signedIn = auth != null;

  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      {signedIn ? (
        <AppHeader
          brandHref="/dashboard"
          email={auth.email ?? ""}
          avatarUrl={auth.avatarUrl}
          displayName={auth.displayName}
          userPlan={auth.plan}
        />
      ) : (
        <GuestMarketingHeader />
      )}

      {children}

      <footer className="section-rule-top relative z-10 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span className="font-display text-lg font-semibold">
              Sub<span className="text-gold-bright">I</span>
            </span>
            <p className="max-w-[16rem] text-center text-xs text-muted sm:text-left">
              One quiet place for every renewal—inbox hints optional, reminders in your timezone.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
            {signedIn ? (
              <>
                <Link href="/dashboard" className="transition hover:text-foreground">
                  Dashboard
                </Link>
                <span className="text-border" aria-hidden>
                  ·
                </span>
              </>
            ) : (
              <>
                <Link href="/login" className="transition hover:text-foreground">
                  Sign in
                </Link>
                <span className="text-border" aria-hidden>
                  ·
                </span>
              </>
            )}
            <Link href="/pricing" className="transition hover:text-foreground">
              Pricing
            </Link>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <a href="/#built-for" className="transition hover:text-foreground">
              Who it&apos;s for
            </a>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <a href="/#features" className="transition hover:text-foreground">
              Features
            </a>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <a href="/#how-it-works" className="transition hover:text-foreground">
              How it works
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
