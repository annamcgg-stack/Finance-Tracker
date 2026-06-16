import type { FinancialGoal } from "../types";
import { estimateCompletionDate, monthsUntil } from "../format";

export function getGoalProgress(goal: FinancialGoal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export function getGoalRemaining(goal: FinancialGoal): number {
  return Math.max(0, goal.targetAmount - goal.currentAmount);
}

export function getGoalEstimatedCompletion(goal: FinancialGoal): Date | null {
  return estimateCompletionDate(getGoalRemaining(goal), goal.monthlyContribution);
}

export function getGoalOnTrack(goal: FinancialGoal): boolean {
  const completion = getGoalEstimatedCompletion(goal);
  if (!completion) return false;
  const target = new Date(goal.targetDate);
  return completion <= target;
}

export function sortGoalsByProgress(goals: FinancialGoal[]): FinancialGoal[] {
  return [...goals].sort((a, b) => getGoalProgress(b) - getGoalProgress(a));
}

export function sortGoalsByPriority(goals: FinancialGoal[]): FinancialGoal[] {
  return [...goals].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return getGoalProgress(b) - getGoalProgress(a);
  });
}

export function getMonthlyNeededForGoal(goal: FinancialGoal): number | null {
  const remaining = getGoalRemaining(goal);
  const months = getMonthsToTarget(goal);
  if (months <= 0 || remaining <= 0) return null;
  return remaining / months;
}

export function getMonthsToTarget(goal: FinancialGoal): number {
  return monthsUntil(goal.targetDate);
}
