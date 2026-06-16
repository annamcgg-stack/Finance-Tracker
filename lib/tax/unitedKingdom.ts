import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxEngine } from "./types";

/** Stub — UK tax (simplified placeholder) */
export const unitedKingdomTaxEngine: TaxEngine = {
  getStateProvinces: () => [],

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const taxableIncome = Math.max(0, grossIncome - income.salarySacrifice - 12570);

    let tax = 0;
    if (taxableIncome > 112570) tax += (taxableIncome - 112570) * 0.45;
    if (taxableIncome > 50270) tax += (Math.min(taxableIncome, 112570) - 50270) * 0.4;
    if (taxableIncome > 0) tax += Math.min(taxableIncome, 50270) * 0.2;

    const netIncome = grossIncome - tax - income.superContribution;

    return {
      grossIncome,
      taxableIncome: Math.max(0, grossIncome - income.salarySacrifice),
      taxPayable: tax,
      medicareLevy: 0,
      netIncome,
      monthlyTakeHome: netIncome / 12,
      fortnightlyTakeHome: netIncome / 26,
      weeklyTakeHome: netIncome / 52,
      effectiveTaxRate: grossIncome > 0 ? (tax / grossIncome) * 100 : 0,
    };
  },
};
