import type { ReactNode } from "react";
import { cn } from "@/lib/utils/strings";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-premium transition dark:shadow-premium-lg sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
