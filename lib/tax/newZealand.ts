import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxBracket, TaxEngine } from "./types";
import { buildTaxResult, calculateMarginalRate, calculateProgressiveTax } from "./utils";

// Source: Inland Revenue — individual tax rates 2025–26
// https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals

const NZ_BRACKETS: TaxBracket[] = [
  { min: 0, max: 15600, rate: 0.105 },
  { min: 15601, max: 53500, rate: 0.175 },
  { min: 53501, max: 78100, rate: 0.3 },
  { min: 78101, max: 180000, rate: 0.33 },
  { min: 180001, max: null, rate: 0.39 },
];

const ACC_EARNERS_RATE = 0.0167;
const ACC_INCOME_CAP = 142283;

function calculateAccLevy(grossIncome: number, include: boolean): number {
  if (!include) return 0;
  return Math.min(grossIncome, ACC_INCOME_CAP) * ACC_EARNERS_RATE;
}

export const newZealandTaxEngine: TaxEngine = {
  config: {
    source: "Inland Revenue",
    taxYears: [{ value: "2025-26", label: "2025–26" }],
    showStateSelector: false,
    showUkRegion: false,
    showResidencySelector: false,
    showFilingStatus: false,
  },

  getStateProvinces: () => [],
  getDefaultTaxYear: () => "2025-26",

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const preTaxDeductions = income.salarySacrifice;
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions);
    const incomeTax = calculateProgressiveTax(taxableIncome, NZ_BRACKETS);
    const accLevy = calculateAccLevy(grossIncome, income.includeAccLevy);
    const marginalTaxRate = calculateMarginalRate(taxableIncome, NZ_BRACKETS);

    return buildTaxResult({
      grossIncome,
      taxableIncome,
      incomeTax,
      deductions: accLevy,
      preTaxDeductions,
      postTaxDeductions: income.superContribution,
      marginalTaxRate,
    });
  },
};
