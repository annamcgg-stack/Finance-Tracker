export const PWA_CONFIG = {
  name: "Finance Tracker",
  shortName: "WealthPlan",
  description: "Track income, expenses, savings, investments, and net worth.",
  themeColor: "#0f172a",
  backgroundColor: "#0f172a",
  display: "standalone" as const,
  startUrl: "/",
  scope: "/",
  orientation: "portrait-primary" as const,
  cacheVersion: "wealthplan-v1",
} as const;

export const PWA_ICON_PATHS = {
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  maskable512: "/icons/icon-maskable-512.png",
  appleTouch: "/icons/apple-touch-icon.png",
} as const;
