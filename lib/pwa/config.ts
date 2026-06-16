import { APP_NAME } from "@/lib/branding";

export const PWA_CONFIG = {
  name: APP_NAME,
  shortName: APP_NAME,
  description: "Track income, expenses, savings, investments, and net worth.",
  themeColor: "#0f172a",
  backgroundColor: "#0f172a",
  display: "standalone" as const,
  startUrl: "/",
  scope: "/",
  orientation: "portrait-primary" as const,
  cacheVersion: "finance-tracker-v4",
} as const;

/** App label used in PWA metadata, browser titles, and install prompts. */
export const APP_DISPLAY_NAME = PWA_CONFIG.shortName;

export const PWA_ICON_PATHS = {
  icon192: "/icons/icon-192.png",
  icon512: "/icons/icon-512.png",
  maskable512: "/icons/icon-maskable-512.png",
  appleTouch: "/icons/apple-touch-icon.png",
} as const;
