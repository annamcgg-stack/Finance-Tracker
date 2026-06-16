"use client";

import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinanceData";
import { getTaxEngine, getDefaultIncomeForCountry } from "@/lib/tax";
import { COUNTRIES, AU_STATES, CA_PROVINCES, UK_REGIONS, US_STATES } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { CountryCode, PayFrequency, ResidencyStatus, UkRegion, UsFilingStatus } from "@/lib/types";
import { SectionHeader, StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Toggle } from "@/components/ui/Field";

const US_FILING_OPTIONS: { value: UsFilingStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married_joint", label: "Married filing jointly" },
  { value: "married_separate", label: "Married filing separately" },
  { value: "head_of_household", label: "Head of household" },
];

export default function IncomePage() {
  const { data, updateData } = useFinance();
  const income = data.income;
  const country = income.country;
  const engine = useMemo(() => getTaxEngine(country), [country]);
  const config = engine.config;

  const taxResult = useMemo(() => engine.calculate(income), [engine, income]);
  const fmt = (v: number) => formatCurrency(v, country);

  const regionOptions = useMemo(() => {
    if (country === "AU") return AU_STATES;
    if (country === "CA") return CA_PROVINCES;
    if (country === "US") return US_STATES;
    if (config.showUkRegion) return UK_REGIONS;
    return engine.getStateProvinces();
  }, [country, config.showUkRegion, engine]);

  const updateIncome = (patch: Partial<typeof income>) => {
    updateData({ income: { ...income, ...patch } });
  };

  const handleCountryChange = (code: CountryCode) => {
    const defaults = getDefaultIncomeForCountry(code);
    updateIncome({
      ...defaults,
      salary: income.salary,
      payFrequency: income.payFrequency,
      salarySacrifice: income.salarySacrifice,
      superContribution: income.superContribution,
    });
  };

  const showRegionSelector =
    config.showStateSelector || (country === "AU" && regionOptions.length > 0);

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Income & Tax Calculator"
        description="Calculate your take-home pay after tax based on your location."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-foreground">Income Details</h2>

          <Field label="Salary Amount">
            <Input
              type="number"
              value={income.salary || ""}
              onChange={(e) => updateIncome({ salary: Number(e.target.value) })}
            />
          </Field>

          <Field label="Pay Frequency">
            <Select
              value={income.payFrequency}
              onChange={(e) => updateIncome({ payFrequency: e.target.value as PayFrequency })}
            >
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="weekly">Weekly</option>
            </Select>
          </Field>

          <Field label="Country">
            <Select
              value={country}
              onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.currency})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tax Year">
            <Select
              value={income.taxYear}
              onChange={(e) => updateIncome({ taxYear: e.target.value })}
            >
              {config.taxYears.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>

          {config.showUkRegion && (
            <Field label="Region">
              <Select
                value={income.ukRegion}
                onChange={(e) => updateIncome({ ukRegion: e.target.value as UkRegion })}
              >
                {UK_REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {showRegionSelector && !config.showUkRegion && (
            <Field
              label={config.stateLabel ?? "State / Province"}
              hint={config.stateOptional ? "Optional for income tax" : undefined}
            >
              <Select
                value={income.stateProvince}
                onChange={(e) => updateIncome({ stateProvince: e.target.value })}
              >
                {regionOptions.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {config.showResidencySelector && (
            <Field label="Residency">
              <Select
                value={income.residencyStatus}
                onChange={(e) =>
                  updateIncome({ residencyStatus: e.target.value as ResidencyStatus })
                }
              >
                <option value="resident">Resident</option>
                <option value="non_resident">Non-resident</option>
              </Select>
            </Field>
          )}

          {config.showFilingStatus && (
            <Field label="Filing Status">
              <Select
                value={income.usFilingStatus}
                onChange={(e) =>
                  updateIncome({ usFilingStatus: e.target.value as UsFilingStatus })
                }
              >
                {US_FILING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {country === "AU" && (
            <>
              <Toggle
                label="Include Medicare Levy"
                checked={income.includeMedicareLevy}
                onChange={(v) => updateIncome({ includeMedicareLevy: v })}
              />
              <Field label="Salary Sacrifice (annual)" hint="Pre-tax deductions">
                <Input
                  type="number"
                  value={income.salarySacrifice || ""}
                  onChange={(e) => updateIncome({ salarySacrifice: Number(e.target.value) })}
                />
              </Field>
              <Field label="Super Contribution (annual)" hint="Additional post-tax contributions">
                <Input
                  type="number"
                  value={income.superContribution || ""}
                  onChange={(e) => updateIncome({ superContribution: Number(e.target.value) })}
                />
              </Field>
            </>
          )}

          {country === "NZ" && (
            <Toggle
              label="Include ACC earners' levy"
              checked={income.includeAccLevy}
              onChange={(v) => updateIncome({ includeAccLevy: v })}
            />
          )}

          {country === "CA" && (
            <>
              <Toggle
                label="Include CPP contributions"
                checked={income.includeCpp}
                onChange={(v) => updateIncome({ includeCpp: v })}
              />
              <Toggle
                label="Include EI premiums"
                checked={income.includeEi}
                onChange={(v) => updateIncome({ includeEi: v })}
              />
            </>
          )}

          {country === "GB" && (
            <Toggle
              label="Include National Insurance estimate"
              checked={income.includeNationalInsurance}
              onChange={(v) => updateIncome({ includeNationalInsurance: v })}
            />
          )}

          {country !== "AU" && (
            <Field label="Pre-tax deductions (annual)" hint="Salary sacrifice, pension, etc.">
              <Input
                type="number"
                value={income.salarySacrifice || ""}
                onChange={(e) => updateIncome({ salarySacrifice: Number(e.target.value) })}
              />
            </Field>
          )}
        </Card>

        <div className="space-y-4">
          <p className="text-xs text-muted">Source: {config.source}</p>

          {taxResult.warnings.length > 0 && (
            <div className="space-y-2">
              {taxResult.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300"
                >
                  {warning}
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Gross Annual Income" value={fmt(taxResult.grossIncome)} />
            <StatCard label="Estimated Income Tax" value={fmt(taxResult.incomeTax)} />
            <StatCard
              label="Estimated Deductions / Contributions"
              value={fmt(taxResult.deductions + taxResult.medicareLevy)}
            />
            {taxResult.stateTax > 0 && (
              <StatCard label="State / Provincial Tax" value={fmt(taxResult.stateTax)} />
            )}
            <StatCard label="Total Tax & Deductions" value={fmt(taxResult.totalTaxDeductions)} />
            <StatCard label="Annual Take-Home" value={fmt(taxResult.netIncome)} trend="up" />
            <StatCard label="Effective Tax Rate" value={formatPercent(taxResult.effectiveTaxRate)} />
            <StatCard label="Marginal Tax Rate" value={formatPercent(taxResult.marginalTaxRate)} />
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Take-Home Pay</h2>
            <div className="space-y-3">
              {[
                { label: "Monthly", value: taxResult.monthlyTakeHome },
                { label: "Fortnightly", value: taxResult.fortnightlyTakeHome },
                { label: "Weekly", value: taxResult.weeklyTakeHome },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl bg-surface-elevated px-4 py-3"
                >
                  <span className="text-sm text-muted">{item.label}</span>
                  <span className="text-lg font-semibold text-foreground">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>

          <p className="text-xs text-muted">{taxResult.estimateDisclaimer}</p>
        </div>
      </div>
    </div>
  );
}
