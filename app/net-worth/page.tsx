"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  getNetWorth,
  getTotalAssets,
  getTotalLiabilities,
  getAssetAllocation,
  getNetWorthTrend,
  ASSET_TYPE_LABELS,
  LIABILITY_TYPE_LABELS,
} from "@/lib/calculations/net-worth";
import { formatCurrency, generateId } from "@/lib/format";
import type { Asset, AssetType, Liability, LiabilityType } from "@/lib/types";
import { SectionHeader, StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";
import { AllocationPieChart, TrendLineChart } from "@/components/charts/FinanceCharts";

export default function NetWorthPage() {
  const { data, updateData } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const netWorth = getNetWorth(data.assets, data.liabilities);
  const totalAssets = getTotalAssets(data.assets);
  const totalLiabilities = getTotalLiabilities(data.liabilities);
  const assetAllocation = useMemo(() => getAssetAllocation(data.assets), [data.assets]);
  const trend = useMemo(() => getNetWorthTrend(data.netWorthSnapshots), [data.netWorthSnapshots]);

  const addAsset = () => {
    const asset: Asset = { id: generateId(), name: "New Asset", type: "other", value: 0 };
    updateData({ assets: [...data.assets, asset] });
  };

  const addLiability = () => {
    const liability: Liability = { id: generateId(), name: "New Liability", type: "other", value: 0 };
    updateData({ liabilities: [...data.liabilities, liability] });
  };

  const updateAsset = (id: string, patch: Partial<Asset>) => {
    updateData({ assets: data.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  };

  const updateLiability = (id: string, patch: Partial<Liability>) => {
    updateData({
      liabilities: data.liabilities.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeAsset = (id: string) => {
    updateData({ assets: data.assets.filter((a) => a.id !== id) });
  };

  const removeLiability = (id: string) => {
    updateData({ liabilities: data.liabilities.filter((l) => l.id !== id) });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Net Worth Dashboard"
        description="Track your assets, liabilities, and wealth over time."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Net Worth" value={fmt(netWorth)} trend="up" />
        <StatCard label="Total Assets" value={fmt(totalAssets)} />
        <StatCard label="Total Liabilities" value={fmt(totalLiabilities)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Assets</h2>
            <Button size="sm" onClick={addAsset}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {data.assets.map((asset) => (
              <div key={asset.id} className="grid gap-2 sm:grid-cols-4 sm:items-end">
                <Field label="Name">
                  <Input
                    value={asset.name}
                    onChange={(e) => updateAsset(asset.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="Type">
                  <Select
                    value={asset.type}
                    onChange={(e) => updateAsset(asset.id, { type: e.target.value as AssetType })}
                  >
                    {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Value">
                  <Input
                    type="number"
                    value={asset.value || ""}
                    onChange={(e) => updateAsset(asset.id, { value: Number(e.target.value) })}
                  />
                </Field>
                <Button variant="ghost" size="sm" onClick={() => removeAsset(asset.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Liabilities</h2>
            <Button size="sm" onClick={addLiability}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          <div className="space-y-3">
            {data.liabilities.map((liability) => (
              <div key={liability.id} className="grid gap-2 sm:grid-cols-4 sm:items-end">
                <Field label="Name">
                  <Input
                    value={liability.name}
                    onChange={(e) => updateLiability(liability.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="Type">
                  <Select
                    value={liability.type}
                    onChange={(e) =>
                      updateLiability(liability.id, { type: e.target.value as LiabilityType })
                    }
                  >
                    {Object.entries(LIABILITY_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Value">
                  <Input
                    type="number"
                    value={liability.value || ""}
                    onChange={(e) =>
                      updateLiability(liability.id, { value: Number(e.target.value) })
                    }
                  />
                </Field>
                <Button variant="ghost" size="sm" onClick={() => removeLiability(liability.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Net Worth Trend</h2>
          {trend.length > 0 ? (
            <TrendLineChart data={trend} dataKey="netWorth" formatter={fmt} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              Monthly snapshots are captured automatically as your net worth changes.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
