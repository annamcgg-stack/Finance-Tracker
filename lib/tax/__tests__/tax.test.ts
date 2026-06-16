import { describe, expect, it } from "vitest";
import { australiaTaxEngine } from "@/lib/tax/australia";
import { newZealandTaxEngine } from "@/lib/tax/newZealand";
import { singaporeTaxEngine } from "@/lib/tax/singapore";
import { canadaTaxEngine } from "@/lib/tax/canada";
import { unitedKingdomTaxEngine } from "@/lib/tax/unitedKingdom";
import { unitedStatesTaxEngine } from "@/lib/tax/unitedStates";
import { getTaxEngine, getDefaultIncomeForCountry } from "@/lib/tax";
import { formatCurrency } from "@/lib/format";
import type { IncomeSettings } from "@/lib/types";
import { DEFAULT_FINANCE_DATA } from "@/lib/constants";

function baseIncome(overrides: Partial<IncomeSettings> = {}): IncomeSettings {
  return { ...DEFAULT_FINANCE_DATA.income, ...overrides };
}

describe("Australia tax calculation", () => {
  it("calculates tax for $95,000 with Medicare levy", () => {
    const result = australiaTaxEngine.calculate(
      baseIncome({ salary: 95000, country: "AU", includeMedicareLevy: true })
    );
    expect(result.grossIncome).toBe(95000);
    expect(result.incomeTax).toBeGreaterThan(18000);
    expect(result.medicareLevy).toBeGreaterThan(0);
    expect(result.netIncome).toBeLessThan(95000);
    expect(result.marginalTaxRate).toBeGreaterThan(0);
  });
});

describe("New Zealand tax calculation", () => {
  it("calculates progressive tax and ACC levy", () => {
    const result = newZealandTaxEngine.calculate(
      baseIncome({ salary: 80000, country: "NZ", includeAccLevy: true })
    );
    expect(result.incomeTax).toBeGreaterThan(10000);
    expect(result.deductions).toBeGreaterThan(0);
    expect(result.netIncome).toBeLessThan(80000);
  });
});

describe("Singapore resident tax calculation", () => {
  it("calculates resident progressive tax", () => {
    const result = singaporeTaxEngine.calculate(
      baseIncome({ salary: 120000, country: "SG", residencyStatus: "resident" })
    );
    expect(result.incomeTax).toBeGreaterThan(5000);
    expect(result.netIncome).toBeLessThan(120000);
  });

  it("uses flat rate for non-resident", () => {
    const result = singaporeTaxEngine.calculate(
      baseIncome({ salary: 100000, country: "SG", residencyStatus: "non_resident" })
    );
    expect(result.incomeTax).toBe(24000);
    expect(result.warnings.some((w) => w.includes("Non-resident"))).toBe(true);
  });
});

describe("Canada federal + provincial calculation", () => {
  it("includes federal and Ontario provincial tax", () => {
    const result = canadaTaxEngine.calculate(
      baseIncome({ salary: 90000, country: "CA", stateProvince: "ON", includeCpp: true, includeEi: true })
    );
    expect(result.incomeTax).toBeGreaterThan(15000);
    expect(result.deductions).toBeGreaterThan(0);
    expect(result.netIncome).toBeLessThan(90000);
  });
});

describe("UK England/NI calculation", () => {
  it("applies personal allowance and income tax", () => {
    const result = unitedKingdomTaxEngine.calculate(
      baseIncome({
        salary: 60000,
        country: "GB",
        ukRegion: "ENG",
        includeNationalInsurance: true,
      })
    );
    expect(result.taxableIncome).toBeLessThan(60000);
    expect(result.incomeTax).toBeGreaterThan(5000);
    expect(result.deductions).toBeGreaterThan(0);
  });
});

describe("US federal single filer calculation", () => {
  it("applies standard deduction and federal brackets", () => {
    const result = unitedStatesTaxEngine.calculate(
      baseIncome({ salary: 85000, country: "US", usFilingStatus: "single", stateProvince: "TX" })
    );
    expect(result.incomeTax).toBeGreaterThan(9000);
    expect(result.stateTax).toBe(0);
    expect(result.netIncome).toBeLessThan(85000);
  });

  it("shows warning for unsupported state tax", () => {
    const result = unitedStatesTaxEngine.calculate(
      baseIncome({ salary: 85000, country: "US", stateProvince: "CA" })
    );
    expect(result.warnings.some((w) => w.includes("not yet available"))).toBe(true);
  });
});

describe("Country switching", () => {
  it("returns different engines per country", () => {
    expect(getTaxEngine("AU")).not.toBe(getTaxEngine("NZ"));
    expect(getDefaultIncomeForCountry("SG").residencyStatus).toBe("resident");
    expect(getDefaultIncomeForCountry("US").usFilingStatus).toBe("single");
  });
});

describe("Currency switching", () => {
  it("formats amounts in country currency", () => {
    expect(formatCurrency(1000, "GB")).toContain("£");
    expect(formatCurrency(1000, "US")).toMatch(/\$/);
    expect(formatCurrency(1000, "SG")).toBeTruthy();
  });
});

describe("Take-home frequency calculations", () => {
  it("derives monthly, fortnightly, and weekly amounts", () => {
    const result = australiaTaxEngine.calculate(baseIncome({ salary: 100000, country: "AU" }));
    expect(result.monthlyTakeHome).toBeCloseTo(result.netIncome / 12, 0);
    expect(result.fortnightlyTakeHome).toBeCloseTo(result.netIncome / 26, 0);
    expect(result.weeklyTakeHome).toBeCloseTo(result.netIncome / 52, 0);
  });
});
