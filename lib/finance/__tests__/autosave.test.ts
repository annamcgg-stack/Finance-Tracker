import { describe, it, expect } from "vitest";
import { preserveAccountPreferences } from "../autosave";
import { EMPTY_FINANCE_DATA } from "@/lib/constants";

describe("finance autosave", () => {
  it("preserves account preferences when resetting financial data", () => {
    const prefs = preserveAccountPreferences({
      setupCompleted: true,
      setupChoice: "individual",
      onboardingCompleted: true,
      dashboardView: "combined",
      darkMode: true,
    });

    const reset = { ...EMPTY_FINANCE_DATA, ...prefs };

    expect(reset.setupCompleted).toBe(true);
    expect(reset.setupChoice).toBe("individual");
    expect(reset.dashboardView).toBe("combined");
    expect(reset.darkMode).toBe(true);
    expect(reset.expenses).toEqual([]);
    expect(reset.income.salary).toBe(0);
  });
});
