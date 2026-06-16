import { estimateStampDuty } from "../tax";
import type { HouseDepositPlan } from "../types";
import { addMonths } from "../format";

const LEGAL_FEES_ESTIMATE = 2500;

export interface HouseDepositResult {
  depositRequired: number;
  stampDuty: number;
  legalFees: number;
  totalCashRequired: number;
  amountRemaining: number;
  progress: number;
  estimatedCompletion: Date | null;
  monthsToComplete: number | null;
}

export function calculateHouseDeposit(
  plan: HouseDepositPlan,
  state: string
): HouseDepositResult {
  const depositRequired = plan.propertyPrice * (plan.depositPercent / 100);
  const stampDuty = estimateStampDuty(plan.propertyPrice, state);
  const legalFees = LEGAL_FEES_ESTIMATE;
  const totalCashRequired = depositRequired + stampDuty + legalFees;
  const amountRemaining = Math.max(0, totalCashRequired - plan.currentSavings);
  const progress =
    totalCashRequired > 0
      ? Math.min(100, (plan.currentSavings / totalCashRequired) * 100)
      : 0;

  let monthsToComplete: number | null = null;
  let estimatedCompletion: Date | null = null;

  if (amountRemaining > 0 && plan.monthlyContribution > 0) {
    monthsToComplete = Math.ceil(amountRemaining / plan.monthlyContribution);
    estimatedCompletion = addMonths(new Date(), monthsToComplete);
  } else if (amountRemaining <= 0) {
    estimatedCompletion = new Date();
    monthsToComplete = 0;
  }

  return {
    depositRequired,
    stampDuty,
    legalFees,
    totalCashRequired,
    amountRemaining,
    progress,
    estimatedCompletion,
    monthsToComplete,
  };
}

export function projectSavingsWithReturn(
  current: number,
  monthlyContribution: number,
  annualReturn: number,
  months: number
): number {
  const monthlyRate = annualReturn / 100 / 12;
  let balance = current;
  for (let i = 0; i < months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }
  return balance;
}
