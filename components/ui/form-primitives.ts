import { cn } from "@/lib/utils/strings";

/** Shared label style for fields across the app */
export const fieldLabelClass = cn(
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted",
);

/** Uppercase legend inside fieldsets (no bottom margin) */
export const fieldLegendClass = cn(
  "px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted",
);

/** Native option list styling is OS-defined; wrapper chrome is what we customize */
export const fieldControlClass = cn(
  "w-full rounded-xl border border-border/90 bg-card px-4 py-3 text-sm text-foreground shadow-sm transition",
  "placeholder:text-muted/90",
  "hover:border-gold/28",
  "focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/15",
  "disabled:cursor-not-allowed disabled:opacity-45",
);
