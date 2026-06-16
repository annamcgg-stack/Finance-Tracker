"use client";

import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  calculateInvestmentProjection,
  getScenarioReturns,
} from "@/lib/calculations/investment-projection";
import { formatCurrency } from "@/lib/format";
import { SectionHeader, StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { MultiLineChart } from "@/components/charts/FinanceCharts";

export default function InvestmentsPage() {
  const { data, updateData } = useFinance();
  const settings = data.investmentProjection;
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const returns = getScenarioReturns(settings.annualReturn);

  const scenarios = useMemo(() => {
    const conservative = calculateInvestmentProjection({
      ...settings,
      annualReturn: returns.conservative,
    });
    const base = calculateInvestmentProjection(settings);
    const optimistic = calculateInvestmentProjection({
      ...settings,
      annualReturn: returns.optimistic,
    });
    return { conservative, base, optimistic };
  }, [settings, returns]);

  const chartData = useMemo(
    () =>
      scenarios.base.points.map((p, i) => ({
        label: `Year ${p.year}`,
        conservative: scenarios.conservative.points[i]?.value ?? 0,
        base: p.value,
        optimistic: scenarios.optimistic.points[i]?.value ?? 0,
      })),
    [scenarios]
  );

  const updateSettings = (patch: Partial<typeof settings>) => {
    updateData({ investmentProjection: { ...settings, ...patch } });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Investment Projection"
        description="Model portfolio growth under different return scenarios."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="space-y-4 p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-foreground">Assumptions</h2>
          <Field label="Current Portfolio Value">
            <Input
              type="number"
              value={settings.currentValue || ""}
              onChange={(e) => updateSettings({ currentValue: Number(e.target.value) })}
            />
          </Field>
          <Field label="Monthly Contribution">
            <Input
              type="number"
              value={settings.monthlyContribution || ""}
              onChange={(e) => updateSettings({ monthlyContribution: Number(e.target.value) })}
            />
          </Field>
          <Field label="Annual Return (base) %">
            <Input
              type="number"
              step={0.1}
              value={settings.annualReturn || ""}
              onChange={(e) => updateSettings({ annualReturn: Number(e.target.value) })}
            />
          </Field>
          <Field label="Time Horizon (years)">
            <Input
              type="number"
              min={1}
              max={50}
              value={settings.timeHorizonYears || ""}
              onChange={(e) => updateSettings({ timeHorizonYears: Number(e.target.value) })}
            />
          </Field>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Conservative", data: scenarios.conservative, rate: returns.conservative },
              { label: "Base", data: scenarios.base, rate: returns.base },
              { label: "Optimistic", data: scenarios.optimistic, rate: returns.optimistic },
            ].map((s) => (
              <Card key={s.label} className="p-4">
                <p className="text-xs font-medium uppercase text-muted">{s.label}</p>
                <p className="text-xs text-muted">{s.rate}% return</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {fmt(s.data.futureValue)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Growth: {fmt(s.data.totalGrowth)}
                </p>
              </Card>
            ))}
          </div>

          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Projection Chart</h2>
            <MultiLineChart
              data={chartData}
              lines={[
                { key: "conservative", color: "#F59E0B", name: "Conservative" },
                { key: "base", color: "#3B82F6", name: "Base" },
                { key: "optimistic", color: "#10B981", name: "Optimistic" },
              ]}
              formatter={fmt}
            />
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Future Value (Base)"
              value={fmt(scenarios.base.futureValue)}
            />
            <StatCard
              label="Total Contributions"
              value={fmt(scenarios.base.totalContributions)}
            />
            <StatCard
              label="Investment Growth"
              value={fmt(scenarios.base.totalGrowth)}
              trend="up"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
