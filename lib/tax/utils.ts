import type { TaxResult } from "../types";
import type { TaxBracket } from "./types";

/** Progressive tax on bracket min/max (min is exclusive lower bound except 0). */
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

/** Marginal rate at the given taxable income level. */
export function calculateMarginalRate(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return brackets[0]?.rate ?? 0;
  for (const bracket of brackets) {
    const upper = bracket.max ?? Infinity;
    if (taxableIncome > bracket.min && taxableIncome <= upper) {
      return bracket.rate;
    }
  }
  return brackets[brackets.length - 1]?.rate ?? 0;
}

export function takeHomeAmounts(netIncome: number) {
  return {
    netIncome,
    monthlyTakeHome: netIncome / 12,
    fortnightlyTakeHome: netIncome / 26,
    weeklyTakeHome: netIncome / 52,
  };
}

export interface BuildTaxResultInput {
  grossIncome: number;
  taxableIncome: number;
  incomeTax: number;
  deductions?: number;
  medicareLevy?: number;
  stateTax?: number;
  preTaxDeductions?: number;
  postTaxDeductions?: number;
  marginalTaxRate: number;
  warnings?: string[];
  estimateOnly?: boolean;
}

export function buildTaxResult(input: BuildTaxResultInput): TaxResult {
  const deductions = input.deductions ?? 0;
  const medicareLevy = input.medicareLevy ?? 0;
  const stateTax = input.stateTax ?? 0;
  const preTax = input.preTaxDeductions ?? 0;
  const postTax = input.postTaxDeductions ?? 0;
  const totalTaxDeductions = input.incomeTax + medicareLevy + deductions + stateTax;
  const netIncome = Math.max(0, input.grossIncome - preTax - totalTaxDeductions - postTax);
  const effectiveTaxRate =
    input.grossIncome > 0 ? (totalTaxDeductions / input.grossIncome) * 100 : 0;

  const warnings = [...(input.warnings ?? [])];
  if (input.estimateOnly !== false) {
    warnings.push(
      "Estimate only — some deductions, credits, local taxes, or benefits may not be included."
    );
  }

  return {
    grossIncome: input.grossIncome,
    taxableIncome: input.taxableIncome,
    incomeTax: input.incomeTax,
    deductions,
    totalTaxDeductions,
    taxPayable: input.incomeTax,
    medicareLevy,
    stateTax,
    ...takeHomeAmounts(netIncome),
    effectiveTaxRate,
    marginalTaxRate: input.marginalTaxRate * 100,
    warnings: Array.from(new Set(warnings)),
    estimateDisclaimer:
      "Estimate only — some deductions, credits, local taxes, or benefits may not be included.",
  };
}

