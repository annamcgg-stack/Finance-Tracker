import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxBracket, TaxEngine } from "./types";
import { buildTaxResult, calculateMarginalRate, calculateProgressiveTax } from "./utils";

// Source: IRAS — tax rates for resident individuals YA 2025
// https://www.iras.gov.sg/taxes/individual-income-tax/basics-of-individual-income-tax/tax-residency-and-tax-rates/tax-rates

const RESIDENT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 20000, rate: 0 },
  { min: 20001, max: 30000, rate: 0.02 },
  { min: 30001, max: 40000, rate: 0.035 },
  { min: 40001, max: 80000, rate: 0.07 },
  { min: 80001, max: 120000, rate: 0.115 },
  { min: 120001, max: 160000, rate: 0.15 },
  { min: 160001, max: 200000, rate: 0.18 },
  { min: 200001, max: 240000, rate: 0.19 },
  { min: 240001, max: 320000, rate: 0.195 },
  { min: 320001, max: 500000, rate: 0.2 },
  { min: 500001, max: 1000000, rate: 0.22 },
  { min: 1000001, max: null, rate: 0.23 },
];

const NON_RESIDENT_RATE = 0.24;

export const singaporeTaxEngine: TaxEngine = {
  config: {
    source: "Inland Revenue Authority of Singapore (IRAS)",
    taxYears: [{ value: "2025", label: "Year of Assessment 2025/2026" }],
    showStateSelector: false,
    showUkRegion: false,
    showResidencySelector: true,
    showFilingStatus: false,
  },

  getStateProvinces: () => [],
  getDefaultTaxYear: () => "2025",

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const preTaxDeductions = income.salarySacrifice;
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions);
    const warnings: string[] = [];

    if (income.residencyStatus === "non_resident") {
      warnings.push(
        "Non-resident estimate uses a flat 24% on chargeable income. Actual tax depends on employment type, duration of stay, and tax treaties."
      );
      const incomeTax = taxableIncome * NON_RESIDENT_RATE;
      return buildTaxResult({
        grossIncome,
        taxableIncome,
        incomeTax,
        preTaxDeductions,
        postTaxDeductions: income.superContribution,
        marginalTaxRate: NON_RESIDENT_RATE,
        warnings,
      });
    }

    const incomeTax = calculateProgressiveTax(taxableIncome, RESIDENT_BRACKETS);
    const marginalTaxRate = calculateMarginalRate(taxableIncome, RESIDENT_BRACKETS);

    return buildTaxResult({
      grossIncome,
      taxableIncome,
      incomeTax,
      preTaxDeductions,
      postTaxDeductions: income.superContribution,
      marginalTaxRate,
      warnings,
    });
  },
};
