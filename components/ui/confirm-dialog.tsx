"use client";

import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
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
  variant = "primary",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${variant === "danger" ? "bg-red-50 text-destructive" : "bg-emerald-50 text-primary"}`}>
              <AlertTriangle size={21} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" id="confirm-title">{title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted" type="button" onClick={onCancel} aria-label="Close dialog">
            <X size={16} />
          </button>
        </div>
        <div className="flex justify-end gap-2 p-5">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} loading={loading} loadingText="Please wait">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
