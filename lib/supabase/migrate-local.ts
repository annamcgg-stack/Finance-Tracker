import type { SupabaseClient } from "@supabase/supabase-js";
import type { FinanceData } from "@/lib/types";
import { loadFinanceData, STORAGE_KEY } from "@/lib/storage";
import { saveFinanceDataToSupabase } from "./data-service";

export function hasLocalFinanceData(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as FinanceData;
    return Boolean(parsed.income);
  } catch {
    return false;
  }
}

export async function importLocalDataToSupabase(
  supabase: SupabaseClient,
  userId: string,
  email?: string
): Promise<void> {
  const localData = loadFinanceData();
  await saveFinanceDataToSupabase(supabase, userId, localData, email);
  localStorage.removeItem(STORAGE_KEY);
}

export const LOCAL_IMPORT_DISMISSED_KEY = "wealthplan-local-import-dismissed";
