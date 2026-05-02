"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useId } from "react";
import type { ReactNode } from "react";

type BaseProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function DialogChrome({ open, title, onClose, children }: BaseProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-background/85 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-t-2xl border border-border/80 bg-card px-6 py-6 shadow-premium-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

/** One-button acknowledgment (replaces `window.alert`). */
export function AppAlertDialog({
  open,
  title = "Notice",
  message,
  onClose,
}: {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <DialogChrome open={open} title={title} onClose={onClose}>
      <p className="mt-3 text-sm leading-relaxed text-muted">{message}</p>
      <div className="mt-6 flex justify-end">
        <Button type="button" variant="primary" onClick={onClose} className="min-w-[6rem]">
          OK
        </Button>
      </div>
    </DialogChrome>
  );
}

/** Two-button confirmation (replaces `window.confirm`). */
export function AppConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  dangerConfirm,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red/destructive primary action styling. */
  dangerConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <DialogChrome open={open} title={title} onClose={onCancel}>
      <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={dangerConfirm ? "outline" : "primary"}
          onClick={onConfirm}
          className={
            dangerConfirm
              ? "w-full border-danger/50 text-danger hover:bg-danger/10 sm:w-auto"
              : "w-full sm:w-auto"
          }
        >
          {confirmLabel}
        </Button>
      </div>
    </DialogChrome>
  );
}
