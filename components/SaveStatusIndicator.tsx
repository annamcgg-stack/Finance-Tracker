"use client";

import { Check, Loader2, AlertCircle } from "lucide-react";
import type { SaveStatus } from "@/hooks/useFinanceData";

export function SaveStatusIndicator({ status, error }: { status: SaveStatus; error: string | null }) {
  if (status === "saving") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" />
        Saved
      </span>
    );
  }
  if (status === "error" && error) {
    return (
      <span className="flex max-w-[200px] items-center gap-1.5 truncate text-xs text-red-600 dark:text-red-400" title={error}>
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Save failed
      </span>
    );
  }
  return null;
}
