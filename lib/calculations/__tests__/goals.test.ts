import { describe, it, expect } from "vitest";
import { getMonthlyNeededForGoal, sortGoalsByPriority } from "@/lib/calculations/goals";
import type { FinancialGoal } from "@/lib/types";

const baseGoal: FinancialGoal = {
  id: "1",
  name: "Test",
  type: "custom",
  targetAmount: 12000,
  currentAmount: 0,
  monthlyContribution: 500,
  targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  priority: 3,
  userContributionAmount: 0,
  partnerContributionAmount: 0,
  visibility: "private",
  householdId: null,
  sharedAccountId: null,
};

describe("goals", () => {
  it("calculates monthly needed to hit target date", () => {
    const needed = getMonthlyNeededForGoal(baseGoal);
    expect(needed).not.toBeNull();
    expect(needed!).toBeGreaterThan(0);
  });

  it("sorts by priority then progress", () => {
    const sorted = sortGoalsByPriority([
      { ...baseGoal, id: "a", priority: 3, currentAmount: 6000 },
      { ...baseGoal, id: "b", priority: 1, currentAmount: 1000 },
    ]);
    expect(sorted[0].id).toBe("b");
  });
});
