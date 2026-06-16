"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { calculateCashflow, calculateScenarioImpact } from "@/lib/calculations/cashflow";
import { SCENARIO_TYPES } from "@/lib/constants";
import { formatCurrency, formatPercent, generateId } from "@/lib/format";
import type { Scenario, ScenarioType } from "@/lib/types";
import { SectionHeader, StatCard, EmptyState, Badge } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Toggle, Button } from "@/components/ui/Field";

export default function ScenariosPage() {
  const { data, updateData } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const baseCashflow = useMemo(() => calculateCashflow(data), [data]);

  const impacts = useMemo(
    () =>
      data.scenarios
        .filter((s) => s.enabled)
        .map((s) => calculateScenarioImpact(data, s, baseCashflow)),
    [data, baseCashflow]
  );

  const addScenario = () => {
    const scenario: Scenario = {
      id: generateId(),
      name: "New Scenario",
      type: "salary_increase",
      value: 5000,
      enabled: true,
    };
    updateData({ scenarios: [...data.scenarios, scenario] });
  };

  const updateScenario = (id: string, patch: Partial<Scenario>) => {
    updateData({
      scenarios: data.scenarios.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  };

  const removeScenario = (id: string) => {
    updateData({ scenarios: data.scenarios.filter((s) => s.id !== id) });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Scenario Planner"
        description="Model what-if changes to your financial situation."
        action={
          <Button onClick={addScenario}>
            <Plus className="h-4 w-4" /> Add Scenario
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Current Monthly Surplus" value={fmt(baseCashflow.monthlySurplus)} />
        <StatCard label="Current Savings Rate" value={formatPercent(baseCashflow.savingsRate)} />
        <StatCard label="Active Scenarios" value={String(impacts.length)} />
      </div>

      {data.scenarios.length === 0 ? (
        <EmptyState
          title="No scenarios"
          description="Try modelling a salary increase, higher rent, or increased investment contributions."
          action={
            <Button onClick={addScenario}>
              <Plus className="h-4 w-4" /> Add Scenario
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {data.scenarios.map((scenario) => {
              const typeInfo = SCENARIO_TYPES.find((t) => t.value === scenario.type);
              return (
                <Card key={scenario.id} className="p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
                    <Field label="Name" className="lg:col-span-2">
                      <Input
                        value={scenario.name}
                        onChange={(e) => updateScenario(scenario.id, { name: e.target.value })}
                      />
                    </Field>
                    <Field label="Type">
                      <Select
                        value={scenario.type}
                        onChange={(e) =>
                          updateScenario(scenario.id, { type: e.target.value as ScenarioType })
                        }
                      >
                        {SCENARIO_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={`Amount (${typeInfo?.unit ?? ""})`}>
                      <Input
                        type="number"
                        value={scenario.value || ""}
                        onChange={(e) =>
                          updateScenario(scenario.id, { value: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <div className="flex items-end justify-between gap-2">
                      <Toggle
                        label="Enabled"
                        checked={scenario.enabled}
                        onChange={(v) => updateScenario(scenario.id, { enabled: v })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeScenario(scenario.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {impacts.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-semibold text-foreground">Impact Analysis</h2>
              <div className="space-y-4">
                {impacts.map((impact) => (
                  <div
                    key={impact.scenario.id}
                    className="rounded-xl border border-border bg-surface-elevated p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{impact.scenario.name}</h3>
                      <Badge variant={impact.surplusDelta >= 0 ? "success" : "danger"}>
                        {impact.surplusDelta >= 0 ? "+" : ""}
                        {fmt(impact.surplusDelta)}/mo
                      </Badge>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      <div>
                        <p className="text-muted">New Surplus</p>
                        <p className="font-semibold text-foreground">
                          {fmt(impact.newMonthlySurplus)}/mo
                        </p>
                      </div>
                      <div>
                        <p className="text-muted">New Savings Rate</p>
                        <p className="font-semibold text-foreground">
                          {formatPercent(impact.newSavingsRate)}
                          <span className="ml-1 text-xs text-muted">
                            ({impact.savingsRateDelta >= 0 ? "+" : ""}
                            {impact.savingsRateDelta.toFixed(1)}pp)
                          </span>
                        </p>
                      </div>
                      {impact.houseDepositMonthsDelta !== null && (
                        <div>
                          <p className="text-muted">House Deposit Timeline</p>
                          <p className="font-semibold text-foreground">
                            {impact.houseDepositMonthsDelta > 0 ? "+" : ""}
                            {impact.houseDepositMonthsDelta} months
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted">5yr Net Worth Impact (est.)</p>
                        <p className="font-semibold text-foreground">{fmt(impact.netWorthDelta)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
