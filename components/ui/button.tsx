import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/strings";

export function Button({
  className,
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  children: ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold tracking-tight transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-45 active:scale-[0.98]";
  const variants = {
    primary:
      "bg-gold-bright text-background shadow-premium ring-1 ring-black/5 hover:brightness-110 dark:text-background dark:ring-white/10 dark:hover:brightness-110",
    secondary:
      "border border-border/90 bg-gold-dim/50 text-foreground shadow-sm hover:border-gold/35 hover:bg-gold-dim/80",
    outline:
      "border border-border/90 bg-transparent text-foreground shadow-sm hover:bg-card-hover hover:border-gold/35",
    ghost: "text-muted hover:bg-gold-dim/50 hover:text-foreground",
  };
  return (
    <button type="button" className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
