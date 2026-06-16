"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDashboardView, useHousehold } from "@/hooks/useHousehold";
import { getHouseholdDashboardStats } from "@/lib/calculations/household";
import { getIntegratedNetWorth } from "@/lib/calculations/net-worth";
import { getGoalProgress, sortGoalsByPriority } from "@/lib/calculations/goals";
import { formatCurrency } from "@/lib/format";
import { DashboardViewSwitcher } from "@/components/household/DashboardViewSwitcher";
import { HouseholdSettings } from "@/components/settings/HouseholdSettings";
import { PageWithSaveStatus } from "@/components/layout/PageWithSaveStatus";
import { StatCard, ProgressBar, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Field";
import { VisibilityBadge } from "@/components/household/VisibilityBadge";

export default function HouseholdDashboardPage() {
  const { viewData, personalData, dashboardView, partnerData } = useDashboardView();
  const { household } = useHousehold();
  const country = personalData.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const stats = useMemo(
    () => getHouseholdDashboardStats(personalData, partnerData, dashboardView),
    [personalData, partnerData, dashboardView]
  );
  const integrated = useMemo(() => getIntegratedNetWorth(viewData), [viewData]);
  const sharedGoals = useMemo(
    () =>
      sortGoalsByPriority(
        viewData.goals.filter((g) => g.visibility === "household" || g.visibility === "shared_account_only")
      ),
    [viewData.goals]
  );
  const sharedExpenses = useMemo(
    () => viewData.expenses.filter((e) => e.visibility !== "private"),
    [viewData.expenses]
  );

  return (
    <PageWithSaveStatus
      title="Household Finance"
      description="View shared finances, combined household metrics, and manage your household."
    >
      <DashboardViewSwitcher />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Combined Net Worth" value={fmt(integrated.netWorth)} trend="up" />
        <StatCard label="Total Assets" value={fmt(integrated.totalAssets)} />
        <StatCard label="Total Liabilities" value={fmt(integrated.totalLiabilities)} />
        <StatCard label="Shared Monthly Expenses" value={fmt(stats.sharedMonthlyExpenses)} />
        <StatCard label="Monthly Surplus" value={fmt(stats.monthlySurplus)} />
        <StatCard label="Portfolio Value" value={fmt(stats.portfolioValue)} />
        <StatCard label="Mortgage Balance" value={fmt(stats.mortgageBalance)} />
        <StatCard
          label="Property Equity"
          value={fmt(Math.max(0, integrated.propertyValue - integrated.mortgageBalance))}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Shared Expenses</h2>
          {sharedExpenses.length === 0 ? (
            <EmptyState
              title="No shared expenses"
              description="Mark expenses as shared from the Fixed Expenses page to see them here."
            />
          ) : (
            <ul className="space-y-2 text-sm">
              {sharedExpenses.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between rounded-lg bg-surface-elevated px-3 py-2"
                >
                  <span>
                    {e.name} <VisibilityBadge visibility={e.visibility} />
                  </span>
                  <span className="font-medium">{fmt(e.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Shared Goals</h2>
          {sharedGoals.length === 0 ? (
            <EmptyState
              title="No shared goals"
              description="Share goals from Future Plans to track household progress together."
            />
          ) : (
            <div className="space-y-3">
              {sharedGoals.map((g) => (
                <div key={g.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{g.name}</span>
                    <span>{getGoalProgress(g).toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={getGoalProgress(g)} />
                  <p className="mt-1 text-xs text-muted">
                    You: {fmt(g.userContributionAmount)} · Partner: {fmt(g.partnerContributionAmount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Household Management</h2>
          {!household && (
            <Link href="/settings#household">
              <Button size="sm">Set up household</Button>
            </Link>
          )}
        </div>
        <HouseholdSettings />
      </Card>
    </PageWithSaveStatus>
  );
}
