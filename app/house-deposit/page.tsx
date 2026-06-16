"use client";

import { useMemo } from "react";
import { useFinance } from "@/hooks/useFinanceData";
import { calculateHouseDeposit } from "@/lib/calculations/house-deposit";
import { formatCurrency, formatDate } from "@/lib/format";
import { SectionHeader, StatCard, ProgressBar } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";

export default function HouseDepositPage() {
  const { data, updateData } = useFinance();
  const plan = data.houseDeposit;
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const result = useMemo(
    () => calculateHouseDeposit(plan, data.income.stateProvince),
    [plan, data.income.stateProvince]
  );

  const updatePlan = (patch: Partial<typeof plan>) => {
    updateData({ houseDeposit: { ...plan, ...patch } });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="House Deposit Planner"
        description="Plan your property purchase and track deposit progress."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <h2 className="text-lg font-semibold text-foreground">Property Details</h2>
          <Field label="Property Purchase Price">
            <Input
              type="number"
              value={plan.propertyPrice || ""}
              onChange={(e) => updatePlan({ propertyPrice: Number(e.target.value) })}
            />
          </Field>
          <Field label="Deposit %" hint={`Required: ${fmt(result.depositRequired)}`}>
            <Input
              type="number"
              min={5}
              max={100}
              value={plan.depositPercent || ""}
              onChange={(e) => updatePlan({ depositPercent: Number(e.target.value) })}
            />
          </Field>
          <Field label="Current Savings">
            <Input
              type="number"
              value={plan.currentSavings || ""}
              onChange={(e) => updatePlan({ currentSavings: Number(e.target.value) })}
            />
          </Field>
          <Field label="Monthly Contribution">
            <Input
              type="number"
              value={plan.monthlyContribution || ""}
              onChange={(e) => updatePlan({ monthlyContribution: Number(e.target.value) })}
            />
          </Field>
          <Field label="Annual Return on Savings (%)" hint="Expected growth while saving">
            <Input
              type="number"
              step={0.1}
              value={plan.annualReturn || ""}
              onChange={(e) => updatePlan({ annualReturn: Number(e.target.value) })}
            />
          </Field>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-sm text-muted">Progress</p>
                <p className="text-3xl font-semibold text-foreground">
                  {result.progress.toFixed(0)}%
                </p>
              </div>
              {result.estimatedCompletion && (
                <p className="text-sm text-muted">
                  Est. {formatDate(result.estimatedCompletion.toISOString())}
                </p>
              )}
            </div>
            <ProgressBar value={result.progress} color="bg-primary" />
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Deposit Required" value={fmt(result.depositRequired)} />
            <StatCard label="Stamp Duty (est.)" value={fmt(result.stampDuty)} />
            <StatCard label="Legal Fees (est.)" value={fmt(result.legalFees)} />
            <StatCard label="Total Cash Required" value={fmt(result.totalCashRequired)} />
            <StatCard label="Amount Remaining" value={fmt(result.amountRemaining)} />
            {result.monthsToComplete !== null && (
              <StatCard
                label="Months to Complete"
                value={String(result.monthsToComplete)}
              />
            )}
          </div>

          <Card className="p-5">
            <h2 className="mb-3 text-lg font-semibold text-foreground">Cost Breakdown</h2>
            <div className="space-y-2">
              {[
                { label: "Deposit", value: result.depositRequired },
                { label: "Stamp Duty", value: result.stampDuty },
                { label: "Legal Fees", value: result.legalFees },
                { label: "Total", value: result.totalCashRequired },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-muted">{item.label}</span>
                  <span className="font-medium text-foreground">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
