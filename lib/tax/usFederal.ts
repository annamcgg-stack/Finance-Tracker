import type { UsFilingStatus } from "../types";
import type { TaxBracket } from "./types";

// Source: Internal Revenue Service (IRS) — federal income tax rates 2025
// https://www.irs.gov/filing/federal-income-tax-rates-and-brackets

const STANDARD_DEDUCTIONS: Record<UsFilingStatus, number> = {
  single: 14600,
  married_joint: 29200,
  married_separate: 14600,
  head_of_household: 21900,
};

const SINGLE_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.1 },
  { min: 11601, max: 47150, rate: 0.12 },
  { min: 47151, max: 100525, rate: 0.22 },
  { min: 100526, max: 191950, rate: 0.24 },
  { min: 191951, max: 243725, rate: 0.32 },
  { min: 243726, max: 609350, rate: 0.35 },
  { min: 609351, max: null, rate: 0.37 },
];

const MARRIED_JOINT_BRACKETS: TaxBracket[] = [
  { min: 0, max: 23200, rate: 0.1 },
  { min: 23201, max: 94300, rate: 0.12 },
  { min: 94301, max: 201050, rate: 0.22 },
  { min: 201051, max: 383900, rate: 0.24 },
  { min: 383901, max: 487450, rate: 0.32 },
  { min: 487451, max: 731200, rate: 0.35 },
  { min: 731201, max: null, rate: 0.37 },
];

const MARRIED_SEPARATE_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.1 },
  { min: 11601, max: 47150, rate: 0.12 },
  { min: 47151, max: 100525, rate: 0.22 },
  { min: 100526, max: 191950, rate: 0.24 },
  { min: 191951, max: 243725, rate: 0.32 },
  { min: 243726, max: 365600, rate: 0.35 },
  { min: 365601, max: null, rate: 0.37 },
];

const HOH_BRACKETS: TaxBracket[] = [
  { min: 0, max: 16550, rate: 0.1 },
  { min: 16551, max: 63100, rate: 0.12 },
  { min: 63101, max: 100525, rate: 0.22 },
  { min: 100526, max: 191950, rate: 0.24 },
  { min: 191951, max: 243700, rate: 0.32 },
  { min: 243701, max: 609350, rate: 0.35 },
  { min: 609351, max: null, rate: 0.37 },
];

export function getFederalBrackets(status: UsFilingStatus): TaxBracket[] {
  switch (status) {
    case "married_joint":
      return MARRIED_JOINT_BRACKETS;
    case "married_separate":
      return MARRIED_SEPARATE_BRACKETS;
    case "head_of_household":
      return HOH_BRACKETS;
    default:
      return SINGLE_BRACKETS;
  }
}

export function getStandardDeduction(status: UsFilingStatus): number {
  return STANDARD_DEDUCTIONS[status];
}

export function calculateProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) continue;
    const upper = bracket.max ?? Infinity;
    const taxableInBracket = Math.min(taxableIncome, upper) - bracket.min;
    if (taxableInBracket > 0) tax += taxableInBracket * bracket.rate;
  }
  return Math.max(0, tax);
}

export function calculateMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return brackets[0]?.rate ?? 0;
  for (const bracket of brackets) {
    const upper = bracket.max ?? Infinity;
    if (taxableIncome > bracket.min && taxableIncome <= upper) return bracket.rate;
  }
  return brackets[brackets.length - 1]?.rate ?? 0;
}
