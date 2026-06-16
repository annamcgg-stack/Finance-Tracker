import type { DashboardViewMode } from "@/lib/types";

export type DefaultDashboardMode = "individual" | "household" | "combined";

export const ACCOUNT_MODE_OPTIONS: {
  value: DashboardViewMode;
  dbValue: DefaultDashboardMode;
  label: string;
  description: string;
}[] = [
  {
    value: "personal",
    dbValue: "individual",
    label: "My Finances",
    description: "Your private data only",
  },
  {
    value: "shared",
    dbValue: "household",
    label: "Shared Household",
    description: "Shared accounts, expenses, and goals",
  },
  {
    value: "combined",
    dbValue: "combined",
    label: "Combined View",
    description: "Your data plus household-shared items",
  },
];

export function dashboardViewToDbMode(view: DashboardViewMode): DefaultDashboardMode {
  const found = ACCOUNT_MODE_OPTIONS.find((o) => o.value === view);
  return found?.dbValue ?? "individual";
}

export function dbModeToDashboardView(mode: string | null | undefined): DashboardViewMode {
  switch (mode) {
    case "household":
    case "shared":
      return "shared";
    case "combined":
      return "combined";
    case "individual":
    case "personal":
    default:
      return "personal";
  }
}

export function getAccountModeLabel(view: DashboardViewMode): string {
  return ACCOUNT_MODE_OPTIONS.find((o) => o.value === view)?.label ?? "My Finances";
}
