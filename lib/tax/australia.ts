import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxBracket, TaxEngine } from "./types";
import { AU_STATES } from "../constants";
import { buildTaxResult, calculateMarginalRate, calculateProgressiveTax } from "./utils";

// Source: Australian Taxation Office (ATO) — individual income tax rates 2025–26
// https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents

const RESIDENT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.3 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: null, rate: 0.45 },
];

const MEDICARE_LEVY_RATE = 0.02;
const MEDICARE_LOW_INCOME_THRESHOLD = 24276;

function calculateMedicareLevy(taxableIncome: number, include: boolean): number {
  if (!include || taxableIncome <= MEDICARE_LOW_INCOME_THRESHOLD) return 0;
  return taxableIncome * MEDICARE_LEVY_RATE;
}

export const australiaTaxEngine: TaxEngine = {
  config: {
    source: "Australian Taxation Office (ATO)",
    taxYears: [{ value: "2025-26", label: "2025–26" }],
    showStateSelector: true,
    showUkRegion: false,
    showResidencySelector: false,
    showFilingStatus: false,
    stateOptional: true,
    stateLabel: "State (optional — stamp duty only)",
  },

  getStateProvinces: () => AU_STATES,
  getDefaultTaxYear: () => "2025-26",
  getDefaultRegion: () => "NSW",

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const preTaxDeductions = income.salarySacrifice;
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions);
    const incomeTax = calculateProgressiveTax(taxableIncome, RESIDENT_BRACKETS);
    const medicareLevy = calculateMedicareLevy(taxableIncome, income.includeMedicareLevy);
    const marginalTaxRate = calculateMarginalRate(taxableIncome, RESIDENT_BRACKETS);

    return buildTaxResult({
      grossIncome,
      taxableIncome,
      incomeTax,
      medicareLevy,
      preTaxDeductions,
      postTaxDeductions: income.superContribution,
      marginalTaxRate,
    });
  },
};

/** Rough stamp duty estimate by state (simplified) */
export function estimateStampDuty(propertyPrice: number, state: string): number {
  const rates: Record<string, number> = {
    NSW: 0.035,
    VIC: 0.055,
    QLD: 0.03,
    WA: 0.04,
    SA: 0.04,
    TAS: 0.035,
    ACT: 0.025,
    NT: 0.065,
  };
  return propertyPrice * (rates[state] ?? 0.04);
}
