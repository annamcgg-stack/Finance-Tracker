import { DEFAULT_FINANCE_DATA, STORAGE_KEY } from "./constants";
import type { FinanceData, NetWorthSnapshot } from "./types";
import { generateId } from "./format";

export { STORAGE_KEY };

export function loadFinanceData(): FinanceData {
  if (typeof window === "undefined") return DEFAULT_FINANCE_DATA;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FINANCE_DATA;
    const parsed = JSON.parse(raw) as FinanceData;
    return { ...DEFAULT_FINANCE_DATA, ...parsed, version: 1 };
  } catch {
    return DEFAULT_FINANCE_DATA;
  }
}

export function saveFinanceData(data: FinanceData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportFinanceData(data: FinanceData): string {
  return JSON.stringify(data, null, 2);
}

export function importFinanceData(json: string): FinanceData {
  const parsed = JSON.parse(json) as FinanceData;
  if (!parsed.income || !parsed.version) {
    throw new Error("Invalid finance data format");
  }
  return { ...DEFAULT_FINANCE_DATA, ...parsed };
}

export function resetFinanceData(): FinanceData {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  return { ...DEFAULT_FINANCE_DATA };
}

export function shouldCaptureSnapshot(
  snapshots: NetWorthSnapshot[],
  netWorth: number
): boolean {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const existing = snapshots.find((s) => s.date.startsWith(monthKey));
  if (existing) {
    return Math.abs(existing.netWorth - netWorth) > 100;
  }
  return true;
}

export function createNetWorthSnapshot(
  netWorth: number,
  totalAssets: number,
  totalLiabilities: number
): NetWorthSnapshot {
  return {
    id: generateId(),
    date: new Date().toISOString(),
    netWorth,
    totalAssets,
    totalLiabilities,
  };
}
