import type { FinanceData, Scenario } from "../types";
import { getTaxEngine } from "../tax";
import { getExpenseMonthlyTotal } from "./expenses";
import { getTotalSinkingFundMonthly } from "./sinking-funds";
import { calculateHouseDeposit } from "./house-deposit";
import { getIntegratedNetWorth } from "./net-worth";
import { getTotalPortfolioValue } from "./portfolio";
import { getInvestingAllocation } from "./allocation";

export interface CashflowSummary {
  grossIncome: number;
  netIncome: number;
  monthlyNetIncome: number;
  annualExpenses: number;
  monthlyExpenses: number;
  sinkingFundMonthly: number;
  monthlySurplus: number;
  annualSurplus: number;
  savingsRate: number;
  expenseRatio: number;
}

export function calculateCashflow(data: FinanceData): CashflowSummary {
  const tax = getTaxEngine(data.income.country).calculate(data.income);
  const monthlyExpenses = getExpenseMonthlyTotal(data.expenses);
  const annualExpenses = monthlyExpenses * 12;
  const sinkingFundMonthly = getTotalSinkingFundMonthly(data.sinkingFunds);
  const monthlySurplus = tax.monthlyTakeHome - monthlyExpenses - sinkingFundMonthly;
  const annualSurplus = monthlySurplus * 12;

  return {
    grossIncome: tax.grossIncome,
    netIncome: tax.netIncome,
    monthlyNetIncome: tax.monthlyTakeHome,
    annualExpenses,
    monthlyExpenses,
    sinkingFundMonthly,
    monthlySurplus,
    annualSurplus,
    savingsRate: tax.netIncome > 0 ? (annualSurplus / tax.netIncome) * 100 : 0,
    expenseRatio: tax.netIncome > 0 ? (annualExpenses / tax.netIncome) * 100 : 0,
  };
}

export interface ScenarioImpact {
  scenario: Scenario;
  newMonthlySurplus: number;
  newSavingsRate: number;
  surplusDelta: number;
  savingsRateDelta: number;
  houseDepositMonthsDelta: number | null;
  netWorthDelta: number;
}

export function calculateScenarioImpact(
  data: FinanceData,
  scenario: Scenario,
  baseCashflow: CashflowSummary
): ScenarioImpact {
  let monthlyDelta = 0;
  let annualIncomeDelta = 0;

  switch (scenario.type) {
    case "salary_increase":
      annualIncomeDelta = scenario.value;
      break;
    case "salary_decrease":
      annualIncomeDelta = -scenario.value;
      break;
    case "higher_rent":
      monthlyDelta = -scenario.value;
      break;
    case "new_mortgage":
      monthlyDelta = -scenario.value;
      break;
    case "increased_investment":
      monthlyDelta = -scenario.value;
      break;
    case "reduced_spending":
      monthlyDelta = scenario.value;
      break;
  }

  const modifiedIncome = { ...data.income };
  if (annualIncomeDelta !== 0) {
    if (data.income.payFrequency === "annual") {
      modifiedIncome.salary = data.income.salary + annualIncomeDelta;
    } else {
      modifiedIncome.salary = data.income.salary + annualIncomeDelta / 12;
    }
  }

  const tax = getTaxEngine(data.income.country).calculate(
    annualIncomeDelta !== 0 ? modifiedIncome : data.income
  );

  const incomeDelta =
    annualIncomeDelta !== 0 ? tax.monthlyTakeHome - baseCashflow.monthlyNetIncome : 0;
  const adjustedSurplus = baseCashflow.monthlySurplus + monthlyDelta + incomeDelta;
  const newAnnualSurplus = adjustedSurplus * 12;
  const effectiveNetIncome = annualIncomeDelta !== 0 ? tax.netIncome : baseCashflow.netIncome;
  const newSavingsRate =
    effectiveNetIncome > 0 ? (newAnnualSurplus / effectiveNetIncome) * 100 : 0;

  const baseHouse = calculateHouseDeposit(data.houseDeposit, data.income.stateProvince);
  const modifiedHouse = calculateHouseDeposit(
    { ...data.houseDeposit, monthlyContribution: data.houseDeposit.monthlyContribution + (scenario.type === "increased_investment" ? -scenario.value : 0) },
    data.income.stateProvince
  );

  const houseDepositMonthsDelta =
    baseHouse.monthsToComplete !== null && modifiedHouse.monthsToComplete !== null
      ? modifiedHouse.monthsToComplete - baseHouse.monthsToComplete
      : null;

  const annualInvesting = getInvestingAllocation(data.allocationBuckets, adjustedSurplus);
  const netWorthDelta = (annualInvesting * 5) / 12;

  return {
    scenario,
    newMonthlySurplus: adjustedSurplus,
    newSavingsRate,
    surplusDelta: adjustedSurplus - baseCashflow.monthlySurplus,
    savingsRateDelta: newSavingsRate - baseCashflow.savingsRate,
    houseDepositMonthsDelta,
    netWorthDelta,
  };
}

export function getDashboardSummary(data: FinanceData) {
  const cashflow = calculateCashflow(data);
  const integrated = getIntegratedNetWorth(data);
  const houseDeposit = calculateHouseDeposit(data.houseDeposit, data.income.stateProvince);
  const annualInvestments = getInvestingAllocation(data.allocationBuckets, cashflow.monthlySurplus);
  const portfolioValue = getTotalPortfolioValue(data.investmentHoldings);
  const portfolioCost = data.investmentHoldings.reduce(
    (s, h) => s + h.shares * h.averagePurchasePrice,
    0
  );
  const emergencyCoverage =
    cashflow.monthlyExpenses > 0
      ? data.emergencyFundBalance / cashflow.monthlyExpenses
      : 0;

  return {
    netWorth: integrated.netWorth,
    annualIncome: cashflow.netIncome,
    monthlyTakeHome: cashflow.monthlyNetIncome,
    monthlyExpenses: cashflow.monthlyExpenses,
    monthlySurplus: cashflow.monthlySurplus,
    annualExpenses: cashflow.annualExpenses,
    annualSavings: cashflow.annualSurplus,
    annualInvestments,
    savingsRate: cashflow.savingsRate,
    emergencyCoverage,
    houseDepositProgress: houseDeposit.progress,
    portfolioValue,
    portfolioGainLoss: portfolioValue - portfolioCost,
    portfolioGainLossPercent:
      portfolioCost > 0 ? ((portfolioValue - portfolioCost) / portfolioCost) * 100 : 0,
    mortgageBalance: integrated.mortgageBalance,
    mortgagePayoffDate: integrated.mortgagePayoffDate,
    cashflow,
    integrated,
  };
}
