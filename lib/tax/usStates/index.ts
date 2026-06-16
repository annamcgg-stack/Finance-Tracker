import { texasStateTax } from "./texas";
import { floridaStateTax } from "./florida";
import { californiaStateTax } from "./california";
import { newYorkStateTax } from "./newYork";

export interface StateTaxResult {
  tax: number;
  warning?: string;
}

export function getStateIncomeTax(
  stateCode: string,
  taxableIncome: number
): StateTaxResult {
  switch (stateCode) {
    case "TX":
      return texasStateTax(taxableIncome);
    case "FL":
      return floridaStateTax(taxableIncome);
    case "CA":
      return californiaStateTax(taxableIncome);
    case "NY":
      return newYorkStateTax(taxableIncome);
    default:
      return {
        tax: 0,
        warning: "State income tax estimate is not yet available for this state.",
      };
  }
}
