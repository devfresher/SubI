"use client";

import { cn } from "@/lib/utils/strings";
import { format, isValid, parse } from "date-fns";
import { useEffect, useId, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export function DatePickerField({
  id: idProp,
  value,
  onChange,
  placeholder = "Select date",
}: {
  id?: string;
  value: string;
  onChange: (ymd: string) => void;
  /** yyyy-MM-dd */
  placeholder?: string;
}) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-border/90 bg-card px-4 py-3 text-left font-display text-base tabular-nums tracking-tight text-foreground shadow-sm transition",
          "hover:border-gold/28",
          "focus-visible:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/25",
          !value && "text-muted",
        )}
      >
        <span>{selected ? format(selected, "MMMM d, yyyy") : placeholder}</span>
        <CalendarGlyph className="h-4 w-4 shrink-0 text-gold-bright/80" />
      </button>
      {open ? (
        <div
          className="absolute left-0 z-50 mt-2 rounded-xl border border-border/90 bg-card p-3 shadow-premium"
          role="dialog"
          aria-label="Choose date"
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(d) => {
              if (d) onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            }}
            classNames={{
              root: "text-foreground",
              month_caption: "mb-2 flex items-center justify-center font-display text-sm font-semibold text-foreground",
              weekdays: "text-[11px] font-medium uppercase tracking-wide text-muted",
              weekday: "w-9",
              day: "p-0 text-center text-sm",
              day_button: cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm transition",
                "hover:bg-gold-dim/50",
              ),
              selected:
                "relative bg-gold-dim font-semibold text-gold-bright after:absolute after:inset-0 after:rounded-lg after:ring-1 after:ring-gold-bright/35",
              today: "ring-1 ring-gold-bright/45 rounded-lg",
              outside: "text-muted/50 opacity-60",
              disabled: "opacity-30",
              button_next: "rounded-lg p-1 text-foreground hover:bg-gold-dim/30",
              button_previous: "rounded-lg p-1 text-foreground hover:bg-gold-dim/30",
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function CalendarGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-9.375a.375.375 0 0 1 .375-.375h16.125a.375.375 0 0 1 .375.375V18.75"
      />
    </svg>
  );
}
