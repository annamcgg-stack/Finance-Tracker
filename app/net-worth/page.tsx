"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { useDashboardView } from "@/hooks/useHousehold";
import {
  getIntegratedNetWorth,
  getIntegratedAssetAllocation,
  getLiabilityBreakdown,
  getNetWorthTrend,
  getNetWorthPeriodChange,
  ASSET_TYPE_LABELS,
  LIABILITY_TYPE_LABELS,
} from "@/lib/calculations/net-worth";
import { formatCurrency, generateId } from "@/lib/format";
import type { Asset, AssetType, Liability, LiabilityType } from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import { DashboardViewSwitcher } from "@/components/household/DashboardViewSwitcher";
import { ShareVisibilityControl } from "@/components/household/ShareVisibilityControl";
import { VisibilityBadge } from "@/components/household/VisibilityBadge";
import { useHousehold } from "@/hooks/useHousehold";
import { PageWithSaveStatus } from "@/components/layout/PageWithSaveStatus";
import { StatCard, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";
import { AllocationPieChart, TrendLineChart } from "@/components/charts/FinanceCharts";

export default function NetWorthPage() {
  const { updateData, saveNow } = useFinance();
  const { viewData, personalData } = useDashboardView();
  const { household } = useHousehold();
  const country = personalData.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const integrated = useMemo(() => getIntegratedNetWorth(viewData), [viewData]);
  const periodChange = useMemo(
    () => getNetWorthPeriodChange(viewData.netWorthSnapshots),
    [viewData.netWorthSnapshots]
  );
  const assetAllocation = useMemo(
    () => getIntegratedAssetAllocation(viewData),
    [viewData]
  );
  const liabilityBreakdown = useMemo(
    () => getLiabilityBreakdown(viewData),
    [viewData]
  );
  const trend = useMemo(() => getNetWorthTrend(viewData.netWorthSnapshots), [viewData.netWorthSnapshots]);

  const addAsset = () => {
    const asset: Asset = {
      id: generateId(),
      name: "New Asset",
      type: "other",
      value: 0,
      ...DEFAULT_SHAREABLE,
    };
    updateData({ assets: [...personalData.assets, asset] });
  };

  const addLiability = () => {
    const liability: Liability = {
      id: generateId(),
      name: "New Liability",
      type: "other",
      value: 0,
      ...DEFAULT_SHAREABLE,
    };
    updateData({ liabilities: [...personalData.liabilities, liability] });
  };

  const updateAsset = (id: string, patch: Partial<Asset>) => {
    updateData({
      assets: personalData.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  };

  const updateLiability = (id: string, patch: Partial<Liability>) => {
    updateData({
      liabilities: personalData.liabilities.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  };

  const removeAsset = (id: string) => {
    void saveNow({ assets: personalData.assets.filter((a) => a.id !== id) });
  };

  const removeLiability = (id: string) => {
    void saveNow({ liabilities: personalData.liabilities.filter((l) => l.id !== id) });
  };

  return (
    <PageWithSaveStatus
      title="Net Worth Dashboard"
      description="Track assets, liabilities, portfolio, and property in one integrated view."
    >
      <DashboardViewSwitcher />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Net Worth" value={fmt(integrated.netWorth)} trend="up" />
        <StatCard label="Total Assets" value={fmt(integrated.totalAssets)} />
        <StatCard label="Total Liabilities" value={fmt(integrated.totalLiabilities)} />
        <StatCard
          label="Monthly Change"
          value={fmt(periodChange.monthlyChange)}
          trend={periodChange.monthlyChange >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Annual Change"
          value={fmt(periodChange.annualChange)}
          trend={periodChange.annualChange >= 0 ? "up" : "down"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Assets</h2>
            <Button size="sm" onClick={addAsset}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {personalData.assets.length === 0 ? (
            <EmptyState
              title="No assets yet"
              description="Add cash, savings, super, property, and other assets to track your wealth."
              action={
                <Button size="sm" onClick={addAsset}>
                  <Plus className="h-4 w-4" /> Add asset
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {personalData.assets.map((asset) => (
                <div key={asset.id} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{asset.name || "Asset"}</span>
                    <VisibilityBadge visibility={asset.visibility} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
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
                  {household && (
                    <ShareVisibilityControl
                      visibility={asset.visibility}
                      householdId={asset.householdId}
                      activeHouseholdId={household.id}
                      onChange={(visibility, householdId) =>
                        updateAsset(asset.id, { visibility, householdId })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Liabilities</h2>
            <Button size="sm" onClick={addLiability}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
          {personalData.liabilities.length === 0 ? (
            <EmptyState
              title="No liabilities yet"
              description="Add credit cards, loans, HECS/HELP, and other debts."
              action={
                <Button size="sm" onClick={addLiability}>
                  <Plus className="h-4 w-4" /> Add liability
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {personalData.liabilities.map((liability) => (
                <div key={liability.id} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{liability.name || "Liability"}</span>
                    <VisibilityBadge visibility={liability.visibility} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-4 sm:items-end">
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
                  {household && (
                    <ShareVisibilityControl
                      visibility={liability.visibility}
                      householdId={liability.householdId}
                      activeHouseholdId={household.id}
                      onChange={(visibility, householdId) =>
                        updateLiability(liability.id, { visibility, householdId })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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
          <h2 className="mb-4 text-lg font-semibold text-foreground">Liability Breakdown</h2>
          <AllocationPieChart
            data={liabilityBreakdown.map((l) => ({
              name: LIABILITY_TYPE_LABELS[l.type] ?? l.type,
              value: l.value,
            }))}
            formatter={fmt}
          />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Net Worth History</h2>
          {trend.length > 0 ? (
            <TrendLineChart data={trend} dataKey="netWorth" formatter={fmt} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              Monthly snapshots are captured automatically as your net worth changes.
            </p>
          )}
        </Card>
      </div>
    </PageWithSaveStatus>
  );
}
