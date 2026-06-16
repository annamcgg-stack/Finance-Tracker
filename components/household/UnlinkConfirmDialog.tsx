"use client";

import { Button } from "@/components/ui/Field";
import { UNLINK_CONFIRMATION_MESSAGE } from "@/lib/household/defaults";

type UnlinkConfirmDialogProps = {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  loading?: boolean;
};

export function UnlinkConfirmDialog({
  open,
  title,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm unlink",
  loading,
}: UnlinkConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlink-dialog-title"
      >
        <h2 id="unlink-dialog-title" className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-3 text-sm text-muted">{UNLINK_CONFIRMATION_MESSAGE}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Processing…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
