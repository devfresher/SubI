"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/strings";

const options = [
  { id: "light" as const, label: "Light", icon: SunIcon },
  { id: "dark" as const, label: "Dark", icon: MoonIcon },
  { id: "system" as const, label: "System", icon: SystemIcon },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex h-9 gap-0.5 rounded-lg border border-border bg-card/50 p-0.5", className)}>
        <div className="h-full w-24 animate-pulse rounded-md bg-gold-dim" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex gap-0.5 rounded-lg border border-border bg-card/80 p-0.5 shadow-sm backdrop-blur-sm",
        className,
      )}
      role="group"
      aria-label="Theme"
    >
      {options.map(({ id, label, icon: Icon }) => {
        const selected = theme === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-pressed={selected}
            onClick={() => setTheme(id)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition",
              selected ? "bg-gold-dim text-gold-bright shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            <Icon />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75A9.75 9.75 0 0 1 8.25 6a9.77 9.77 0 0 1 1.53-.13 9 9 0 0 0 12.282 9.21Z"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0v0a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 5.25v0"
      />
    </svg>
  );
}
