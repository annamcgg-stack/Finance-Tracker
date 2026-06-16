import type { InvestmentProjectionSettings } from "../types";

export interface ProjectionPoint {
  year: number;
  value: number;
  contributions: number;
  growth: number;
}

export interface ProjectionResult {
  futureValue: number;
  totalContributions: number;
  totalGrowth: number;
  points: ProjectionPoint[];
}

export function calculateInvestmentProjection(
  settings: InvestmentProjectionSettings
): ProjectionResult {
  const { currentValue, monthlyContribution, annualReturn, timeHorizonYears } = settings;
  const monthlyRate = annualReturn / 100 / 12;
  const months = timeHorizonYears * 12;

  let value = currentValue;
  let totalContributed = currentValue;
  const points: ProjectionPoint[] = [{ year: 0, value: currentValue, contributions: currentValue, growth: 0 }];

  for (let m = 1; m <= months; m++) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    totalContributed += monthlyContribution;

    if (m % 12 === 0) {
      const year = m / 12;
      points.push({
        year,
        value: Math.round(value),
        contributions: Math.round(totalContributed),
        growth: Math.round(value - totalContributed),
      });
    }
  }

  return {
    futureValue: Math.round(value),
    totalContributions: Math.round(totalContributed - currentValue),
    totalGrowth: Math.round(value - totalContributed),
    points,
  };
}

export function getScenarioReturns(base: number) {
  return {
    conservative: base - 2,
    base,
    optimistic: base + 3,
  };
}
