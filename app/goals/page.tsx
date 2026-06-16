"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  sortGoalsByPriority,
  getGoalProgress,
  getGoalRemaining,
  getGoalEstimatedCompletion,
  getGoalOnTrack,
  getMonthlyNeededForGoal,
} from "@/lib/calculations/goals";
import { GOAL_TYPES, GOAL_PRIORITY_OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate, generateId } from "@/lib/format";
import type { FinancialGoal, GoalType } from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import { ShareVisibilityControl } from "@/components/household/ShareVisibilityControl";
import { VisibilityBadge } from "@/components/household/VisibilityBadge";
import { useHousehold } from "@/hooks/useHousehold";
import { PageWithSaveStatus } from "@/components/layout/PageWithSaveStatus";
import { ProgressBar, Badge, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";

export default function GoalsPage() {
  const { data, updateData, saveNow } = useFinance();
  const { household } = useHousehold();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);
  const goals = sortGoalsByPriority(data.goals);

  const addGoal = () => {
    const goal: FinancialGoal = {
      id: generateId(),
      name: "New Goal",
      type: "custom",
      targetAmount: 10000,
      currentAmount: 0,
      monthlyContribution: 500,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      priority: 3,
      userContributionAmount: 0,
      partnerContributionAmount: 0,
      ...DEFAULT_SHAREABLE,
    };
    updateData({ goals: [...data.goals, goal] });
  };

  const updateGoal = (id: string, patch: Partial<FinancialGoal>) => {
    updateData({
      goals: data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    });
  };

  const removeGoal = (id: string) => {
    void saveNow({ goals: data.goals.filter((g) => g.id !== id) });
  };

  return (
    <PageWithSaveStatus
      title="Future Plans"
      description="Track progress toward house deposits, holidays, emergency funds, and custom goals."
      action={
        <Button onClick={addGoal}>
          <Plus className="h-4 w-4" /> Add Goal
        </Button>
      }
    >

      {goals.length === 0 ? (
        <EmptyState
          title="No goals yet"
          description="Create goals for house deposits, holidays, emergency funds, and more."
          action={
            <Button onClick={addGoal}>
              <Plus className="h-4 w-4" /> Add Goal
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getGoalProgress(goal);
            const remaining = getGoalRemaining(goal);
            const completion = getGoalEstimatedCompletion(goal);
            const onTrack = getGoalOnTrack(goal);
            const monthlyNeeded = getMonthlyNeededForGoal(goal);

            return (
              <Card key={goal.id} className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{goal.name}</h3>
                      <VisibilityBadge visibility={goal.visibility} />
                      <Badge variant={onTrack ? "success" : "warning"}>
                        {onTrack ? "On track" : "Behind"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted">
                      {GOAL_TYPES.find((t) => t.value === goal.type)?.label}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGoal(goal.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Goal Name">
                    <Input
                      value={goal.name}
                      onChange={(e) => updateGoal(goal.id, { name: e.target.value })}
                    />
                  </Field>
                  <Field label="Type">
                    <Select
                      value={goal.type}
                      onChange={(e) => updateGoal(goal.id, { type: e.target.value as GoalType })}
                    >
                      {GOAL_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Target Amount">
                    <Input
                      type="number"
                      value={goal.targetAmount || ""}
                      onChange={(e) => updateGoal(goal.id, { targetAmount: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Current Amount">
                    <Input
                      type="number"
                      value={goal.currentAmount || ""}
                      onChange={(e) => updateGoal(goal.id, { currentAmount: Number(e.target.value) })}
                    />
                  </Field>
                  <Field label="Monthly Contribution">
                    <Input
                      type="number"
                      value={goal.monthlyContribution || ""}
                      onChange={(e) =>
                        updateGoal(goal.id, { monthlyContribution: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Target Date">
                    <Input
                      type="date"
                      value={goal.targetDate}
                      onChange={(e) => updateGoal(goal.id, { targetDate: e.target.value })}
                    />
                  </Field>
                  <Field label="Priority">
                    <Select
                      value={goal.priority}
                      onChange={(e) => updateGoal(goal.id, { priority: Number(e.target.value) })}
                    >
                      {GOAL_PRIORITY_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>

                {household && (
                  <div className="mb-4 space-y-3 border-b border-border pb-4">
                    <ShareVisibilityControl
                      visibility={goal.visibility}
                      householdId={goal.householdId}
                      activeHouseholdId={household.id}
                      onChange={(visibility, householdId) =>
                        updateGoal(goal.id, { visibility, householdId })
                      }
                    />
                    {goal.visibility !== "private" && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Your contribution">
                          <Input
                            type="number"
                            value={goal.userContributionAmount || ""}
                            onChange={(e) =>
                              updateGoal(goal.id, {
                                userContributionAmount: Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                        <Field label="Partner contribution">
                          <Input
                            type="number"
                            value={goal.partnerContributionAmount || ""}
                            onChange={(e) =>
                              updateGoal(goal.id, {
                                partnerContributionAmount: Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{progress.toFixed(0)}% complete</span>
                  <span className="text-muted">
                    {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
                  </span>
                </div>
                <ProgressBar value={progress} color="bg-primary" />
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                  <span>{fmt(remaining)} remaining</span>
                  {monthlyNeeded != null && (
                    <span>{fmt(monthlyNeeded)}/mo needed to hit target date</span>
                  )}
                  {completion && (
                    <span>Est. completion: {formatDate(completion.toISOString())}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageWithSaveStatus>
  );
}
