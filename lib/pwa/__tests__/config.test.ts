import { describe, it, expect } from "vitest";
import { PWA_CONFIG, PWA_ICON_PATHS } from "@/lib/pwa/config";

describe("PWA config", () => {
  it("uses Finance Tracker as display name and WealthPlan as short name", () => {
    expect(PWA_CONFIG.name).toBe("Finance Tracker");
    expect(PWA_CONFIG.shortName).toBe("WealthPlan");
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
});
