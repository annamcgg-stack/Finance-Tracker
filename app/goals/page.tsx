"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  sortGoalsByProgress,
  getGoalProgress,
  getGoalRemaining,
  getGoalEstimatedCompletion,
  getGoalOnTrack,
} from "@/lib/calculations/goals";
import { GOAL_TYPES } from "@/lib/constants";
import { formatCurrency, formatDate, generateId } from "@/lib/format";
import type { FinancialGoal, GoalType } from "@/lib/types";
import { SectionHeader, ProgressBar, Badge, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";

export default function GoalsPage() {
  const { data, updateData } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);
  const goals = sortGoalsByProgress(data.goals);

  const addGoal = () => {
    const goal: FinancialGoal = {
      id: generateId(),
      name: "New Goal",
      type: "custom",
      targetAmount: 10000,
      currentAmount: 0,
      monthlyContribution: 500,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    };
    updateData({ goals: [...data.goals, goal] });
  };

  const updateGoal = (id: string, patch: Partial<FinancialGoal>) => {
    updateData({
      goals: data.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    });
  };

  const removeGoal = (id: string) => {
    updateData({ goals: data.goals.filter((g) => g.id !== id) });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Financial Goals"
        description="Track progress toward your savings targets."
        action={
          <Button onClick={addGoal}>
            <Plus className="h-4 w-4" /> Add Goal
          </Button>
        }
      />

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

            return (
              <Card key={goal.id} className="p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{goal.name}</h3>
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
                </div>

                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-foreground">{progress.toFixed(0)}% complete</span>
                  <span className="text-muted">
                    {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
                  </span>
                </div>
                <ProgressBar value={progress} color="bg-primary" />
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
                  <span>{fmt(remaining)} remaining</span>
                  {completion && (
                    <span>Est. completion: {formatDate(completion.toISOString())}</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
