import { describe, it, expect } from "vitest";
import {
  dashboardViewToDbMode,
  dbModeToDashboardView,
  getAccountModeLabel,
  ACCOUNT_MODE_OPTIONS,
} from "../preferences";

describe("profile preferences", () => {
  it("maps dashboard views to db modes", () => {
    expect(dashboardViewToDbMode("personal")).toBe("individual");
    expect(dashboardViewToDbMode("shared")).toBe("household");
    expect(dashboardViewToDbMode("combined")).toBe("combined");
  });

  it("maps db modes to dashboard views", () => {
    expect(dbModeToDashboardView("individual")).toBe("personal");
    expect(dbModeToDashboardView("household")).toBe("shared");
    expect(dbModeToDashboardView("combined")).toBe("combined");
    expect(dbModeToDashboardView("shared")).toBe("shared");
    expect(dbModeToDashboardView(undefined)).toBe("personal");
  });

  it("returns account mode labels", () => {
    expect(getAccountModeLabel("personal")).toBe("My Finances");
    expect(getAccountModeLabel("shared")).toBe("Shared Household");
    expect(getAccountModeLabel("combined")).toBe("Combined View");
  });

  it("has three account mode options", () => {
    expect(ACCOUNT_MODE_OPTIONS).toHaveLength(3);
  });
});
