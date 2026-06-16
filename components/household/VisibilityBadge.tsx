"use client";

import type { DataVisibility } from "@/lib/types";
import { VISIBILITY_LABELS } from "@/lib/household/defaults";

export function VisibilityBadge({ visibility }: { visibility: DataVisibility }) {
  const info = VISIBILITY_LABELS[visibility];
  const colors: Record<DataVisibility, string> = {
    private: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    household: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    shared_account_only: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[visibility]}`}
      title={info.description}
    >
      {info.label}
    </span>
  );
}
