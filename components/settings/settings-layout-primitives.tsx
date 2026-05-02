import { cn } from "@/lib/utils/strings";
import type { ReactNode } from "react";

/** Shared shell for Mailboxes / Preferences — matches Billing “activity” framing. */
export function SettingsSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/45 bg-gradient-to-b from-card/92 to-card/45 p-1 shadow-premium sm:p-1.5 dark:shadow-premium-lg",
        className,
      )}
    >
      <div className="rounded-xl border border-border/30 bg-background/25 p-5 sm:p-6 dark:bg-background/[0.12]">{children}</div>
    </div>
  );
}

export function SettingsSectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-bright">{eyebrow}</p>
      <h2 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
      {description ? <div className="max-w-2xl text-sm leading-relaxed text-muted">{description}</div> : null}
    </div>
  );
}

/** Alias for dashboards and other surfaces — same chrome as Mailboxes/Billing shells. */
export { SettingsSurface as PremiumSurface };
export { SettingsSectionHeading as PremiumSectionHeading };
