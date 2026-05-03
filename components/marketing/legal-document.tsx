import { cn } from "@/lib/utils/strings";
import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDocumentHero({
  kicker,
  title,
  description,
  updated,
}: {
  kicker: string;
  title: string;
  description?: string;
  updated: string;
}) {
  return (
    <header className="relative mb-10 text-center sm:mb-14 sm:text-left">
      <div className="relative z-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-bright">{kicker}</p>
        <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground text-balance sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:mx-0">{description}</p>
        ) : null}
        <p className="mt-6 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          <span className="h-px w-6 bg-gold-bright/35" aria-hidden />
          {updated}
        </p>
      </div>
      {/* Corner accent only — kept small and in the reading-direction margin so it never crosses title/body */}
      <div
        className="pointer-events-none absolute -right-8 top-0 z-0 h-28 w-28 rounded-full border border-gold-bright/[0.08] dark:border-gold-bright/[0.06] sm:-right-10 sm:h-36 sm:w-36"
        aria-hidden
      />
    </header>
  );
}

export function LegalTableOfContents({
  items,
  className,
}: {
  items: readonly { id: string; label: string }[];
  className?: string;
}) {
  return (
    <nav
      aria-label="On this page"
      className={cn(
        "mb-12 rounded-2xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur-sm dark:bg-card/30",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-bright">Contents</p>
      <ol className="mt-4 flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-x-8 sm:gap-y-2">
        {items.map((item, i) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="group flex items-start gap-2.5 text-sm text-muted transition hover:text-foreground"
            >
              <span className="mt-0.5 font-mono text-[11px] tabular-nums text-gold-bright/70 group-hover:text-gold-bright">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span className="border-b border-transparent group-hover:border-gold-bright/40">{item.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function LegalSection({
  id,
  index,
  title,
  children,
}: {
  id: string;
  index: number;
  title: string;
  children: ReactNode;
}) {
  const num = index.toString().padStart(2, "0");
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/35 pt-10 first:border-t-0 first:pt-0 sm:scroll-mt-28">
      <h2 className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
        <span className="font-mono text-[11px] font-medium tabular-nums text-gold-bright/80">{num}</span>
        <span className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</span>
      </h2>
      <div className="mt-5 space-y-4 text-sm leading-[1.65] text-muted sm:pl-12 [&_a]:font-medium [&_a]:text-gold-bright [&_a]:underline-offset-4 [&_a]:transition hover:[&_a]:underline">
        {children}
      </div>
    </section>
  );
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-gold-bright underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}

export function LegalCrossLinks({
  otherLabel,
  otherHref,
}: {
  otherLabel: string;
  otherHref: "/privacy" | "/terms";
}) {
  return (
    <aside className="mt-16 rounded-2xl border border-border/40 bg-gradient-to-br from-gold-dim/20 to-transparent px-6 py-5 dark:from-gold-dim/10">
      <p className="text-sm text-muted">
        Related: <LegalLink href={otherHref}>{otherLabel}</LegalLink>
      </p>
    </aside>
  );
}
