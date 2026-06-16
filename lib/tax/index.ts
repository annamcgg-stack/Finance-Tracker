import type { CountryCode } from "../types";
import { australiaTaxEngine } from "./australia";
import { newZealandTaxEngine } from "./newZealand";
import { singaporeTaxEngine } from "./singapore";
import { canadaTaxEngine } from "./canada";
import { unitedKingdomTaxEngine } from "./unitedKingdom";
import { unitedStatesTaxEngine } from "./unitedStates";
import type { TaxEngine } from "./types";

const engines: Record<CountryCode, TaxEngine> = {
  AU: australiaTaxEngine,
  NZ: newZealandTaxEngine,
  SG: singaporeTaxEngine,
  CA: canadaTaxEngine,
  GB: unitedKingdomTaxEngine,
  US: unitedStatesTaxEngine,
};

export function getTaxEngine(country: CountryCode): TaxEngine {
  return engines[country];
}

export function getDefaultIncomeForCountry(country: CountryCode) {
  const engine = getTaxEngine(country);
  return {
    country,
    taxYear: engine.getDefaultTaxYear(),
    stateProvince: engine.getDefaultRegion?.() ?? engine.getStateProvinces()[0]?.code ?? "",
    ukRegion: "ENG" as const,
    residencyStatus: "resident" as const,
    usFilingStatus: "single" as const,
    includeMedicareLevy: country === "AU",
    includeAccLevy: country === "NZ",
    includeCpp: country === "CA",
    includeEi: country === "CA",
    includeNationalInsurance: country === "GB",
  };
}

export { australiaTaxEngine, estimateStampDuty } from "./australia";
export type { TaxEngine, TaxEngineConfig } from "./types";
