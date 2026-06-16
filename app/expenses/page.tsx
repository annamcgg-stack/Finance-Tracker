"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  getExpenseAnnualTotal,
  getExpenseMonthlyTotal,
  getExpenseBreakdown,
} from "@/lib/calculations/expenses";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { formatCurrency, generateId, toAnnual, toMonthly } from "@/lib/format";
import type { ExpenseCategory, ExpenseFrequency, FixedExpense } from "@/lib/types";
import { SectionHeader, StatCard, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Toggle, Button } from "@/components/ui/Field";
import { CategoryBarChart } from "@/components/charts/FinanceCharts";

export default function ExpensesPage() {
  const { data, updateData } = useFinance();
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const annualTotal = useMemo(() => getExpenseAnnualTotal(data.expenses), [data.expenses]);
  const monthlyTotal = useMemo(() => getExpenseMonthlyTotal(data.expenses), [data.expenses]);
  const breakdown = useMemo(() => getExpenseBreakdown(data.expenses), [data.expenses]);

  const addExpense = () => {
    const expense: FixedExpense = {
      id: generateId(),
      name: "New Expense",
      category: "other",
      amount: 0,
      frequency: "monthly",
      active: true,
    };
    updateData({ expenses: [...data.expenses, expense] });
  };

  const updateExpense = (id: string, patch: Partial<FixedExpense>) => {
    updateData({
      expenses: data.expenses.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  };

  const removeExpense = (id: string) => {
    updateData({ expenses: data.expenses.filter((e) => e.id !== id) });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Fixed Expenses"
        description="Track recurring bills and commitments."
        action={
          <Button onClick={addExpense}>
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Annual Expenses" value={fmt(annualTotal)} />
        <StatCard label="Total Monthly Expenses" value={fmt(monthlyTotal)} />
      </div>

      {data.expenses.length === 0 ? (
        <EmptyState
          title="No expenses yet"
          description="Add your recurring expenses like rent, utilities, and subscriptions."
          action={
            <Button onClick={addExpense}>
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.expenses.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:items-end">
                <Field label="Name" className="lg:col-span-2">
                  <Input
                    value={expense.name}
                    onChange={(e) => updateExpense(expense.id, { name: e.target.value })}
                  />
                </Field>
                <Field label="Category">
                  <Select
                    value={expense.category}
                    onChange={(e) =>
                      updateExpense(expense.id, { category: e.target.value as ExpenseCategory })
                    }
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Amount">
                  <Input
                    type="number"
                    value={expense.amount || ""}
                    onChange={(e) => updateExpense(expense.id, { amount: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Frequency">
                  <Select
                    value={expense.frequency}
                    onChange={(e) =>
                      updateExpense(expense.id, { frequency: e.target.value as ExpenseFrequency })
                    }
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </Select>
                </Field>
                <div className="flex items-end justify-between gap-2">
                  <Toggle
                    label="Active"
                    checked={expense.active}
                    onChange={(v) => updateExpense(expense.id, { active: v })}
                  />
                  <Button variant="ghost" size="sm" onClick={() => removeExpense(expense.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
              {expense.active && expense.amount > 0 && (
                <p className="mt-2 text-xs text-muted">
                  {fmt(toMonthly(expense.amount, expense.frequency))}/mo ·{" "}
                  {fmt(toAnnual(expense.amount, expense.frequency))}/yr
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {breakdown.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Expense Breakdown</h2>
          <CategoryBarChart
            data={breakdown.map((b) => ({ label: b.label, value: b.monthly }))}
            formatter={fmt}
          />
        </Card>
      )}
    </div>
  );
}
