import type { IncomeSettings, TaxResult } from "../types";
import { toAnnual } from "../format";
import type { TaxBracket, TaxEngine } from "./types";
import { CA_PROVINCES } from "../constants";
import { buildTaxResult, calculateMarginalRate, calculateProgressiveTax } from "./utils";

// Source: Canada Revenue Agency (CRA) — federal tax rates 2025
// https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html

const FEDERAL_BRACKETS: TaxBracket[] = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55868, max: 111733, rate: 0.205 },
  { min: 111734, max: 173205, rate: 0.26 },
  { min: 173206, max: 246752, rate: 0.29 },
  { min: 246753, max: null, rate: 0.33 },
];

// Simplified provincial/territorial brackets (2025 estimates)
const PROVINCIAL_BRACKETS: Record<string, TaxBracket[]> = {
  ON: [
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51447, max: 102894, rate: 0.0915 },
    { min: 102895, max: 150000, rate: 0.1116 },
    { min: 150001, max: 220000, rate: 0.1216 },
    { min: 220001, max: null, rate: 0.1316 },
  ],
  BC: [
    { min: 0, max: 47937, rate: 0.0506 },
    { min: 47938, max: 95875, rate: 0.077 },
    { min: 95876, max: 110076, rate: 0.105 },
    { min: 110077, max: 133664, rate: 0.1229 },
    { min: 133665, max: 181232, rate: 0.147 },
    { min: 181233, max: 252752, rate: 0.168 },
    { min: 252753, max: null, rate: 0.205 },
  ],
  AB: [
    { min: 0, max: 148269, rate: 0.08 },
    { min: 148270, max: 177922, rate: 0.1 },
    { min: 177923, max: 237230, rate: 0.12 },
    { min: 237231, max: 355845, rate: 0.13 },
    { min: 355846, max: null, rate: 0.15 },
  ],
  QC: [
    { min: 0, max: 51780, rate: 0.14 },
    { min: 51781, max: 103545, rate: 0.19 },
    { min: 103546, max: 126000, rate: 0.24 },
    { min: 126001, max: null, rate: 0.2575 },
  ],
  NS: [
    { min: 0, max: 29590, rate: 0.0879 },
    { min: 29591, max: 59180, rate: 0.1495 },
    { min: 59181, max: 93000, rate: 0.1667 },
    { min: 93001, max: 150000, rate: 0.175 },
    { min: 150001, max: null, rate: 0.21 },
  ],
  SK: [
    { min: 0, max: 52057, rate: 0.105 },
    { min: 52058, max: 148734, rate: 0.125 },
    { min: 148735, max: null, rate: 0.145 },
  ],
  MB: [
    { min: 0, max: 47000, rate: 0.108 },
    { min: 47001, max: 100000, rate: 0.1275 },
    { min: 100001, max: null, rate: 0.174 },
  ],
  NB: [
    { min: 0, max: 49958, rate: 0.094 },
    { min: 49959, max: 99916, rate: 0.14 },
    { min: 99917, max: 185064, rate: 0.16 },
    { min: 185065, max: null, rate: 0.195 },
  ],
  NL: [
    { min: 0, max: 43198, rate: 0.087 },
    { min: 43199, max: 86395, rate: 0.145 },
    { min: 86396, max: 154244, rate: 0.158 },
    { min: 154245, max: 215943, rate: 0.178 },
    { min: 215944, max: 275870, rate: 0.198 },
    { min: 275871, max: 551739, rate: 0.208 },
    { min: 551740, max: 1103478, rate: 0.213 },
    { min: 1103479, max: null, rate: 0.218 },
  ],
  PE: [
    { min: 0, max: 32656, rate: 0.095 },
    { min: 32657, max: 64313, rate: 0.1347 },
    { min: 64314, max: 105000, rate: 0.166 },
    { min: 105001, max: 140000, rate: 0.1762 },
    { min: 140001, max: null, rate: 0.19 },
  ],
  NT: [{ min: 0, max: 50597, rate: 0.059 }, { min: 50598, max: 101198, rate: 0.086 }, { min: 101199, max: 164525, rate: 0.122 }, { min: 164526, max: null, rate: 0.1405 }],
  YT: [
    { min: 0, max: 55867, rate: 0.064 },
    { min: 55868, max: 111733, rate: 0.09 },
    { min: 111734, max: 173205, rate: 0.109 },
    { min: 173206, max: 500000, rate: 0.128 },
    { min: 500001, max: null, rate: 0.15 },
  ],
  NU: [
    { min: 0, max: 53268, rate: 0.04 },
    { min: 53269, max: 106537, rate: 0.07 },
    { min: 106538, max: 173205, rate: 0.09 },
    { min: 173206, max: null, rate: 0.115 },
  ],
};

const DEFAULT_PROVINCIAL = PROVINCIAL_BRACKETS.ON;

const CPP_RATE = 0.0595;
const CPP_BASIC_EXEMPTION = 3500;
const CPP_MAX_EARNINGS = 68500;
const EI_RATE = 0.0164;
const EI_MAX_EARNINGS = 63200;

function calculateCpp(grossIncome: number, include: boolean): number {
  if (!include) return 0;
  const pensionable = Math.max(0, Math.min(grossIncome, CPP_MAX_EARNINGS) - CPP_BASIC_EXEMPTION);
  return pensionable * CPP_RATE;
}

function calculateEi(grossIncome: number, include: boolean): number {
  if (!include) return 0;
  return Math.min(grossIncome, EI_MAX_EARNINGS) * EI_RATE;
}

export const canadaTaxEngine: TaxEngine = {
  config: {
    source: "Canada Revenue Agency (CRA)",
    taxYears: [{ value: "2025", label: "2025" }],
    showStateSelector: true,
    showUkRegion: false,
    showResidencySelector: false,
    showFilingStatus: false,
    stateLabel: "Province / Territory",
  },

  getStateProvinces: () => CA_PROVINCES,
  getDefaultTaxYear: () => "2025",
  getDefaultRegion: () => "ON",

  calculate(income: IncomeSettings): TaxResult {
    const grossIncome = toAnnual(income.salary, income.payFrequency);
    const preTaxDeductions = income.salarySacrifice;
    const taxableIncome = Math.max(0, grossIncome - preTaxDeductions);
    const federalTax = calculateProgressiveTax(taxableIncome, FEDERAL_BRACKETS);
    const provincialBrackets = PROVINCIAL_BRACKETS[income.stateProvince] ?? DEFAULT_PROVINCIAL;
    const provincialTax = calculateProgressiveTax(taxableIncome, provincialBrackets);
    const incomeTax = federalTax + provincialTax;
    const cpp = calculateCpp(grossIncome, income.includeCpp);
    const ei = calculateEi(grossIncome, income.includeEi);
    const marginalTaxRate =
      calculateMarginalRate(taxableIncome, FEDERAL_BRACKETS) +
      calculateMarginalRate(taxableIncome, provincialBrackets);

    return buildTaxResult({
      grossIncome,
      taxableIncome,
      incomeTax,
      deductions: cpp + ei,
      preTaxDeductions,
      postTaxDeductions: income.superContribution,
      marginalTaxRate: Math.min(marginalTaxRate, 0.6),
    });
  },
};
