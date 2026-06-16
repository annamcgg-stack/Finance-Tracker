import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxEngine } from "./types";
import { US_STATES } from "../constants";

/** Stub — US federal tax (simplified placeholder) */
export const unitedStatesTaxEngine: TaxEngine = {
  getStateProvinces: () => US_STATES,

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const taxableIncome = Math.max(0, grossIncome - income.salarySacrifice - 14600);

    let tax = 0;
    if (taxableIncome > 609350) tax += (taxableIncome - 609350) * 0.37;
    if (taxableIncome > 243725) tax += (Math.min(taxableIncome, 609350) - 243725) * 0.35;
    if (taxableIncome > 191950) tax += (Math.min(taxableIncome, 243725) - 191950) * 0.32;
    if (taxableIncome > 100525) tax += (Math.min(taxableIncome, 191950) - 100525) * 0.24;
    if (taxableIncome > 47150) tax += (Math.min(taxableIncome, 100525) - 47150) * 0.22;
    if (taxableIncome > 11600) tax += (Math.min(taxableIncome, 47150) - 11600) * 0.12;
    if (taxableIncome > 0) tax += Math.min(taxableIncome, 11600) * 0.1;

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
