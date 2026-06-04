"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode | null;
  loading?: boolean;
  size?: "md" | "lg";
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  size = "md",
  variant = "primary",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open) return null;

  const dialog = (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={`w-full rounded-lg border border-border bg-surface text-surface-foreground shadow-soft ${size === "lg" ? "max-w-xl" : "max-w-md"}`}>
        <div className="border-b border-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${variant === "danger" ? "bg-red-50 text-destructive" : "bg-emerald-50 text-primary"}`}>
              <AlertTriangle size={21} />
            </div>
            <h2 className="min-w-0 text-lg font-semibold" id="confirm-title">{title}</h2>
          </div>
            <button className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted" type="button" onClick={onCancel} aria-label="Close dialog">
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 text-sm leading-6 text-muted-foreground">{description}</div>
        </div>
        <div className="flex justify-end gap-2 p-5">
          {cancelLabel !== null && <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>}
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} loadingText="Please wait">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(dialog, document.body) : dialog;
}
