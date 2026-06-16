import { describe, it, expect } from "vitest";
import { parseSetupCompleted, needsOnboarding } from "@/lib/profile/setup";

describe("parseSetupCompleted", () => {
  it("returns true only when setup_completed is true", () => {
    expect(parseSetupCompleted({ setup_completed: true })).toBe(true);
  });

  it("returns false when setup_completed is false", () => {
    expect(parseSetupCompleted({ setup_completed: false })).toBe(false);
  });

  it("falls back to onboarding_completed when setup_completed is null", () => {
    expect(parseSetupCompleted({ setup_completed: null, onboarding_completed: true })).toBe(true);
    expect(parseSetupCompleted({ onboarding_completed: false })).toBe(false);
  });

  it("returns false when profile is missing", () => {
    expect(parseSetupCompleted(null)).toBe(false);
  });
});

describe("needsOnboarding", () => {
  it("requires setup when not completed", () => {
    expect(needsOnboarding(false)).toBe(true);
    expect(needsOnboarding(true)).toBe(false);
  });

  it("does not redirect while profile is still loading", () => {
    expect(needsOnboarding(false, { profileReady: false })).toBe(false);
  });
});
