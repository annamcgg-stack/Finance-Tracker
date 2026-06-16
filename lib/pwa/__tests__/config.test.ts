import { describe, it, expect } from "vitest";
import { APP_NAME } from "@/lib/branding";
import { PWA_CONFIG, PWA_ICON_PATHS } from "@/lib/pwa/config";

describe("PWA config", () => {
  it("uses Finance Tracker as display and short name", () => {
    expect(PWA_CONFIG.name).toBe(APP_NAME);
    expect(PWA_CONFIG.shortName).toBe(APP_NAME);
  });

  it("uses standalone display and theme colour #0f172a", () => {
    expect(PWA_CONFIG.display).toBe("standalone");
    expect(PWA_CONFIG.themeColor).toBe("#0f172a");
    expect(PWA_CONFIG.backgroundColor).toBe("#0f172a");
  });

  it("defines required icon paths", () => {
    expect(PWA_ICON_PATHS.icon192).toBe("/icons/icon-192.png");
    expect(PWA_ICON_PATHS.icon512).toBe("/icons/icon-512.png");
    expect(PWA_ICON_PATHS.appleTouch).toBe("/icons/apple-touch-icon.png");
  });

  it("uses bumped cache version for PWA updates", () => {
    expect(PWA_CONFIG.cacheVersion).toBe("finance-tracker-v4");
  });
});
