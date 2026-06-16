"use client";

import { useMemo } from "react";
import { Plus, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { formatPercent, generateId } from "@/lib/format";
import type { InvestmentHolding } from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import { ShareVisibilityControl } from "@/components/household/ShareVisibilityControl";
import { VisibilityBadge } from "@/components/household/VisibilityBadge";
import { useHousehold } from "@/hooks/useHousehold";
import { SectionHeader, StatCard, Badge, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";
import { AllocationPieChart, CategoryBarChart } from "@/components/charts/FinanceCharts";

export default function PortfolioPage() {
  const {
    data,
    updateData,
    saveNow,
    portfolioHoldings,
    portfolioSummary,
    refreshPortfolioPrices,
    pricesLoading,
    lastPriceUpdate,
  } = useFinance();
  const { household } = useHousehold();
  const formatHolding = (v: number, currency: string) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(v);

  const addHolding = () => {
    const holding: InvestmentHolding = {
      id: generateId(),
      ticker: "",
      exchange: "",
      stockName: "New Holding",
      country: "US",
      currency: "USD",
      shares: 0,
      averagePurchasePrice: 0,
      purchaseDate: new Date().toISOString().slice(0, 10),
      latestPrice: null,
      latestPriceUpdatedAt: null,
      sector: null,
      notes: "",
      ownershipPercent: 100,
      userContributionAmount: 0,
      partnerContributionAmount: 0,
      ...DEFAULT_SHAREABLE,
    };
    updateData({ investmentHoldings: [...data.investmentHoldings, holding] });
  };

  const updateHolding = (id: string, patch: Partial<InvestmentHolding>) => {
    updateData({
      investmentHoldings: data.investmentHoldings.map((h) =>
        h.id === id ? { ...h, ...patch } : h
      ),
    });
  };

  const removeHolding = (id: string) => {
    void saveNow({
      investmentHoldings: data.investmentHoldings.filter((h) => h.id !== id),
    });
  };

  const holdingChart = useMemo(
    () =>
      portfolioSummary?.byHolding.map((h) => ({ label: h.name, value: h.value })) ?? [],
    [portfolioSummary]
  );

  const gainLossChart = useMemo(
    () =>
      portfolioHoldings.map((h) => ({
        label: h.ticker,
        value: h.unrealisedGainLoss,
      })),
    [portfolioHoldings]
  );

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Investment Portfolio"
        description="Track live stock holdings and portfolio performance."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={refreshPortfolioPrices}
              disabled={pricesLoading || data.investmentHoldings.length === 0}
            >
              {pricesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh prices
            </Button>
            <Button onClick={addHolding}>
              <Plus className="h-4 w-4" /> Add Holding
            </Button>
          </div>
        }
      />

      {lastPriceUpdate && (
        <p className="text-xs text-muted">
          Last updated: {new Date(lastPriceUpdate).toLocaleString()}
        </p>
      )}

      {portfolioSummary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Portfolio Value" value={formatHolding(portfolioSummary.totalValue, "USD")} />
          <StatCard label="Cost Basis" value={formatHolding(portfolioSummary.totalCost, "USD")} />
          <StatCard
            label="Unrealised Gain/Loss"
            value={formatHolding(portfolioSummary.totalGainLoss, "USD")}
            trend={portfolioSummary.totalGainLoss >= 0 ? "up" : "down"}
          />
          <StatCard
            label="Gain/Loss %"
            value={formatPercent(portfolioSummary.totalGainLossPercent)}
          />
        </div>
      )}

      {data.investmentHoldings.length === 0 ? (
        <EmptyState
          title="No holdings yet"
          description="Add stocks like AAPL, GOOGL, VAS.AX, or IVV to track your portfolio with live prices."
          action={
            <Button onClick={addHolding}>
              <Plus className="h-4 w-4" /> Add your first holding
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {portfolioHoldings.map((holding) => {
            const source = data.investmentHoldings.find((h) => h.id === holding.id);
            if (!source) return null;
            return (
            <Card key={holding.id} className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{holding.stockName}</h3>
                    <VisibilityBadge visibility={source.visibility} />
                    <Badge variant="default">{holding.ticker}</Badge>
                    {holding.priceIsStale && (
                      <Badge variant="warning">Cached price</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted">
                    {formatHolding(holding.currentPrice, holding.currency)}/share ·{" "}
                    {holding.dailyChangePercent >= 0 ? "+" : ""}
                    {holding.dailyChangePercent.toFixed(2)}% today
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeHolding(holding.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Stock Name">
                  <Input
                    value={holding.stockName}
                    onChange={(e) => updateHolding(holding.id, { stockName: e.target.value })}
                  />
                </Field>
                <Field label="Ticker">
                  <Input
                    value={holding.ticker}
                    onChange={(e) =>
                      updateHolding(holding.id, { ticker: e.target.value.toUpperCase() })
                    }
                    placeholder="AAPL, VAS"
                  />
                </Field>
                <Field label="Exchange" hint="e.g. AX for ASX">
                  <Input
                    value={holding.exchange}
                    onChange={(e) => updateHolding(holding.id, { exchange: e.target.value })}
                    placeholder="AX"
                  />
                </Field>
                <Field label="Currency">
                  <Select
                    value={holding.currency}
                    onChange={(e) => updateHolding(holding.id, { currency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="AUD">AUD</option>
                    <option value="GBP">GBP</option>
                    <option value="EUR">EUR</option>
                  </Select>
                </Field>
                <Field label="Shares">
                  <Input
                    type="number"
                    step="0.0001"
                    value={holding.shares || ""}
                    onChange={(e) =>
                      updateHolding(holding.id, { shares: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Avg Purchase Price">
                  <Input
                    type="number"
                    step="0.01"
                    value={holding.averagePurchasePrice || ""}
                    onChange={(e) =>
                      updateHolding(holding.id, { averagePurchasePrice: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Purchase Date">
                  <Input
                    type="date"
                    value={holding.purchaseDate}
                    onChange={(e) => updateHolding(holding.id, { purchaseDate: e.target.value })}
                  />
                </Field>
                <Field label="Country">
                  <Input
                    value={holding.country}
                    onChange={(e) => updateHolding(holding.id, { country: e.target.value })}
                  />
                </Field>
              </div>

              {household && (
                <div className="mb-4 space-y-3 border-b border-border pb-4">
                  <ShareVisibilityControl
                    visibility={source.visibility}
                    householdId={source.householdId}
                    activeHouseholdId={household.id}
                    onChange={(visibility, householdId) =>
                      updateHolding(holding.id, { visibility, householdId })
                    }
                  />
                  {source.visibility !== "private" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Ownership %">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={source.ownershipPercent}
                          onChange={(e) =>
                            updateHolding(holding.id, {
                              ownershipPercent: Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Your contribution">
                        <Input
                          type="number"
                          value={source.userContributionAmount || ""}
                          onChange={(e) =>
                            updateHolding(holding.id, {
                              userContributionAmount: Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                      <Field label="Partner contribution">
                        <Input
                          type="number"
                          value={source.partnerContributionAmount || ""}
                          onChange={(e) =>
                            updateHolding(holding.id, {
                              partnerContributionAmount: Number(e.target.value),
                            })
                          }
                        />
                      </Field>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-4 rounded-xl bg-surface-elevated p-4 text-sm">
                <div>
                  <p className="text-muted">Market Value</p>
                  <p className="font-semibold text-foreground">
                    {formatHolding(holding.marketValue, holding.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Cost Basis</p>
                  <p className="font-semibold text-foreground">
                    {formatHolding(holding.costBasis, holding.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Gain/Loss</p>
                  <p
                    className={`font-semibold ${
                      holding.unrealisedGainLoss >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {formatHolding(holding.unrealisedGainLoss, holding.currency)} (
                    {formatPercent(holding.unrealisedGainLossPercent)})
                  </p>
                </div>
                <div>
                  <p className="text-muted">Daily Change</p>
                  <p className="font-semibold text-foreground">
                    {formatHolding(holding.dailyChange, holding.currency)}
                  </p>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {holdingChart.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Allocation by Holding</h2>
            <AllocationPieChart
              data={holdingChart.map((h) => ({ name: h.label, value: h.value }))}
            />
          </Card>
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Gain/Loss by Holding</h2>
            <CategoryBarChart data={gainLossChart} />
          </Card>
        </div>
      )}
    </div>
  );
}
