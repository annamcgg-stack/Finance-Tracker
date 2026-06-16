import { describe, it, expect } from "vitest";
import { DEFAULT_FINANCE_DATA } from "@/lib/constants";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import {
  buildViewFinanceData,
  calculateExpenseSplit,
  applyExpenseSplit,
  calculateHouseholdCombinedNetWorth,
  filterByView,
  isPrivateDataVisibleToPartner,
  canMemberAccessHousehold,
} from "@/lib/calculations/household";
import type { FinanceData, FixedExpense, PartnerSharedData } from "@/lib/types";

function makeExpense(overrides: Partial<FixedExpense> = {}): FixedExpense {
  return {
    id: "exp-1",
    name: "Rent",
    category: "rent_mortgage",
    amount: 3000,
    frequency: "monthly",
    active: true,
    splitType: "50_50",
    userContributionAmount: 1500,
    partnerContributionAmount: 1500,
    userContributionPercent: 50,
    ...DEFAULT_SHAREABLE,
    ...overrides,
  };
}

const personalData: FinanceData = {
  ...DEFAULT_FINANCE_DATA,
  expenses: [
    makeExpense({ id: "private-exp", visibility: "private" }),
    makeExpense({ id: "shared-exp", visibility: "household", householdId: "hh-1" }),
  ],
  goals: [],
  investmentHoldings: [],
  mortgageAccounts: [],
};

const partnerShared: PartnerSharedData[] = [
  {
    userId: "partner-1",
    email: "partner@test.com",
    expenses: [
      makeExpense({
        id: "partner-private",
        visibility: "private",
        ownerUserId: "partner-1",
      }),
      makeExpense({
        id: "partner-shared",
        visibility: "household",
        householdId: "hh-1",
        ownerUserId: "partner-1",
        amount: 200,
      }),
    ],
    goals: [],
    investmentHoldings: [],
    mortgageAccounts: [],
    mortgageExtraPayments: [],
    assets: [],
    liabilities: [],
    sinkingFunds: [],
  },
];

describe("household sharing calculations", () => {
  it("creates household view with only shared items", () => {
    const shared = buildViewFinanceData(personalData, partnerShared, "shared");
    expect(shared.expenses.map((e) => e.id)).toEqual(["shared-exp", "partner-shared"]);
  });

  it("combined view includes private and partner shared only", () => {
    const combined = buildViewFinanceData(personalData, partnerShared, "combined");
    const ids = combined.expenses.map((e) => e.id);
    expect(ids).toContain("private-exp");
    expect(ids).toContain("shared-exp");
    expect(ids).toContain("partner-shared");
    expect(ids).not.toContain("partner-private");
  });

  it("personal view shows only own data", () => {
    const personal = buildViewFinanceData(personalData, partnerShared, "personal");
    expect(personal.expenses).toHaveLength(2);
    expect(personal.expenses.every((e) => !e.ownerUserId)).toBe(true);
  });

  it("calculates 50/50 expense split", () => {
    const split = calculateExpenseSplit(makeExpense({ amount: 3000, splitType: "50_50" }));
    expect(split.userAmount).toBe(1500);
    expect(split.partnerAmount).toBe(1500);
  });

  it("calculates percentage expense split", () => {
    const split = calculateExpenseSplit(
      makeExpense({ amount: 1000, splitType: "percentage", userContributionPercent: 60 })
    );
    expect(split.userAmount).toBe(600);
    expect(split.partnerAmount).toBe(400);
  });

  it("calculates custom expense split", () => {
    const split = calculateExpenseSplit(
      makeExpense({
        amount: 3000,
        splitType: "custom",
        userContributionAmount: 2000,
        partnerContributionAmount: 1000,
      })
    );
    expect(split.userAmount).toBe(2000);
    expect(split.partnerAmount).toBe(1000);
  });

  it("applyExpenseSplit updates contributions on amount change", () => {
    const updated = applyExpenseSplit(makeExpense({ amount: 1000 }), "50_50");
    expect(updated.userContributionAmount).toBe(500);
    expect(updated.partnerContributionAmount).toBe(500);
  });

  it("private data is not visible to partner", () => {
    expect(isPrivateDataVisibleToPartner("private")).toBe(false);
    expect(isPrivateDataVisibleToPartner("household")).toBe(true);
  });

  it("removed member loses household access", () => {
    expect(canMemberAccessHousehold("removed", "hh-1", "hh-1")).toBe(false);
    expect(canMemberAccessHousehold("active", "hh-1", "hh-1")).toBe(true);
    expect(canMemberAccessHousehold("active", "hh-1", "hh-2")).toBe(false);
  });

  it("filterByView respects visibility rules", () => {
    const items = [
      makeExpense({ id: "a", visibility: "private" }),
      makeExpense({ id: "b", visibility: "household" }),
    ];
    expect(filterByView(items, "shared", true)).toHaveLength(1);
    expect(filterByView(items, "personal", true)).toHaveLength(2);
    expect(filterByView(items, "shared", false)).toHaveLength(1);
  });

  it("calculates household combined net worth", () => {
    const data: FinanceData = {
      ...DEFAULT_FINANCE_DATA,
      assets: [{ id: "a1", name: "Cash", type: "cash", value: 100000, ...DEFAULT_SHAREABLE }],
      liabilities: [],
      investmentHoldings: [],
      mortgageAccounts: [],
    };
    const partner: PartnerSharedData[] = [
      {
        userId: "p1",
        email: null,
        assets: [
          {
            id: "a2",
            name: "Shared savings",
            type: "savings",
            value: 50000,
            visibility: "household",
            householdId: "hh-1",
            sharedAccountId: null,
            ownerUserId: "p1",
          },
        ],
        expenses: [],
        goals: [],
        investmentHoldings: [],
        mortgageAccounts: [],
        mortgageExtraPayments: [],
        liabilities: [],
        sinkingFunds: [],
      },
    ];
    const nw = calculateHouseholdCombinedNetWorth(data, partner);
    expect(nw).toBe(150000);
  });
});

describe("household service logic (unit)", () => {
  it("defaults all new items to private visibility", () => {
    expect(DEFAULT_SHAREABLE.visibility).toBe("private");
    expect(DEFAULT_SHAREABLE.householdId).toBeNull();
  });
});
