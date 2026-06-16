import type { CountryCode } from "../types";
import { australiaTaxEngine } from "./australia";
import { newZealandTaxEngine } from "./newZealand";
import { unitedKingdomTaxEngine } from "./unitedKingdom";
import { unitedStatesTaxEngine } from "./unitedStates";
import type { TaxEngine } from "./types";

const engines: Record<CountryCode, TaxEngine> = {
  AU: australiaTaxEngine,
  NZ: newZealandTaxEngine,
  GB: unitedKingdomTaxEngine,
  US: unitedStatesTaxEngine,
};

export function getTaxEngine(country: CountryCode): TaxEngine {
  return engines[country];
}

export { australiaTaxEngine, estimateStampDuty } from "./australia";
