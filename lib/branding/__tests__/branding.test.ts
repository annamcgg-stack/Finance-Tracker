import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_INTRO,
  APP_PWA_INSTALL_LINE,
  APP_DASHBOARD_DESCRIPTION,
  FORBIDDEN_BRAND_STRINGS,
} from "@/lib/branding";

function collectFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      collectFiles(full, acc);
    } else if (/\.(tsx|ts|html|json)$/.test(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

describe("branding", () => {
  it("uses Finance Tracker as the app name", () => {
    expect(APP_NAME).toBe("Finance Tracker");
    expect(APP_TAGLINE).toBe("Track your finances with clarity");
    expect(APP_INTRO).toContain("Finance Tracker helps");
    expect(APP_PWA_INSTALL_LINE).toContain("Finance Tracker");
    expect(APP_DASHBOARD_DESCRIPTION).toBe("Your financial overview at a glance.");
  });

  it("has no forbidden WealthPlan strings in user-facing source", () => {
    const root = join(process.cwd());
    const dirs = ["app", "components", "public", "lib/branding", "lib/pwa", "lib/profile"];
    const files = dirs.flatMap((d) => collectFiles(join(root, d)));

    const offenders: string[] = [];
    for (const file of files) {
      if (file.includes("branding.test.ts")) continue;
      const content = readFileSync(file, "utf8");
      for (const forbidden of FORBIDDEN_BRAND_STRINGS) {
        if (content.includes(forbidden)) {
          offenders.push(`${file}: "${forbidden}"`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
