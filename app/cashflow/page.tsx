"use client";

import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinanceData";
import { calculateCashflow } from "@/lib/calculations/cashflow";
import { formatCurrency, formatPercent } from "@/lib/format";
import { SectionHeader, StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";

export default function CashflowPage() {
  const { data } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const cashflow = useMemo(() => calculateCashflow(data), [data]);

  const items = [
    { label: "Net Income (monthly)", value: cashflow.monthlyNetIncome, positive: true },
    { label: "Fixed Expenses", value: -cashflow.monthlyExpenses, positive: false },
    { label: "Sinking Funds", value: -cashflow.sinkingFundMonthly, positive: false },
    { label: "Monthly Surplus", value: cashflow.monthlySurplus, positive: cashflow.monthlySurplus >= 0 },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Leftover Cashflow"
        description="See what's left after expenses and sinking fund contributions."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Monthly Surplus"
          value={fmt(cashflow.monthlySurplus)}
          trend={cashflow.monthlySurplus >= 0 ? "up" : "down"}
        />
        <StatCard label="Annual Surplus" value={fmt(cashflow.annualSurplus)} />
        <StatCard label="Savings Rate" value={formatPercent(cashflow.savingsRate)} />
        <StatCard label="Expense Ratio" value={formatPercent(cashflow.expenseRatio)} />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Cashflow Summary</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-xl bg-surface-elevated px-4 py-3"
            >
              <span className="text-sm text-muted">{item.label}</span>
              <span
                className={`font-semibold ${
                  item.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                }`}
              >
                {item.value < 0 ? "−" : ""}
                {fmt(Math.abs(item.value))}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5 text-center">
          <p className="text-sm text-muted">Income</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {fmt(cashflow.monthlyNetIncome)}
          </p>
          <p className="text-xs text-muted">per month</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-sm text-muted">Outgoings</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {fmt(cashflow.monthlyExpenses + cashflow.sinkingFundMonthly)}
          </p>
          <p className="text-xs text-muted">per month</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-sm text-muted">Remaining</p>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {fmt(cashflow.monthlySurplus)}
          </p>
          <p className="text-xs text-muted">per month</p>
        </Card>
      </div>
    </div>
  );
}
