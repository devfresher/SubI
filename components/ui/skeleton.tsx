import { cn } from "@/lib/utils/strings";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-gold-dim/40 dark:bg-gold-dim/20", className)}
      aria-hidden
    />
  );
}
