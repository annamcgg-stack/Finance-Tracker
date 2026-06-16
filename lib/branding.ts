/** User-facing product name — single source of truth for UI, PWA, and metadata. */
export const APP_NAME = "Finance Tracker";

export const APP_LOGO_LETTER = "F";

export const APP_TAGLINE = "Track your finances with clarity";

export const APP_INTRO =
  "Finance Tracker helps you understand your income, expenses, investments, and net worth — all in one clean dashboard.";

export const APP_PWA_INSTALL_LINE = `Add ${APP_NAME} to your home screen for quick access.`;

export const APP_SIDEBAR_SUBTITLE = "Personal finance";

export const APP_DASHBOARD_DESCRIPTION = "Your financial overview at a glance.";

export const APP_WELCOME_ONBOARDING = "Welcome to Finance Tracker";

/** Legacy strings that must not appear in user-facing UI. */
export const FORBIDDEN_BRAND_STRINGS = [
  "WealthPlan",
  "Wealth Plan",
  "Plan your wealth with clarity",
  "Add WealthPlan to your home screen",
  "Welcome to WealthPlan",
  "WealthPlan helps",
] as const;
