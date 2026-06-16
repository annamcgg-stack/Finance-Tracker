"use client";

import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinanceData";
import { getTaxEngine } from "@/lib/tax";
import { COUNTRIES, AU_STATES, US_STATES } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { CountryCode, PayFrequency } from "@/lib/types";
import { SectionHeader, StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Toggle } from "@/components/ui/Field";

export default function IncomePage() {
  const { data, updateData } = useFinance();
  const income = data.income;
  const country = income.country;

  const taxResult = useMemo(() => getTaxEngine(country).calculate(income), [country, income]);
  const fmt = (v: number) => formatCurrency(v, country);

  const states = useMemo(() => {
    if (country === "AU") return AU_STATES;
    if (country === "US") return US_STATES;
    return getTaxEngine(country).getStateProvinces();
  }, [country]);

  const updateIncome = (patch: Partial<typeof income>) => {
    updateData({ income: { ...income, ...patch } });
  };

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
              onChange={(e) => {
                const code = e.target.value as CountryCode;
                const engine = getTaxEngine(code);
                const provinces = engine.getStateProvinces();
                updateIncome({
                  country: code,
                  stateProvince: provinces[0]?.code ?? "",
                });
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          {states.length > 0 && (
            <Field label="State / Province">
              <Select
                value={income.stateProvince}
                onChange={(e) => updateIncome({ stateProvince: e.target.value })}
              >
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
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
        </Card>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Gross Income" value={fmt(taxResult.grossIncome)} />
            <StatCard label="Tax Payable" value={fmt(taxResult.taxPayable)} />
            {country === "AU" && taxResult.medicareLevy > 0 && (
              <StatCard label="Medicare Levy" value={fmt(taxResult.medicareLevy)} />
            )}
            <StatCard label="Net Income" value={fmt(taxResult.netIncome)} trend="up" />
            <StatCard
              label="Effective Tax Rate"
              value={formatPercent(taxResult.effectiveTaxRate)}
            />
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
        </div>
      </div>
    </div>
  );
}
