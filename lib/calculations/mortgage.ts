import type {
  MortgageAccount,
  MortgageExtraPayment,
  RepaymentFrequency,
  ExtraPaymentFrequency,
} from "../types";

export interface AmortisationRow {
  period: number;
  openingBalance: number;
  interest: number;
  principal: number;
  extraPayment: number;
  closingBalance: number;
  date: Date;
}

export interface MortgageSummary {
  requiredRepayment: number;
  totalInterest: number;
  payoffDate: Date | null;
  remainingPeriods: number;
  schedule: AmortisationRow[];
}

export interface MortgageComparison {
  base: MortgageSummary;
  withExtra: MortgageSummary;
  interestSaved: number;
  periodsSaved: number;
  timeSavedMonths: number;
}

function periodsPerYear(freq: RepaymentFrequency | ExtraPaymentFrequency): number {
  switch (freq) {
    case "weekly":
      return 52;
    case "fortnightly":
      return 26;
    case "monthly":
      return 12;
  }
}

export function calculateRequiredRepayment(
  principal: number,
  annualRate: number,
  termYears: number,
  frequency: RepaymentFrequency
): number {
  const n = termYears * periodsPerYear(frequency);
  const r = annualRate / 100 / periodsPerYear(frequency);
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function extraPerPeriod(
  extras: MortgageExtraPayment[],
  periodDate: Date,
  mortgageFrequency: RepaymentFrequency
): number {
  const mortgagePpy = periodsPerYear(mortgageFrequency);
  let total = 0;
  for (const extra of extras) {
    const start = extra.startDate ? new Date(extra.startDate) : new Date(0);
    const end = extra.endDate ? new Date(extra.endDate) : new Date("2099-12-31");
    if (periodDate < start || periodDate > end) continue;

    const extraPpy = periodsPerYear(extra.frequency);
    total += extra.amount * (extraPpy / mortgagePpy);
  }
  return total;
}

export function calculateMortgageSchedule(
  account: MortgageAccount,
  extras: MortgageExtraPayment[] = [],
  maxPeriods = 600
): MortgageSummary {
  const ppy = periodsPerYear(account.repaymentFrequency);
  const periodicRate = account.interestRate / 100 / ppy;
  const repayment =
    account.regularRepaymentAmount > 0
      ? account.regularRepaymentAmount
      : calculateRequiredRepayment(
          account.currentBalance,
          account.interestRate,
          account.loanTermYears,
          account.repaymentFrequency
        );

  let balance = account.currentBalance;
  const startDate = account.loanStartDate ? new Date(account.loanStartDate) : new Date();
  const schedule: AmortisationRow[] = [];
  let totalInterest = 0;
  let payoffDate: Date | null = null;

  for (let period = 1; period <= maxPeriods && balance > 0.01; period++) {
    const periodDate = new Date(startDate);
    if (account.repaymentFrequency === "monthly") {
      periodDate.setMonth(startDate.getMonth() + period);
    } else if (account.repaymentFrequency === "fortnightly") {
      periodDate.setDate(startDate.getDate() + period * 14);
    } else {
      periodDate.setDate(startDate.getDate() + period * 7);
    }

    const effectiveBalance = Math.max(0, balance - account.offsetBalance);
    const interest = effectiveBalance * periodicRate;
    const extra = extraPerPeriod(extras, periodDate, account.repaymentFrequency);
    let principal = repayment - interest + extra;
    if (principal > balance) principal = balance;
    const closing = Math.max(0, balance - principal);

    totalInterest += interest;
    schedule.push({
      period,
      openingBalance: balance,
      interest,
      principal,
      extraPayment: extra,
      closingBalance: closing,
      date: periodDate,
    });

    balance = closing;
    if (balance <= 0.01) {
      payoffDate = periodDate;
      break;
    }
  }

  return {
    requiredRepayment: repayment,
    totalInterest,
    payoffDate,
    remainingPeriods: schedule.length,
    schedule,
  };
}

export function calculateMortgageWithExtraPayments(
  account: MortgageAccount,
  extras: MortgageExtraPayment[]
): MortgageComparison {
  const base = calculateMortgageSchedule({ ...account, offsetBalance: account.offsetBalance }, []);
  const withExtra = calculateMortgageSchedule(account, extras);

  const interestSaved = base.totalInterest - withExtra.totalInterest;
  const periodsSaved = base.remainingPeriods - withExtra.remainingPeriods;
  const monthsPerPeriod =
    account.repaymentFrequency === "monthly"
      ? 1
      : account.repaymentFrequency === "fortnightly"
        ? 0.5
        : 0.25;

  return {
    base,
    withExtra,
    interestSaved: Math.max(0, interestSaved),
    periodsSaved: Math.max(0, periodsSaved),
    timeSavedMonths: Math.max(0, periodsSaved * monthsPerPeriod),
  };
}

export function calculateInterestSaved(
  base: MortgageSummary,
  withExtra: MortgageSummary
): number {
  return Math.max(0, base.totalInterest - withExtra.totalInterest);
}

export function calculateTimeSaved(
  base: MortgageSummary,
  withExtra: MortgageSummary,
  frequency: RepaymentFrequency
): number {
  const periodsSaved = base.remainingPeriods - withExtra.remainingPeriods;
  const monthsPerPeriod =
    frequency === "monthly" ? 1 : frequency === "fortnightly" ? 0.5 : 0.25;
  return Math.max(0, periodsSaved * monthsPerPeriod);
}

export function getTotalMortgageBalance(accounts: MortgageAccount[]): number {
  return accounts.reduce((sum, a) => sum + a.currentBalance, 0);
}

export function getTotalPropertyValue(accounts: MortgageAccount[]): number {
  return accounts.reduce((sum, a) => sum + a.propertyValue, 0);
}

export function getEarliestPayoffDate(
  accounts: MortgageAccount[],
  extrasByMortgage: Map<string, MortgageExtraPayment[]>
): Date | null {
  let earliest: Date | null = null;
  for (const account of accounts) {
    const extras = extrasByMortgage.get(account.id) ?? [];
    const comparison = calculateMortgageWithExtraPayments(account, extras);
    const date = comparison.withExtra.payoffDate;
    if (date && (!earliest || date < earliest)) earliest = date;
  }
  return earliest;
}
