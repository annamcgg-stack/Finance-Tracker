import type { Asset, FinanceData, Liability, NetWorthSnapshot } from "../types";
import { getTotalPortfolioValue } from "./portfolio";
import { getTotalMortgageBalance, getTotalPropertyValue, getEarliestPayoffDate } from "./mortgage";

export function getTotalAssets(assets: Asset[]): number {
  return assets.reduce((sum, a) => sum + a.value, 0);
}

export function getTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.value, 0);
}

export function getNetWorth(assets: Asset[], liabilities: Liability[]): number {
  return getTotalAssets(assets) - getTotalLiabilities(liabilities);
}

/** Integrated net worth including portfolio holdings and mortgages */
export function getIntegratedNetWorth(data: FinanceData) {
  const manualAssets = getTotalAssets(data.assets);
  const portfolioValue = getTotalPortfolioValue(data.investmentHoldings);
  const propertyValue = getTotalPropertyValue(data.mortgageAccounts);

  const manualLiabilities = getTotalLiabilities(data.liabilities);
  const mortgageBalance = getTotalMortgageBalance(data.mortgageAccounts);

  const totalAssets = manualAssets + portfolioValue + propertyValue;
  const totalLiabilities = manualLiabilities + mortgageBalance;
  const netWorth = totalAssets - totalLiabilities;

  const extrasByMortgage = new Map<string, typeof data.mortgageExtraPayments>();
  for (const extra of data.mortgageExtraPayments) {
    const list = extrasByMortgage.get(extra.mortgageAccountId) ?? [];
    list.push(extra);
    extrasByMortgage.set(extra.mortgageAccountId, list);
  }

  const mortgagePayoffDate = getEarliestPayoffDate(data.mortgageAccounts, extrasByMortgage);

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    portfolioValue,
    mortgageBalance,
    propertyValue,
    mortgagePayoffDate,
  };
}

export function getAssetAllocation(assets: Asset[]) {
  const total = getTotalAssets(assets);
  const byType = new Map<string, number>();
  for (const asset of assets) {
    byType.set(asset.type, (byType.get(asset.type) ?? 0) + asset.value);
  }
  return Array.from(byType.entries()).map(([type, value]) => ({
    type,
    value,
    percentage: total > 0 ? (value / total) * 100 : 0,
  }));
}

export function getNetWorthTrend(snapshots: NetWorthSnapshot[]) {
  return [...snapshots]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((s) => ({
      date: s.date,
      label: new Date(s.date).toLocaleDateString("en-AU", { month: "short", year: "2-digit" }),
      netWorth: s.netWorth,
      assets: s.totalAssets,
      liabilities: s.totalLiabilities,
    }));
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  cash: "Cash",
  savings: "Savings",
  shares_etfs: "Shares / ETFs",
  superannuation: "Superannuation",
  property: "Property",
  vehicles: "Vehicles",
  other: "Other Assets",
};

export const LIABILITY_TYPE_LABELS: Record<string, string> = {
  credit_cards: "Credit Cards",
  personal_loans: "Personal Loans",
  hecs_help: "HECS / HELP",
  car_loans: "Car Loans",
  mortgage: "Mortgage",
  other: "Other Liabilities",
};
