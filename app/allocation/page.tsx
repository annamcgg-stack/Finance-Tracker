"use client";

import { useMemo } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { calculateCashflow } from "@/lib/calculations/cashflow";
import {
  getAllocationTotal,
  isAllocationValid,
  getBucketAllocations,
} from "@/lib/calculations/allocation";
import { formatCurrency, generateId } from "@/lib/format";
import type { AllocationBucket } from "@/lib/types";
import { SectionHeader, StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Button } from "@/components/ui/Field";
import { AllocationPieChart } from "@/components/charts/FinanceCharts";

export default function AllocationPage() {
  const { data, updateData, saveNow } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const cashflow = useMemo(() => calculateCashflow(data), [data]);
  const total = getAllocationTotal(data.allocationBuckets);
  const valid = isAllocationValid(data.allocationBuckets);
  const allocations = useMemo(
    () => getBucketAllocations(data.allocationBuckets, cashflow.monthlySurplus),
    [data.allocationBuckets, cashflow.monthlySurplus]
  );

  const updateBucket = (id: string, patch: Partial<AllocationBucket>) => {
    updateData({
      allocationBuckets: data.allocationBuckets.map((b) =>
        b.id === id ? { ...b, ...patch } : b
      ),
    });
  };

  const addBucket = () => {
    const bucket: AllocationBucket = {
      id: generateId(),
      name: "Custom Bucket",
      percentage: 0,
      isDefault: false,
    };
    updateData({ allocationBuckets: [...data.allocationBuckets, bucket] });
  };

  const removeBucket = (id: string) => {
    void saveNow({
      allocationBuckets: data.allocationBuckets.filter((b) => b.id !== id),
    });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Money Allocation"
        description="Divide your surplus across savings, investing, and lifestyle buckets."
        action={
          <Button onClick={addBucket} variant="secondary">
            <Plus className="h-4 w-4" /> Add Bucket
          </Button>
        }
      />

      {!valid && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          Percentages total {total.toFixed(1)}% — they must equal 100%.
        </div>
      )}

      <StatCard
        label="Monthly Surplus to Allocate"
        value={fmt(cashflow.monthlySurplus)}
        subtext={`Total allocation: ${total.toFixed(1)}%`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {data.allocationBuckets.map((bucket) => {
            const alloc = allocations.find((a) => a.id === bucket.id);
            return (
              <Card key={bucket.id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  {bucket.isDefault ? (
                    <span className="font-medium text-foreground">{bucket.name}</span>
                  ) : (
                    <Input
                      value={bucket.name}
                      onChange={(e) => updateBucket(bucket.id, { name: e.target.value })}
                      className="max-w-[200px]"
                    />
                  )}
                  {!bucket.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => removeBucket(bucket.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={bucket.percentage}
                    onChange={(e) =>
                      updateBucket(bucket.id, { percentage: Number(e.target.value) })
                    }
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface-elevated accent-primary"
                  />
                  <Field label="" className="w-20">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={bucket.percentage}
                      onChange={(e) =>
                        updateBucket(bucket.id, { percentage: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <span className="text-sm text-muted">%</span>
                </div>
                {alloc && (
                  <p className="mt-2 text-xs text-muted">
                    {fmt(alloc.monthlyAmount)}/mo · {fmt(alloc.annualAmount)}/yr
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Allocation Chart</h2>
          <AllocationPieChart
            data={allocations.map((a) => ({ name: a.name, value: a.percentage }))}
            formatter={(v) => `${v.toFixed(1)}%`}
          />
        </Card>
      </div>
    </div>
  );
}
