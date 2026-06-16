import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxEngine } from "./types";
import { US_STATES } from "../constants";
import { buildTaxResult } from "./utils";
import {
  calculateMarginalRate,
  calculateProgressiveTax,
  getFederalBrackets,
  getStandardDeduction,
} from "./usFederal";
import { getStateIncomeTax } from "./usStates";

export const unitedStatesTaxEngine: TaxEngine = {
  config: {
    source: "Internal Revenue Service (IRS)",
    taxYears: [{ value: "2025", label: "2025" }],
    showStateSelector: true,
    showUkRegion: false,
    showResidencySelector: false,
    showFilingStatus: true,
    stateLabel: "State",
  },

  getStateProvinces: () => US_STATES,
  getDefaultTaxYear: () => "2025",
  getDefaultRegion: () => "TX",

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const preTaxDeductions = income.salarySacrifice;
    const brackets = getFederalBrackets(income.usFilingStatus);
    const standardDeduction = getStandardDeduction(income.usFilingStatus);
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions - standardDeduction);
    const federalTax = calculateProgressiveTax(taxableIncome, brackets);
    const stateResult = getStateIncomeTax(income.stateProvince, taxableIncome);
    const marginalTaxRate = calculateMarginalRate(taxableIncome, brackets);
    const warnings = stateResult.warning ? [stateResult.warning] : [];

    return buildTaxResult({
      grossIncome,
      taxableIncome,
      incomeTax: federalTax,
      stateTax: stateResult.tax,
      preTaxDeductions,
      postTaxDeductions: income.superContribution,
      marginalTaxRate,
      warnings,
    });
  },
};
