"use client";

import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/dashboard/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils/strings";
import type { UserPlan } from "@/types";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function NavPill({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const path = usePathname();
  const active = path === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gold-dim/45 text-foreground ring-1 ring-gold/25"
          : "text-muted hover:bg-gold-dim/35 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function AppHeader({
  brandHref = "/dashboard",
  email,
  avatarUrl,
  displayName,
  userPlan,
}: {
  brandHref?: string;
  email: string | undefined;
  avatarUrl?: string | null;
  displayName?: string | null;
  userPlan: UserPlan;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const initial = (displayName?.[0] ?? email?.[0] ?? "?").toUpperCase();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/30 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
        <Link href={brandHref} className="group flex flex-col gap-0.5">
          <span className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Sub<span className="text-gold-bright">I</span>
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-muted sm:block">
            Subscription intelligence
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <NavPill href="/dashboard">Dashboard</NavPill>
            <NavPill href="/subscriptions">Subscriptions</NavPill>
            <NavPill href="/pricing">Pricing</NavPill>
          </nav>

          <ThemeToggle className="hidden md:inline-flex" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-card p-0.5 pl-0.5 shadow-sm transition hover:border-gold/30"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Account menu"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-dim text-sm font-semibold text-gold-bright">
                  {initial}
                </span>
              )}
              <span className="hidden max-w-[120px] truncate pr-2 text-xs text-muted lg:block" title={email}>
                {displayName ?? email}
              </span>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,18rem)] overflow-hidden rounded-2xl border border-border bg-card py-2 shadow-premium-lg">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-medium text-foreground">{displayName ?? "Account"}</p>
                  <p className="truncate text-xs text-muted">{email}</p>
                  <p className="mt-2 inline-flex rounded-full border border-border/70 bg-gold-dim/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-bright">
                    {userPlan === "pro" ? "Pro" : "Free"} plan
                  </p>
                </div>

                <nav className="flex flex-col gap-0.5 p-2 md:hidden" aria-label="Main">
                  <MenuRow href="/dashboard" onNavigate={closeMenu}>
                    Dashboard
                  </MenuRow>
                  <MenuRow href="/subscriptions" onNavigate={closeMenu}>
                    Subscriptions
                  </MenuRow>
                  <MenuRow href="/pricing" onNavigate={closeMenu}>
                    Pricing
                  </MenuRow>
                </nav>

                <div className={cn("p-2", "md:border-t md:border-border")}>
                  <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Account</p>
                  <MenuRow href="/billing" onNavigate={closeMenu}>
                    Billing &amp; plan
                  </MenuRow>
                  <MenuRow href="/settings" onNavigate={closeMenu}>
                    Settings
                  </MenuRow>
                </div>

                {userPlan === "free" ? (
                  <div className="border-t border-border px-2 py-2">
                    <Link
                      href="/pricing"
                      className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-gold-bright hover:bg-gold-dim/40"
                      onClick={closeMenu}
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                ) : null}

                <div className="border-t border-border px-4 py-3 md:hidden">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Appearance</p>
                  <ThemeToggle className="w-full justify-center" />
                </div>

                <div className="border-t border-border px-2 pt-1">
                  <LogoutButton className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-muted transition hover:bg-gold-dim/40 hover:text-foreground" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuRow({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  const path = usePathname();
  const active = path === href;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "rounded-lg px-3 py-2.5 text-sm transition",
        active ? "bg-gold-dim/40 font-medium text-foreground" : "text-foreground hover:bg-gold-dim/35",
      )}
    >
      {children}
    </Link>
  );
}
