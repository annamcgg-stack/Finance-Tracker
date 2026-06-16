import { describe, it, expect } from "vitest";
import { DEFAULT_FINANCE_DATA } from "@/lib/constants";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import {
  evaluateOwnerLeave,
  getOwnershipTransferCandidates,
  validateOwnershipTransfer,
  canMemberLeave,
  filterPartnerDataByActiveMembers,
  retainPrivateDataAfterUnlink,
  sharedItemsRemainWithHousehold,
  partnerDataAfterRemoval,
} from "@/lib/household/unlink";
import {
  buildViewFinanceData,
  canMemberAccessHousehold,
} from "@/lib/calculations/household";
import type { HouseholdMember, PartnerSharedData, FixedExpense } from "@/lib/types";

function member(
  userId: string,
  role: HouseholdMember["role"],
  status: HouseholdMember["status"] = "active"
): HouseholdMember {
  return {
    id: `m-${userId}`,
    householdId: "hh-1",
    userId,
    email: `${userId}@test.com`,
    role,
    status,
    createdAt: "2025-01-01",
  };
}

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

describe("household unlink logic", () => {
  it("allows non-owner members to leave", () => {
    expect(canMemberLeave(member("user-2", "member"))).toBe(true);
    expect(canMemberLeave(member("user-1", "owner"))).toBe(false);
    expect(canMemberLeave(null)).toBe(false);
  });

  it("requires owner to transfer when other active members exist", () => {
    const members = [member("owner", "owner"), member("partner", "member")];
    const result = evaluateOwnerLeave(members, "owner");
    expect(result.allowed).toBe(false);
    expect(result.requiresTransfer).toBe(true);
    expect(result.requiresDelete).toBe(false);
  });

  it("allows sole owner to delete household when leaving", () => {
    const members = [member("owner", "owner")];
    const result = evaluateOwnerLeave(members, "owner");
    expect(result.allowed).toBe(true);
    expect(result.requiresDelete).toBe(true);
    expect(result.requiresTransfer).toBe(false);
  });

  it("lists ownership transfer candidates excluding owner", () => {
    const members = [
      member("owner", "owner"),
      member("partner", "member"),
      member("admin", "admin"),
      member("removed", "member", "removed"),
    ];
    const candidates = getOwnershipTransferCandidates(members, "owner");
    expect(candidates.map((c) => c.userId)).toEqual(["partner", "admin"]);
  });

  it("validates ownership transfer", () => {
    const members = [member("owner", "owner"), member("partner", "member")];
    expect(validateOwnershipTransfer(members, "owner", "partner").valid).toBe(true);
    expect(validateOwnershipTransfer(members, "partner", "owner").valid).toBe(false);
    expect(validateOwnershipTransfer(members, "owner", "owner").valid).toBe(false);
  });

  it("removed user loses household access", () => {
    expect(canMemberAccessHousehold("removed", "hh-1", "hh-1")).toBe(false);
  });

  it("filters partner data to active members only", () => {
    const partnerData: PartnerSharedData[] = [
      {
        userId: "active-partner",
        email: null,
        expenses: [],
        goals: [],
        investmentHoldings: [],
        mortgageAccounts: [],
        mortgageExtraPayments: [],
        assets: [],
        liabilities: [],
        sinkingFunds: [],
      },
      {
        userId: "removed-partner",
        email: null,
        expenses: [],
        goals: [],
        investmentHoldings: [],
        mortgageAccounts: [],
        mortgageExtraPayments: [],
        assets: [],
        liabilities: [],
        sinkingFunds: [],
      },
    ];
    const filtered = filterPartnerDataByActiveMembers(
      partnerData,
      new Set(["active-partner"])
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].userId).toBe("active-partner");
  });

  it("retains private data and resets dashboard view after unlink", () => {
    const data = {
      ...DEFAULT_FINANCE_DATA,
      dashboardView: "combined" as const,
      expenses: [makeExpense({ visibility: "private" }), makeExpense({ visibility: "household", householdId: "hh-1" })],
    };
    const retained = retainPrivateDataAfterUnlink(data);
    expect(retained.expenses).toHaveLength(2);
    expect(retained.dashboardView).toBe("personal");
    expect(retained.expenses[0].visibility).toBe("private");
  });

  it("keeps shared items with household for remaining members", () => {
    const items = [
      makeExpense({ id: "private", visibility: "private" }),
      makeExpense({ id: "shared", visibility: "household", householdId: "hh-1" }),
    ];
    const remaining = sharedItemsRemainWithHousehold(items, "hh-1");
    expect(remaining.map((i) => i.id)).toEqual(["shared"]);
  });

  it("clears partner data after user removal", () => {
    expect(partnerDataAfterRemoval()).toEqual([]);
  });

  it("removed member no longer appears in combined dashboard partner data", () => {
    const personal = {
      ...DEFAULT_FINANCE_DATA,
      expenses: [makeExpense({ id: "mine-private", visibility: "private" })],
    };
    const activePartner: PartnerSharedData[] = [
      {
        userId: "partner",
        email: null,
        expenses: [makeExpense({ id: "partner-shared", visibility: "household", householdId: "hh-1" })],
        goals: [],
        investmentHoldings: [],
        mortgageAccounts: [],
        mortgageExtraPayments: [],
        assets: [],
        liabilities: [],
        sinkingFunds: [],
      },
    ];
    const combinedWithPartner = buildViewFinanceData(personal, activePartner, "combined");
    expect(combinedWithPartner.expenses.map((e) => e.id)).toContain("partner-shared");

    const afterRemoval = buildViewFinanceData(
      personal,
      filterPartnerDataByActiveMembers(activePartner, new Set()),
      "combined"
    );
    expect(afterRemoval.expenses.map((e) => e.id)).not.toContain("partner-shared");
    expect(afterRemoval.expenses.map((e) => e.id)).toContain("mine-private");
  });
});
