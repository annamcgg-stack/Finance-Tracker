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
import { getAllocationBucketKey } from "@/lib/allocation/buckets";
import type { AllocationBucket } from "@/lib/types";
import { PageWithSaveStatus } from "@/components/layout/PageWithSaveStatus";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";
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

  const updateBucket = (key: string, patch: Partial<AllocationBucket>) => {
    updateData({
      allocationBuckets: data.allocationBuckets.map((b) =>
        getAllocationBucketKey(b) === key ? { ...b, ...patch } : b
      ),
    });
  };

  const addBucket = () => {
    const bucket: AllocationBucket = {
      id: generateId(),
      name: "Custom Bucket",
      percentage: 0,
      isDefault: false,
      goalId: null,
    };
    updateData({ allocationBuckets: [...data.allocationBuckets, bucket] });
  };

  const removeBucket = (key: string) => {
    void saveNow({
      allocationBuckets: data.allocationBuckets.filter(
        (b) => getAllocationBucketKey(b) !== key
      ),
    });
  };

  return (
    <PageWithSaveStatus
      title="Surplus Allocation"
      description="Divide your monthly surplus across investing, savings, and lifestyle buckets."
      action={
        <Button onClick={addBucket} variant="secondary">
          <Plus className="h-4 w-4" /> Add Bucket
        </Button>
      }
    >

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
            const bucketKey = getAllocationBucketKey(bucket);
            const alloc = allocations.find((a) => getAllocationBucketKey(a) === bucketKey);
            return (
              <Card key={bucketKey} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  {bucket.isDefault ? (
                    <span className="font-medium text-foreground">{bucket.name}</span>
                  ) : (
                    <Input
                      value={bucket.name}
                      onChange={(e) => updateBucket(bucketKey, { name: e.target.value })}
                      className="max-w-[200px]"
                    />
                  )}
                  {!bucket.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => removeBucket(bucketKey)}>
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
                      updateBucket(bucketKey, { percentage: Number(e.target.value) })
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
                        updateBucket(bucketKey, { percentage: Number(e.target.value) })
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
                <Field label="Link to goal (optional)" className="mt-3">
                  <Select
                    value={bucket.goalId ?? ""}
                    onChange={(e) =>
                      updateBucket(bucketKey, { goalId: e.target.value || null })
                    }
                  >
                    <option value="">None</option>
                    {data.goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </Select>
                </Field>
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
    </PageWithSaveStatus>
  );
}
