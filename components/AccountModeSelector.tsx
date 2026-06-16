"use client";

import type { DashboardViewMode } from "@/lib/types";
import { ACCOUNT_MODE_OPTIONS } from "@/lib/profile/preferences";
import { useFinance } from "@/hooks/useFinanceData";

export function AccountModeSelector({ compact = false }: { compact?: boolean }) {
  const { data, setDashboardView, saving } = useFinance();

  const handleChange = async (view: DashboardViewMode) => {
    if (view === data.dashboardView || saving) return;
    await setDashboardView(view);
  };

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {!compact && (
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
          Household / Account Mode
        </p>
      )}
      <div className="space-y-0.5 px-2">
        {ACCOUNT_MODE_OPTIONS.map((opt) => {
          const active = data.dashboardView === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={saving}
              onClick={() => handleChange(opt.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted hover:bg-surface-elevated hover:text-foreground"
              }`}
            >
              <span className="block">{opt.label}</span>
              {!compact && (
                <span className="block text-xs font-normal opacity-80">{opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
