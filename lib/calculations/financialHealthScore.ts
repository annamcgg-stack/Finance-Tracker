import type { FinanceData, FinancialHealthSnapshot } from "../types";
import { calculateCashflow } from "./cashflow";
import { getIntegratedNetWorth, getNetWorthTrend } from "./net-worth";
import { getGoalOnTrack, getGoalProgress } from "./goals";
import { getTotalMortgageBalance } from "./mortgage";
import { generateId } from "../format";

export type HealthCategory =
  | "emergencyFund"
  | "savingsRate"
  | "debtToIncome"
  | "netWorthGrowth"
  | "investmentConsistency"
  | "goalProgress"
  | "mortgagePressure"
  | "spendingStability";

export type HealthRating =
  | "Needs Attention"
  | "Getting Started"
  | "Stable"
  | "Strong"
  | "Excellent";

export const HEALTH_CATEGORY_LABELS: Record<HealthCategory, string> = {
  emergencyFund: "Emergency fund strength",
  savingsRate: "Savings rate",
  debtToIncome: "Debt-to-income ratio",
  netWorthGrowth: "Net worth growth",
  investmentConsistency: "Investment consistency",
  goalProgress: "Goal progress",
  mortgagePressure: "Mortgage / loan pressure",
  spendingStability: "Spending stability",
};

const CATEGORY_WEIGHTS: Record<HealthCategory, number> = {
  emergencyFund: 0.15,
  savingsRate: 0.15,
  debtToIncome: 0.12,
  netWorthGrowth: 0.12,
  investmentConsistency: 0.1,
  goalProgress: 0.12,
  mortgagePressure: 0.12,
  spendingStability: 0.12,
};

const SUGGESTIONS: Record<HealthCategory, string> = {
  emergencyFund:
    "Consider building your emergency fund toward 3–6 months of essential expenses.",
  savingsRate:
    "You may want to review your budget to increase the portion of income you save each month.",
  debtToIncome:
    "This could help to prioritise paying down high-interest debt to reduce your debt-to-income ratio.",
  netWorthGrowth:
    "Consider tracking net worth monthly — steady growth often reflects balanced saving and investing.",
  investmentConsistency:
    "You may want to set a regular monthly investment amount, even if modest, to build consistency.",
  goalProgress:
    "Consider reviewing goals with the largest gaps and adjusting monthly contributions if needed.",
  mortgagePressure:
    "This could help to explore extra repayments or offset balances to reduce mortgage pressure over time.",
  spendingStability:
    "Consider keeping fixed expenses predictable — large swings can make planning harder.",
};

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreEmergencyFund(data: FinanceData, monthlyExpenses: number): number {
  if (monthlyExpenses <= 0) return data.emergencyFundBalance > 0 ? 70 : 40;
  const months = data.emergencyFundBalance / monthlyExpenses;
  if (months >= 6) return 100;
  if (months >= 3) return 75;
  if (months >= 1) return 50;
  if (months > 0) return 30;
  return 10;
}

function scoreSavingsRate(savingsRate: number): number {
  if (savingsRate >= 20) return 100;
  if (savingsRate >= 10) return 80;
  if (savingsRate >= 5) return 55;
  if (savingsRate > 0) return 35;
  return 15;
}

function scoreDebtToIncome(monthlyNet: number, totalLiabilities: number): number {
  if (monthlyNet <= 0) return totalLiabilities > 0 ? 20 : 50;
  const annualIncome = monthlyNet * 12;
  const ratio = totalLiabilities / annualIncome;
  if (ratio <= 0.5) return 100;
  if (ratio <= 1) return 80;
  if (ratio <= 2) return 55;
  if (ratio <= 3) return 35;
  return 15;
}

function scoreNetWorthGrowth(snapshots: FinanceData["netWorthSnapshots"]): number {
  const trend = getNetWorthTrend(snapshots);
  if (trend.length < 2) return 50;
  const recent = trend.slice(-2);
  const delta = recent[1].netWorth - recent[0].netWorth;
  if (delta > 5000) return 100;
  if (delta > 1000) return 85;
  if (delta > 0) return 70;
  if (delta === 0) return 55;
  if (delta > -1000) return 40;
  return 20;
}

function scoreInvestmentConsistency(data: FinanceData): number {
  const contrib = data.investmentProjection.monthlyContribution;
  if (contrib >= 1000) return 100;
  if (contrib >= 500) return 85;
  if (contrib >= 200) return 70;
  if (contrib > 0) return 55;
  return data.investmentHoldings.length > 0 ? 45 : 25;
}

function scoreGoalProgress(goals: FinanceData["goals"]): number {
  if (goals.length === 0) return 50;
  const avgProgress =
    goals.reduce((s, g) => s + getGoalProgress(g), 0) / goals.length;
  const onTrackRatio =
    goals.filter((g) => getGoalOnTrack(g)).length / goals.length;
  return clampScore(avgProgress * 0.6 + onTrackRatio * 100 * 0.4);
}

function scoreMortgagePressure(monthlyNet: number, mortgageBalance: number): number {
  if (mortgageBalance <= 0) return 85;
  if (monthlyNet <= 0) return 30;
  const yearsOfIncome = mortgageBalance / (monthlyNet * 12);
  if (yearsOfIncome <= 2) return 100;
  if (yearsOfIncome <= 4) return 75;
  if (yearsOfIncome <= 6) return 55;
  if (yearsOfIncome <= 8) return 35;
  return 20;
}

function scoreSpendingStability(expenseRatio: number): number {
  if (expenseRatio <= 50) return 100;
  if (expenseRatio <= 65) return 80;
  if (expenseRatio <= 75) return 60;
  if (expenseRatio <= 85) return 40;
  return 20;
}

export function getHealthRating(score: number): HealthRating {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Stable";
  if (score >= 40) return "Getting Started";
  return "Needs Attention";
}

export function calculateFinancialHealthScore(data: FinanceData) {
  const cashflow = calculateCashflow(data);
  const integrated = getIntegratedNetWorth(data);
  const mortgageBalance = getTotalMortgageBalance(data.mortgageAccounts);

  const categoryScores: Record<HealthCategory, number> = {
    emergencyFund: scoreEmergencyFund(data, cashflow.monthlyExpenses),
    savingsRate: scoreSavingsRate(cashflow.savingsRate),
    debtToIncome: scoreDebtToIncome(cashflow.monthlyNetIncome, integrated.totalLiabilities),
    netWorthGrowth: scoreNetWorthGrowth(data.netWorthSnapshots),
    investmentConsistency: scoreInvestmentConsistency(data),
    goalProgress: scoreGoalProgress(data.goals),
    mortgagePressure: scoreMortgagePressure(cashflow.monthlyNetIncome, mortgageBalance),
    spendingStability: scoreSpendingStability(cashflow.expenseRatio),
  };

  let score = 0;
  for (const [cat, weight] of Object.entries(CATEGORY_WEIGHTS) as [HealthCategory, number][]) {
    score += categoryScores[cat] * weight;
  }
  score = clampScore(score);
  const rating = getHealthRating(score);

  const ranked = (Object.entries(categoryScores) as [HealthCategory, number][])
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([cat]) => SUGGESTIONS[cat]);

  return {
    score,
    rating,
    categoryScores,
    suggestions: ranked,
  };
}

export function createHealthSnapshot(
  data: FinanceData,
  householdId: string | null = null
): FinancialHealthSnapshot {
  const result = calculateFinancialHealthScore(data);
  return {
    id: generateId(),
    date: new Date().toISOString(),
    score: result.score,
    rating: result.rating,
    categoryScores: result.categoryScores,
    suggestions: result.suggestions,
    householdId,
  };
}

export function getHealthScoreTrend(snapshots: FinancialHealthSnapshot[]) {
  return [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: s.date,
      label: new Date(s.date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
      score: s.score,
    }));
}
