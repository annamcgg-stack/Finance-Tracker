import type { IncomeSettings, TaxResult } from "../types";

export interface TaxEngine {
  calculate(income: IncomeSettings): TaxResult;
  getStateProvinces(): { code: string; label: string }[];
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}
