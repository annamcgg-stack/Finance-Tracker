import type { SinkingFund } from "../types";

export function getSinkingFundMonthlyContribution(fund: SinkingFund): number {
  return fund.annualTarget / 12;
}

export function getTotalSinkingFundMonthly(funds: SinkingFund[]): number {
  return funds.reduce((sum, f) => sum + getSinkingFundMonthlyContribution(f), 0);
}

export function getSinkingFundProgress(fund: SinkingFund): number {
  if (fund.annualTarget <= 0) return 0;
  return Math.min(100, (fund.currentBalance / fund.annualTarget) * 100);
}

export function getTotalSinkingFundAnnual(funds: SinkingFund[]): number {
  return funds.reduce((sum, f) => sum + f.annualTarget, 0);
}
