import { describe, it, expect } from "vitest";
import {
  getIntegratedNetWorth,
  getIntegratedAssetAllocation,
  getLiabilityBreakdown,
  getNetWorthPeriodChange,
} from "@/lib/calculations/net-worth";
import { EMPTY_FINANCE_DATA } from "@/lib/constants";

describe("integrated net worth", () => {
  it("includes portfolio and property in assets", () => {
    const data = {
      ...EMPTY_FINANCE_DATA,
      assets: [{ id: "1", name: "Cash", type: "cash" as const, value: 10000, visibility: "private" as const, householdId: null, sharedAccountId: null }],
      investmentHoldings: [
        {
          id: "h1",
          ticker: "VAS",
          exchange: "AX",
          stockName: "VAS",
          country: "AU",
          currency: "AUD",
          shares: 100,
          averagePurchasePrice: 80,
          purchaseDate: "2024-01-01",
          latestPrice: 90,
          latestPriceUpdatedAt: null,
          sector: null,
          notes: "",
          ownershipPercent: 100,
          userContributionAmount: 0,
          partnerContributionAmount: 0,
          visibility: "private" as const,
          householdId: null,
          sharedAccountId: null,
        },
      ],
      mortgageAccounts: [
        {
          id: "m1",
          propertyName: "Home",
          propertyValue: 800000,
          loanAmount: 600000,
          currentBalance: 550000,
          interestRate: 6,
          loanTermYears: 30,
          repaymentFrequency: "monthly" as const,
          regularRepaymentAmount: 3500,
          loanStartDate: "2020-01-01",
          rateType: "variable" as const,
          offsetBalance: 0,
          ownershipSplitPercent: 100,
          userRepaymentContribution: 3500,
          partnerRepaymentContribution: 0,
          visibility: "private" as const,
          householdId: null,
          sharedAccountId: null,
        },
      ],
    };
    const result = getIntegratedNetWorth(data);
    expect(result.totalAssets).toBeGreaterThan(800000);
    expect(result.totalLiabilities).toBeGreaterThanOrEqual(550000);
    expect(result.netWorth).toBe(result.totalAssets - result.totalLiabilities);
  });

  it("builds integrated asset allocation", () => {
    const allocation = getIntegratedAssetAllocation(EMPTY_FINANCE_DATA);
    expect(Array.isArray(allocation)).toBe(true);
  });

  it("builds liability breakdown", () => {
    const breakdown = getLiabilityBreakdown(EMPTY_FINANCE_DATA);
    expect(Array.isArray(breakdown)).toBe(true);
  });

  it("calculates period change from snapshots", () => {
    const change = getNetWorthPeriodChange([
      { id: "1", date: "2025-01-01", netWorth: 100000, totalAssets: 150000, totalLiabilities: 50000 },
      { id: "2", date: "2025-06-01", netWorth: 110000, totalAssets: 160000, totalLiabilities: 50000 },
    ]);
    expect(change.hasHistory).toBe(true);
    expect(change.annualChange).toBe(10000);
  });
});
