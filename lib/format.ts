import { COUNTRIES } from "./constants";
import type { CountryCode, ExpenseFrequency, PayFrequency } from "./types";

export function getCurrencySymbol(country: CountryCode): string {
  return COUNTRIES.find((c) => c.code === country)?.symbol ?? "$";
}

const CURRENCY_LOCALE: Record<CountryCode, string> = {
  AU: "en-AU",
  NZ: "en-NZ",
  SG: "en-SG",
  CA: "en-CA",
  GB: "en-GB",
  US: "en-US",
};

export function formatCurrency(
  amount: number,
  country: CountryCode = "AU",
  compact = false
): string {
  const currency = COUNTRIES.find((c) => c.code === country)?.currency ?? "AUD";
  const locale = CURRENCY_LOCALE[country] ?? "en-AU";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact && Math.abs(amount) >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function toAnnual(amount: number, frequency: PayFrequency | ExpenseFrequency): number {
  switch (frequency) {
    case "weekly":
      return amount * 52;
    case "fortnightly":
      return amount * 26;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "annually":
    case "annual":
      return amount;
    default:
      return amount;
  }
}

export function toMonthly(amount: number, frequency: PayFrequency | ExpenseFrequency): number {
  return toAnnual(amount, frequency) / 12;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function monthsUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.max(
    0,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  );
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function estimateCompletionDate(
  remaining: number,
  monthlyContribution: number
): Date | null {
  if (remaining <= 0) return new Date();
  if (monthlyContribution <= 0) return null;
  const months = Math.ceil(remaining / monthlyContribution);
  return addMonths(new Date(), months);
}
