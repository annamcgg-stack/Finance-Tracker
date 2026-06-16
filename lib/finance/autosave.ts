/** Debounce delay before persisting finance form changes to Supabase. */
export const FINANCE_SAVE_DEBOUNCE_MS = 800;

export const FINANCE_SAVED_DISPLAY_MS = 2000;

/** Profile fields preserved when resetting financial data. */
export function preserveAccountPreferences(data: {
  setupCompleted: boolean;
  setupChoice: import("@/lib/types").SetupChoice | null;
  onboardingCompleted: boolean;
  dashboardView: import("@/lib/types").DashboardViewMode;
  darkMode: boolean;
}) {
  return {
    setupCompleted: data.setupCompleted,
    setupChoice: data.setupChoice,
    onboardingCompleted: data.onboardingCompleted,
    dashboardView: data.dashboardView,
    darkMode: data.darkMode,
  };
}
