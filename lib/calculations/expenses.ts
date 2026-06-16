import type { FixedExpense } from "../types";
import { toAnnual, toMonthly } from "../format";
import { EXPENSE_CATEGORIES } from "../constants";

export function getActiveExpenses(expenses: FixedExpense[]) {
  return expenses.filter((e) => e.active);
}

export function getExpenseAnnualTotal(expenses: FixedExpense[]): number {
  return getActiveExpenses(expenses).reduce(
    (sum, e) => sum + toAnnual(e.amount, e.frequency),
    0
  );
}

export function getExpenseMonthlyTotal(expenses: FixedExpense[]): number {
  return getActiveExpenses(expenses).reduce(
    (sum, e) => sum + toMonthly(e.amount, e.frequency),
    0
  );
}

export function getExpenseBreakdown(expenses: FixedExpense[]) {
  const totals = new Map<string, number>();
  for (const expense of getActiveExpenses(expenses)) {
    const annual = toAnnual(expense.amount, expense.frequency);
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + annual);
  }
  return EXPENSE_CATEGORIES.map((cat) => ({
    category: cat.value,
    label: cat.label,
    annual: totals.get(cat.value) ?? 0,
    monthly: (totals.get(cat.value) ?? 0) / 12,
  })).filter((item) => item.annual > 0);
}
