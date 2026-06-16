import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxBracket, TaxEngine } from "./types";
import { AU_STATES } from "../constants";

/** 2024-25 Australian resident tax brackets (Stage 3) */
const RESIDENT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 18200, rate: 0 },
  { min: 18201, max: 45000, rate: 0.16 },
  { min: 45001, max: 135000, rate: 0.3 },
  { min: 135001, max: 190000, rate: 0.37 },
  { min: 190001, max: null, rate: 0.45 },
];

const MEDICARE_LEVY_RATE = 0.02;
const MEDICARE_LOW_INCOME_THRESHOLD = 24276;

function calculateProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) continue;
    const upper = bracket.max ?? Infinity;
    const taxableInBracket = Math.min(taxableIncome, upper) - bracket.min;
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
    }
  }
  return Math.max(0, tax);
}

function calculateMedicareLevy(taxableIncome: number, include: boolean): number {
  if (!include || taxableIncome <= MEDICARE_LOW_INCOME_THRESHOLD) return 0;
  return taxableIncome * MEDICARE_LEVY_RATE;
}

export const australiaTaxEngine: TaxEngine = {
  getStateProvinces: () => AU_STATES,

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const taxableIncome = Math.max(0, grossIncome - income.salarySacrifice);

    const incomeTax = calculateProgressiveTax(taxableIncome, RESIDENT_BRACKETS);
    const medicareLevy = calculateMedicareLevy(taxableIncome, income.includeMedicareLevy);
    const taxPayable = incomeTax + medicareLevy;
    const netIncome = grossIncome - taxPayable - income.superContribution;

    return {
      grossIncome,
      taxableIncome,
      taxPayable: incomeTax,
      medicareLevy,
      netIncome,
      monthlyTakeHome: netIncome / 12,
      fortnightlyTakeHome: netIncome / 26,
      weeklyTakeHome: netIncome / 52,
      effectiveTaxRate: grossIncome > 0 ? (taxPayable / grossIncome) * 100 : 0,
    };
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
