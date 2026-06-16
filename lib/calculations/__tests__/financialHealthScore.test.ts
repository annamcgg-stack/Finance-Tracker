import { describe, it, expect } from "vitest";
import { calculateFinancialHealthScore, getHealthRating } from "@/lib/calculations/financialHealthScore";
import { EMPTY_FINANCE_DATA } from "@/lib/constants";

describe("financialHealthScore", () => {
  it("returns score between 0 and 100", () => {
    const result = calculateFinancialHealthScore(EMPTY_FINANCE_DATA);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns a rating label", () => {
    expect(getHealthRating(90)).toBe("Excellent");
    expect(getHealthRating(75)).toBe("Strong");
    expect(getHealthRating(60)).toBe("Stable");
    expect(getHealthRating(45)).toBe("Getting Started");
    expect(getHealthRating(20)).toBe("Needs Attention");
  });

  it("provides three suggestions", () => {
    const result = calculateFinancialHealthScore(EMPTY_FINANCE_DATA);
    expect(result.suggestions).toHaveLength(3);
  });

  it("scores higher with strong emergency fund", () => {
    const withExpenses = {
      ...EMPTY_FINANCE_DATA,
      expenses: [
        {
          id: "1",
          name: "Rent",
          category: "rent_mortgage" as const,
          amount: 2000,
          frequency: "monthly" as const,
          active: true,
          splitType: "50_50" as const,
          userContributionAmount: 1000,
          partnerContributionAmount: 1000,
          userContributionPercent: 50,
          visibility: "private" as const,
          householdId: null,
          sharedAccountId: null,
        },
      ],
    };
    const weak = calculateFinancialHealthScore({
      ...withExpenses,
      emergencyFundBalance: 0,
    });
    const strong = calculateFinancialHealthScore({
      ...withExpenses,
      emergencyFundBalance: 15000,
    });
    expect(strong.score).toBeGreaterThan(weak.score);
  });
});
