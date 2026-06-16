import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxEngine } from "./types";

/** Stub — NZ progressive tax (simplified placeholder) */
export const newZealandTaxEngine: TaxEngine = {
  getStateProvinces: () => [],

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const taxableIncome = Math.max(0, grossIncome - income.salarySacrifice);

    let tax = 0;
    if (taxableIncome > 180000) tax += (taxableIncome - 180000) * 0.39;
    if (taxableIncome > 70000) tax += (Math.min(taxableIncome, 180000) - 70000) * 0.33;
    if (taxableIncome > 14000) tax += (Math.min(taxableIncome, 70000) - 14000) * 0.175;
    if (taxableIncome > 0) tax += Math.min(taxableIncome, 14000) * 0.105;

    const netIncome = grossIncome - tax - income.superContribution;

    return {
      grossIncome,
      taxableIncome,
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
