"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useDashboardView } from "@/hooks/useHousehold";
import {
  calculateFinancialHealthScore,
  getHealthScoreTrend,
  HEALTH_CATEGORY_LABELS,
  type HealthCategory,
} from "@/lib/calculations/financialHealthScore";
import { PageWithSaveStatus } from "@/components/layout/PageWithSaveStatus";
import { StatCard, ProgressBar } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { TrendLineChart } from "@/components/charts/FinanceCharts";
import { Button } from "@/components/ui/Field";

export default function FinancialHealthPage() {
  const { viewData } = useDashboardView();

  const health = useMemo(() => calculateFinancialHealthScore(viewData), [viewData]);
  const trend = useMemo(
    () => getHealthScoreTrend(viewData.financialHealthSnapshots),
    [viewData.financialHealthSnapshots]
  );

  const categories = Object.entries(health.categoryScores) as [HealthCategory, number][];

  return (
    <PageWithSaveStatus
      title="Financial Health Score"
      description="A simple estimate of your overall financial wellbeing — not financial advice."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Overall Score"
          value={`${health.score} / 100`}
          subtext={health.rating}
          trend={health.score >= 70 ? "up" : health.score >= 40 ? "neutral" : "down"}
        />
        <Card className="flex flex-col justify-center p-5">
          <p className="text-sm text-muted">Rating</p>
          <p className="text-2xl font-semibold text-foreground">{health.rating}</p>
          <p className="mt-2 text-xs text-muted">
            This score is an estimate only and is not financial advice.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Category Breakdown</h2>
        <div className="space-y-4">
          {categories.map(([key, value]) => (
            <div key={key}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-foreground">{HEALTH_CATEGORY_LABELS[key]}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
              <ProgressBar value={value} color="bg-primary" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Suggestions</h2>
        <ul className="space-y-2 text-sm text-muted">
          {health.suggestions.map((s) => (
            <li key={s} className="rounded-lg bg-surface-elevated px-3 py-2">
              {s}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Score History</h2>
        {trend.length > 0 ? (
          <TrendLineChart data={trend} dataKey="score" formatter={(v) => `${v}`} />
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            Your score history will appear here as monthly snapshots are captured.
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link href="/net-worth">
          <Button variant="secondary">Net Worth</Button>
        </Link>
        <Link href="/goals">
          <Button variant="secondary">Future Plans</Button>
        </Link>
        <Link href="/allocation">
          <Button variant="secondary">Surplus Allocation</Button>
        </Link>
      </div>
    </PageWithSaveStatus>
  );
}
