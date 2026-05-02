import { cn } from "@/lib/utils/strings";
import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

/**
 * Styled checkbox: hides native control, shows obsidian/gold tile + checkmark.
 * Place `children` for label text (renders muted until hover).
 */
export function Checkbox({
  className,
  labelClassName,
  id,
  children,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  labelClassName?: string;
  children?: ReactNode;
}) {
  const uid = useId();
  const inputId = id ?? uid;

  return (
    <label
      htmlFor={inputId}
      className={cn("group flex cursor-pointer items-start gap-3 text-sm", className)}
    >
      <input type="checkbox" className="peer sr-only" {...props} id={inputId} />
      <span
        className={cn(
          "mt-0.5 flex h-[1.125rem] w-[1.125rem] shrink-0 items-center justify-center rounded-md border border-border/90 bg-card text-gold-bright shadow-sm transition",
          "ring-offset-background hover:border-gold/35",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold",
          "peer-checked:border-gold-bright peer-checked:bg-gold-dim/80 peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-45",
          "peer-checked:[&>svg]:opacity-100",
        )}
        aria-hidden
      >
        <svg className="h-2.5 w-2.5 opacity-0 transition-opacity" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children ? (
        <span
          className={cn(
            "leading-snug text-muted transition-colors group-hover:text-foreground",
            labelClassName,
          )}
        >
          {children}
        </span>
      ) : null}
    </label>
  );
}
