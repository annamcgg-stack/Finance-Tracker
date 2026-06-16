import type {
  DashboardViewMode,
  FinanceData,
  FixedExpense,
  PartnerSharedData,
  ExpenseSplitType,
} from "@/lib/types";
import { getIntegratedNetWorth } from "./net-worth";
import { getExpenseMonthlyTotal } from "./expenses";
import { getTotalPortfolioValue } from "./portfolio";
import { getDashboardSummary } from "./cashflow";

function isShared(visibility: string): boolean {
  return visibility === "household" || visibility === "shared_account_only";
}

export function filterByView<T extends { visibility: string }>(
  items: T[],
  mode: DashboardViewMode,
  isOwn: boolean
): T[] {
  if (mode === "personal") {
    return isOwn ? items : [];
  }
  if (mode === "shared") {
    return items.filter((i) => isShared(i.visibility));
  }
  // combined: own everything + partner shared only
  if (isOwn) return items;
  return items.filter((i) => isShared(i.visibility));
}

export function buildViewFinanceData(
  personal: FinanceData,
  partnerData: PartnerSharedData[],
  mode: DashboardViewMode
): FinanceData {
  if (mode === "personal") {
    return personal;
  }

  const partnerExpenses = partnerData.flatMap((p) =>
    p.expenses.map((e) => ({ ...e, ownerUserId: p.userId }))
  );
  const partnerGoals = partnerData.flatMap((p) =>
    p.goals.map((g) => ({ ...g, ownerUserId: p.userId }))
  );
  const partnerHoldings = partnerData.flatMap((p) =>
    p.investmentHoldings.map((h) => ({ ...h, ownerUserId: p.userId }))
  );
  const partnerMortgages = partnerData.flatMap((p) =>
    p.mortgageAccounts.map((m) => ({ ...m, ownerUserId: p.userId }))
  );
  const partnerExtraPayments = partnerData.flatMap((p) => p.mortgageExtraPayments);
  const partnerAssets = partnerData.flatMap((p) =>
    p.assets.map((a) => ({ ...a, ownerUserId: p.userId }))
  );
  const partnerLiabilities = partnerData.flatMap((p) =>
    p.liabilities.map((l) => ({ ...l, ownerUserId: p.userId }))
  );
  const partnerSinkingFunds = partnerData.flatMap((p) =>
    p.sinkingFunds.map((s) => ({ ...s, ownerUserId: p.userId }))
  );

  if (mode === "shared") {
    const ownShared = <T extends { visibility: string }>(items: T[]) =>
      items.filter((i) => isShared(i.visibility));
    return {
      ...personal,
      expenses: [...ownShared(personal.expenses), ...partnerExpenses.filter((e) => isShared(e.visibility))],
      goals: [...ownShared(personal.goals), ...partnerGoals.filter((g) => isShared(g.visibility))],
      investmentHoldings: [
        ...ownShared(personal.investmentHoldings),
        ...partnerHoldings.filter((h) => isShared(h.visibility)),
      ],
      mortgageAccounts: [
        ...ownShared(personal.mortgageAccounts),
        ...partnerMortgages.filter((m) => isShared(m.visibility)),
      ],
      mortgageExtraPayments: [
        ...personal.mortgageExtraPayments.filter((p) =>
          personal.mortgageAccounts.some(
            (m) => m.id === p.mortgageAccountId && isShared(m.visibility)
          )
        ),
        ...partnerExtraPayments,
      ],
      assets: [...ownShared(personal.assets), ...partnerAssets.filter((a) => isShared(a.visibility))],
      liabilities: [
        ...ownShared(personal.liabilities),
        ...partnerLiabilities.filter((l) => isShared(l.visibility)),
      ],
      sinkingFunds: [
        ...ownShared(personal.sinkingFunds),
        ...partnerSinkingFunds.filter((s) => isShared(s.visibility)),
      ],
    };
  }

  // combined: all personal + partner shared
  return {
    ...personal,
    expenses: [...personal.expenses, ...partnerExpenses.filter((e) => isShared(e.visibility))],
    goals: [...personal.goals, ...partnerGoals.filter((g) => isShared(g.visibility))],
    investmentHoldings: [
      ...personal.investmentHoldings,
      ...partnerHoldings.filter((h) => isShared(h.visibility)),
    ],
    mortgageAccounts: [
      ...personal.mortgageAccounts,
      ...partnerMortgages.filter((m) => isShared(m.visibility)),
    ],
    mortgageExtraPayments: [
      ...personal.mortgageExtraPayments,
      ...partnerExtraPayments.filter((p) =>
        partnerMortgages.some((m) => m.id === p.mortgageAccountId && isShared(m.visibility))
      ),
    ],
    assets: [...personal.assets, ...partnerAssets.filter((a) => isShared(a.visibility))],
    liabilities: [...personal.liabilities, ...partnerLiabilities.filter((l) => isShared(l.visibility))],
    sinkingFunds: [
      ...personal.sinkingFunds,
      ...partnerSinkingFunds.filter((s) => isShared(s.visibility)),
    ],
  };
}

export function calculateExpenseSplit(expense: FixedExpense): {
  userAmount: number;
  partnerAmount: number;
} {
  const total = expense.amount;
  if (expense.splitType === "50_50") {
    const half = total / 2;
    return { userAmount: half, partnerAmount: half };
  }
  if (expense.splitType === "percentage") {
    const userPct = expense.userContributionPercent / 100;
    return {
      userAmount: total * userPct,
      partnerAmount: total * (1 - userPct),
    };
  }
  return {
    userAmount: expense.userContributionAmount,
    partnerAmount: expense.partnerContributionAmount,
  };
}

export function applyExpenseSplit(
  expense: FixedExpense,
  splitType: ExpenseSplitType,
  userAmount?: number,
  partnerAmount?: number,
  userPercent?: number
): FixedExpense {
  const split = { splitType, userContributionAmount: 0, partnerContributionAmount: 0, userContributionPercent: 50 };
  if (splitType === "50_50") {
    const half = expense.amount / 2;
    return { ...expense, ...split, userContributionAmount: half, partnerContributionAmount: half, userContributionPercent: 50 };
  }
  if (splitType === "percentage") {
    const pct = userPercent ?? 50;
    const userAmt = expense.amount * (pct / 100);
    return {
      ...expense,
      ...split,
      userContributionPercent: pct,
      userContributionAmount: userAmt,
      partnerContributionAmount: expense.amount - userAmt,
    };
  }
  return {
    ...expense,
    ...split,
    userContributionAmount: userAmount ?? expense.userContributionAmount,
    partnerContributionAmount: partnerAmount ?? expense.partnerContributionAmount,
  };
}

export function calculateHouseholdCombinedNetWorth(
  personal: FinanceData,
  partnerData: PartnerSharedData[]
): number {
  const combined = buildViewFinanceData(personal, partnerData, "combined");
  return getIntegratedNetWorth(combined).netWorth;
}

export function getHouseholdDashboardStats(
  personal: FinanceData,
  partnerData: PartnerSharedData[],
  mode: DashboardViewMode
) {
  const viewData = buildViewFinanceData(personal, partnerData, mode);
  const summary = getDashboardSummary(viewData);
  const sharedExpenses = viewData.expenses.filter((e) => isShared(e.visibility));
  const sharedMonthlyExpenses = getExpenseMonthlyTotal(sharedExpenses);
  const portfolioValue = getTotalPortfolioValue(viewData.investmentHoldings);

  return {
    ...summary,
    sharedMonthlyExpenses,
    portfolioValue,
    mode,
    partnerCount: partnerData.length,
  };
}

export function isPrivateDataVisibleToPartner(visibility: string): boolean {
  return isShared(visibility);
}

export function canMemberAccessHousehold(
  memberStatus: string,
  householdId: string | null,
  itemHouseholdId: string | null
): boolean {
  if (memberStatus !== "active") return false;
  if (!householdId || !itemHouseholdId) return false;
  return householdId === itemHouseholdId;
}
