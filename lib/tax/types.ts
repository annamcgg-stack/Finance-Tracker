import type { IncomeSettings, TaxResult } from "../types";

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface RegionOption {
  code: string;
  label: string;
}

export interface TaxYearOption {
  value: string;
  label: string;
}

export interface TaxEngineConfig {
  source: string;
  taxYears: TaxYearOption[];
  showStateSelector: boolean;
  showUkRegion: boolean;
  showResidencySelector: boolean;
  showFilingStatus: boolean;
  stateOptional?: boolean;
  stateLabel?: string;
}

export interface TaxEngine {
  config: TaxEngineConfig;
  calculate(income: IncomeSettings): TaxResult;
  getStateProvinces(): RegionOption[];
  getDefaultTaxYear(): string;
  getDefaultRegion?(): string;
}

export const ESTIMATE_DISCLAIMER =
  "Estimate only — some deductions, credits, local taxes, or benefits may not be included.";
