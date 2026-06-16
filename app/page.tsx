"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDashboardView } from "@/hooks/useHousehold";
import { getDashboardSummary } from "@/lib/calculations/cashflow";
import { sortGoalsByProgress, getGoalProgress, getGoalRemaining } from "@/lib/calculations/goals";
import { getExpenseBreakdown } from "@/lib/calculations/expenses";
import { getBucketAllocations } from "@/lib/calculations/allocation";
import {
  getNetWorthTrend,
  getIntegratedAssetAllocation,
  ASSET_TYPE_LABELS,
} from "@/lib/calculations/net-worth";
import { calculateFinancialHealthScore } from "@/lib/calculations/financialHealthScore";
import { calculateInvestmentProjection, getScenarioReturns } from "@/lib/calculations/investment-projection";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import { DashboardViewSwitcher } from "@/components/household/DashboardViewSwitcher";
import { StatCard, ProgressBar, SectionHeader } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { APP_DASHBOARD_DESCRIPTION } from "@/lib/branding";
import {
  AllocationPieChart,
  CategoryBarChart,
  TrendLineChart,
  IncomeExpenseChart,
  MultiLineChart,
} from "@/components/charts/FinanceCharts";

export default function DashboardPage() {
  const { viewData, personalData } = useDashboardView();
  const country = personalData.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const summary = useMemo(() => getDashboardSummary(viewData), [viewData]);
  const goals = useMemo(() => sortGoalsByProgress(viewData.goals).slice(0, 5), [viewData.goals]);
  const expenseBreakdown = useMemo(() => getExpenseBreakdown(viewData.expenses), [viewData.expenses]);
  const allocations = useMemo(
    () => getBucketAllocations(viewData.allocationBuckets, summary.cashflow.monthlySurplus),
    [viewData.allocationBuckets, summary.cashflow.monthlySurplus]
  );
  const netWorthTrend = useMemo(() => getNetWorthTrend(viewData.netWorthSnapshots), [viewData.netWorthSnapshots]);
  const assetAllocation = useMemo(() => getIntegratedAssetAllocation(viewData), [viewData]);
  const health = useMemo(() => calculateFinancialHealthScore(viewData), [viewData]);

  const returns = getScenarioReturns(personalData.investmentProjection.annualReturn);
  const projectionData = useMemo(() => {
    const conservative = calculateInvestmentProjection({ ...personalData.investmentProjection, annualReturn: returns.conservative });
    const base = calculateInvestmentProjection(personalData.investmentProjection);
    const optimistic = calculateInvestmentProjection({ ...personalData.investmentProjection, annualReturn: returns.optimistic });
    return base.points.map((p, i) => ({
      label: `Y${p.year}`,
      conservative: conservative.points[i]?.value ?? 0,
      base: p.value,
      optimistic: optimistic.points[i]?.value ?? 0,
    }));
  }, [personalData.investmentProjection, returns]);

  return (
    <div className="space-y-8">
      <SectionHeader title="Dashboard" description={APP_DASHBOARD_DESCRIPTION} />
      <DashboardViewSwitcher />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Link href="/financial-health" className="block">
          <StatCard
            label="Financial Health"
            value={`${health.score} / 100`}
            subtext={health.rating}
            trend={health.score >= 70 ? "up" : health.score >= 40 ? "neutral" : "down"}
          />
        </Link>
        <StatCard label="Net Worth" value={fmt(summary.netWorth)} trend="up" />
        <StatCard label="Monthly Take-Home" value={fmt(summary.monthlyTakeHome)} />
        <StatCard label="Monthly Expenses" value={fmt(summary.monthlyExpenses)} />
        <StatCard label="Monthly Surplus" value={fmt(summary.monthlySurplus)} trend="up" />
        <StatCard label="Portfolio Value" value={fmt(summary.portfolioValue)} />
        <StatCard
          label="Portfolio Gain/Loss"
          value={fmt(summary.portfolioGainLoss)}
          subtext={formatPercent(summary.portfolioGainLossPercent)}
          trend={summary.portfolioGainLoss >= 0 ? "up" : "down"}
        />
        <StatCard label="Mortgage Balance" value={fmt(summary.mortgageBalance)} />
        <StatCard
          label="Mortgage Payoff"
          value={
            summary.mortgagePayoffDate
              ? formatDate(summary.mortgagePayoffDate.toISOString())
              : "—"
          }
        />
        <StatCard
          label="Emergency Fund"
          value={`${summary.emergencyCoverage.toFixed(1)} mo`}
        />
        <StatCard
          label="House Deposit"
          value={formatPercent(summary.houseDepositProgress)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Income vs Expenses</h2>
          <IncomeExpenseChart
            income={summary.annualIncome}
            expenses={summary.annualExpenses}
            formatter={fmt}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Allocation</h2>
          <AllocationPieChart
            data={allocations.map((a) => ({ name: a.name, value: a.monthlyAmount }))}
            formatter={fmt}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Expense Categories</h2>
          {expenseBreakdown.length > 0 ? (
            <CategoryBarChart
              data={expenseBreakdown.map((e) => ({ label: e.label, value: e.monthly }))}
              formatter={fmt}
            />
          ) : (
            <p className="py-8 text-center text-sm text-muted">Add fixed expenses to see breakdown.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Net Worth Growth</h2>
          {netWorthTrend.length > 0 ? (
            <TrendLineChart data={netWorthTrend} dataKey="netWorth" formatter={fmt} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">Net worth snapshots will appear over time.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Investment Projection</h2>
          <MultiLineChart
            data={projectionData}
            lines={[
              { key: "conservative", color: "#F59E0B", name: "Conservative" },
              { key: "base", color: "#3B82F6", name: "Base" },
              { key: "optimistic", color: "#10B981", name: "Optimistic" },
            ]}
            formatter={fmt}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Asset Allocation</h2>
          <AllocationPieChart
            data={assetAllocation.map((a) => ({
              name: ASSET_TYPE_LABELS[a.type] ?? a.type,
              value: a.value,
            }))}
            formatter={fmt}
          />
        </Card>
      </div>

      {goals.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Goal Progress</h2>
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{goal.name}</span>
                  <span className="text-muted">
                    {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
                  </span>
                </div>
                <ProgressBar value={getGoalProgress(goal)} color="bg-primary" />
                <p className="mt-1 text-xs text-muted">{fmt(getGoalRemaining(goal))} remaining</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
