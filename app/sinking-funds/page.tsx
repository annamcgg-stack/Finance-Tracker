"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  getSinkingFundMonthlyContribution,
  getSinkingFundProgress,
  getTotalSinkingFundMonthly,
} from "@/lib/calculations/sinking-funds";
import { formatCurrency, generateId } from "@/lib/format";
import type { SinkingFund } from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import { SectionHeader, StatCard, ProgressBar, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Button } from "@/components/ui/Field";

export default function SinkingFundsPage() {
  const { data, updateData } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);
  const totalMonthly = getTotalSinkingFundMonthly(data.sinkingFunds);

  const addFund = () => {
    const fund: SinkingFund = {
      id: generateId(),
      name: "New Fund",
      annualTarget: 0,
      currentBalance: 0,
      ...DEFAULT_SHAREABLE,
    };
    updateData({ sinkingFunds: [...data.sinkingFunds, fund] });
  };

  const updateFund = (id: string, patch: Partial<SinkingFund>) => {
    updateData({
      sinkingFunds: data.sinkingFunds.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const removeFund = (id: string) => {
    updateData({ sinkingFunds: data.sinkingFunds.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Sinking Funds"
        description="Save monthly for recurring annual costs."
        action={
          <Button onClick={addFund}>
            <Plus className="h-4 w-4" /> Add Fund
          </Button>
        }
      />

      <StatCard
        label="Total Monthly Contributions"
        value={fmt(totalMonthly)}
        subtext="Across all sinking funds"
      />

      {data.sinkingFunds.length === 0 ? (
        <EmptyState
          title="No sinking funds"
          description="Set aside money for car registration, insurance renewals, gifts, and more."
          action={
            <Button onClick={addFund}>
              <Plus className="h-4 w-4" /> Add Fund
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.sinkingFunds.map((fund) => {
            const monthly = getSinkingFundMonthlyContribution(fund);
            const progress = getSinkingFundProgress(fund);
            return (
              <Card key={fund.id} className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <Field label="Fund Name" className="flex-1">
                    <Input
                      value={fund.name}
                      onChange={(e) => updateFund(fund.id, { name: e.target.value })}
                    />
                  </Field>
                  <Button variant="ghost" size="sm" onClick={() => removeFund(fund.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Annual Target">
                    <Input
                      type="number"
                      value={fund.annualTarget || ""}
                      onChange={(e) =>
                        updateFund(fund.id, { annualTarget: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Current Balance">
                    <Input
                      type="number"
                      value={fund.currentBalance || ""}
                      onChange={(e) =>
                        updateFund(fund.id, { currentBalance: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted">{fmt(monthly)}/month needed</span>
                    <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={progress} color="bg-emerald-500" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
