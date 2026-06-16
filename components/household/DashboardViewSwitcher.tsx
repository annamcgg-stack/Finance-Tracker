"use client";

import type { DashboardViewMode } from "@/lib/types";
import { DASHBOARD_VIEW_OPTIONS } from "@/lib/household/defaults";
import { useDashboardView } from "@/hooks/useHousehold";
import { useHousehold } from "@/hooks/useHousehold";

export function DashboardViewSwitcher() {
  const { dashboardView, setDashboardView } = useDashboardView();
  const { household } = useHousehold();

  if (!household) return null;

  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-surface p-1">
      {DASHBOARD_VIEW_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setDashboardView(opt.value as DashboardViewMode)}
          className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            dashboardView === opt.value
              ? "bg-primary text-white shadow-sm"
              : "text-muted hover:bg-surface-elevated hover:text-foreground"
          }`}
        >
          <span className="block font-medium">{opt.label}</span>
          <span
            className={`block text-xs ${
              dashboardView === opt.value ? "text-white/80" : "text-muted"
            }`}
          >
            {opt.description}
          </span>
        </button>
      ))}
    </div>
  );
}
