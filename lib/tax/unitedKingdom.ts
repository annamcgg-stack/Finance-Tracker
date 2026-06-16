import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxBracket, TaxEngine } from "./types";
import { UK_REGIONS } from "../constants";
import { buildTaxResult, calculateMarginalRate, calculateProgressiveTax } from "./utils";

// Source: HM Revenue & Customs (HMRC) — income tax rates 2025–26
// https://www.gov.uk/income-tax-rates

const PERSONAL_ALLOWANCE = 12570;
const ALLOWANCE_TAPER_START = 100000;

const ENG_WLS_BRACKETS: TaxBracket[] = [
  { min: 0, max: 37700, rate: 0.2 },
  { min: 37701, max: 125140, rate: 0.4 },
  { min: 125141, max: null, rate: 0.45 },
];

const SCOTLAND_BRACKETS: TaxBracket[] = [
  { min: 0, max: 2306, rate: 0.19 },
  { min: 2307, max: 13991, rate: 0.2 },
  { min: 13992, max: 31092, rate: 0.21 },
  { min: 31093, max: 62430, rate: 0.42 },
  { min: 62431, max: 125140, rate: 0.45 },
  { min: 125141, max: null, rate: 0.48 },
];

function getPersonalAllowance(grossIncome: number): number {
  if (grossIncome <= ALLOWANCE_TAPER_START) return PERSONAL_ALLOWANCE;
  const reduction = Math.floor((grossIncome - ALLOWANCE_TAPER_START) / 2);
  return Math.max(0, PERSONAL_ALLOWANCE - reduction);
}

function calculateNi(grossIncome: number, include: boolean): number {
  if (!include) return 0;
  const primaryThreshold = 12570;
  const upperLimit = 50270;
  if (grossIncome <= primaryThreshold) return 0;
  const band1 = Math.min(grossIncome, upperLimit) - primaryThreshold;
  const band2 = Math.max(0, grossIncome - upperLimit);
  return band1 * 0.08 + band2 * 0.02;
}

export const unitedKingdomTaxEngine: TaxEngine = {
  config: {
    source: "HM Revenue & Customs (HMRC)",
    taxYears: [{ value: "2025-26", label: "2025–26" }],
    showStateSelector: false,
    showUkRegion: true,
    showResidencySelector: false,
    showFilingStatus: false,
  },

  getStateProvinces: () => UK_REGIONS,
  getDefaultTaxYear: () => "2025-26",
  getDefaultRegion: () => "ENG",

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const preTaxDeductions = income.salarySacrifice;
    const allowance = getPersonalAllowance(grossIncome);
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions - allowance);
    const brackets =
      income.ukRegion === "SCT" ? SCOTLAND_BRACKETS : ENG_WLS_BRACKETS;
    const incomeTax = calculateProgressiveTax(taxableIncome, brackets);
    const ni = calculateNi(grossIncome, income.includeNationalInsurance);
    const marginalTaxRate = calculateMarginalRate(taxableIncome, brackets);

    return buildTaxResult({
      grossIncome,
      taxableIncome,
      incomeTax,
      deductions: ni,
      preTaxDeductions,
      postTaxDeductions: income.superContribution,
      marginalTaxRate,
    });
  },
};
