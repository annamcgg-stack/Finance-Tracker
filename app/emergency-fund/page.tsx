"use client";

import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinanceData";
import { getExpenseMonthlyTotal } from "@/lib/calculations/expenses";
import { calculateEmergencyFund } from "@/lib/calculations/emergency-fund";
import { formatCurrency } from "@/lib/format";
import { SectionHeader, StatCard, ProgressBar } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";

export default function EmergencyFundPage() {
  const { data, updateData } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const monthlyExpenses = useMemo(
    () => getExpenseMonthlyTotal(data.expenses),
    [data.expenses]
  );

  const result = useMemo(
    () => calculateEmergencyFund(monthlyExpenses, data.emergencyFundBalance),
    [monthlyExpenses, data.emergencyFundBalance]
  );

  const targets = [
    { label: "3 Months", value: result.threeMonths, months: 3 },
    { label: "6 Months", value: result.sixMonths, months: 6 },
    { label: "12 Months", value: result.twelveMonths, months: 12 },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Emergency Fund Calculator"
        description="Ensure you have enough saved for unexpected expenses."
      />

      <Field label="Current Emergency Fund Balance" className="max-w-sm">
        <Input
          type="number"
          value={data.emergencyFundBalance || ""}
          onChange={(e) => updateData({ emergencyFundBalance: Number(e.target.value) })}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current Coverage"
          value={`${result.coverageMonths.toFixed(1)} months`}
        />
        <StatCard label="Recommended Target" value={fmt(result.recommended)} subtext="6 months" />
        <StatCard label="Monthly Expenses" value={fmt(monthlyExpenses)} />
        <StatCard label="Progress" value={`${result.progress.toFixed(0)}%`} />
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">Progress toward 6-month target</p>
            <p className="text-2xl font-semibold text-foreground">
              {fmt(data.emergencyFundBalance)} / {fmt(result.recommended)}
            </p>
          </div>
          <p className="text-sm text-muted">{result.progress.toFixed(0)}%</p>
        </div>
        <ProgressBar value={result.progress} color="bg-emerald-500" />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {targets.map((target) => {
          const progress =
            target.value > 0
              ? Math.min(100, (data.emergencyFundBalance / target.value) * 100)
              : 0;
          const covered = result.coverageMonths >= target.months;
          return (
            <Card key={target.label} className="p-5">
              <h3 className="font-semibold text-foreground">{target.label}</h3>
              <p className="mt-1 text-2xl font-semibold text-foreground">{fmt(target.value)}</p>
              <p className="mt-1 text-sm text-muted">
                {covered ? "Fully covered" : `${progress.toFixed(0)}% funded`}
              </p>
              <ProgressBar value={progress} className="mt-3" color="bg-primary" />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
