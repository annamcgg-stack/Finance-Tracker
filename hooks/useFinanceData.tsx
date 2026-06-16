"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FinanceData, HoldingWithQuote } from "@/lib/types";
import { DEFAULT_FINANCE_DATA } from "@/lib/constants";
import { createNetWorthSnapshot } from "@/lib/storage";
import { getIntegratedNetWorth } from "@/lib/calculations/net-worth";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  loadFinanceDataFromSupabase,
  saveFinanceDataToSupabase,
  updateHoldingPrices,
} from "@/lib/supabase/data-service";
import {
  enrichHolding,
  fetchQuoteForHolding,
  getPortfolioSummary,
} from "@/lib/calculations/portfolio";
import { useSupabaseUser } from "./useSupabaseUser";

type FinanceContextValue = {
  data: FinanceData;
  updateData: (patch: Partial<FinanceData>) => void;
  replaceData: (data: FinanceData) => void;
  resetData: () => void;
  loaded: boolean;
  saving: boolean;
  error: string | null;
  reload: () => Promise<void>;
  portfolioHoldings: HoldingWithQuote[];
  portfolioSummary: ReturnType<typeof getPortfolioSummary> | null;
  refreshPortfolioPrices: () => Promise<void>;
  pricesLoading: boolean;
  lastPriceUpdate: string | null;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useSupabaseUser();
  const [data, setData] = useState<FinanceData>(DEFAULT_FINANCE_DATA);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<HoldingWithQuote[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave = useRef(true);

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      setLoaded(true);
      return;
    }

    setError(null);
    try {
      const remote = await loadFinanceDataFromSupabase(supabase, user.id);
      skipSave.current = true;
      setData(remote);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoaded(true);
      return;
    }
    loadData();
  }, [user, authLoading, loadData]);

  useEffect(() => {
    if (!loaded || !user) return;
    document.documentElement.classList.toggle("dark", data.darkMode);
  }, [data.darkMode, loaded, user]);

  useEffect(() => {
    if (!loaded || !user || skipSave.current) {
      skipSave.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = getSupabaseClient();
      if (!supabase || !user) return;
      setSaving(true);
      try {
        await saveFinanceDataToSupabase(supabase, user.id, data, user.email);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loaded, user]);

  useEffect(() => {
    if (!loaded || !user) return;
    const integrated = getIntegratedNetWorth(data);
    const monthKey = new Date().toISOString().slice(0, 7);
    const existing = data.netWorthSnapshots.find((s) => s.date.startsWith(monthKey));
    if (existing && Math.abs(existing.netWorth - integrated.netWorth) <= 100) return;

    const snapshot = createNetWorthSnapshot(
      integrated.netWorth,
      integrated.totalAssets,
      integrated.totalLiabilities
    );
    setData((prev) => {
      const filtered = prev.netWorthSnapshots.filter((s) => !s.date.startsWith(monthKey));
      return { ...prev, netWorthSnapshots: [...filtered, snapshot] };
    });
  }, [
    data.assets,
    data.liabilities,
    data.investmentHoldings,
    data.mortgageAccounts,
    loaded,
    user,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshPortfolioPrices = useCallback(async () => {
    if (!user || data.investmentHoldings.length === 0) return;
    setPricesLoading(true);
    const enriched: HoldingWithQuote[] = [];
    const priceUpdates: { id: string; latestPrice: number; latestPriceUpdatedAt: string }[] = [];

    for (const holding of data.investmentHoldings) {
      const quote = await fetchQuoteForHolding(holding);
      const item = enrichHolding(holding, quote);
      enriched.push(item);
      if (quote) {
        priceUpdates.push({
          id: holding.id,
          latestPrice: quote.price,
          latestPriceUpdatedAt: new Date().toISOString(),
        });
      }
    }

    setPortfolioHoldings(enriched);
    setLastPriceUpdate(new Date().toISOString());
    setPricesLoading(false);

    if (priceUpdates.length > 0) {
      const supabase = getSupabaseClient();
      if (supabase) {
        await updateHoldingPrices(supabase, user.id, priceUpdates);
        setData((prev) => ({
          ...prev,
          investmentHoldings: prev.investmentHoldings.map((h) => {
            const update = priceUpdates.find((u) => u.id === h.id);
            return update
              ? { ...h, latestPrice: update.latestPrice, latestPriceUpdatedAt: update.latestPriceUpdatedAt }
              : h;
          }),
        }));
        skipSave.current = true;
      }
    }
  }, [user, data.investmentHoldings]);

  useEffect(() => {
    if (!loaded || data.investmentHoldings.length === 0) {
      setPortfolioHoldings([]);
      return;
    }
    setPortfolioHoldings(
      data.investmentHoldings.map((h) => enrichHolding(h, null))
    );
    refreshPortfolioPrices();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateData = useCallback((patch: Partial<FinanceData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const replaceData = useCallback((newData: FinanceData) => {
    skipSave.current = false;
    setData(newData);
  }, []);

  const resetData = useCallback(async () => {
    skipSave.current = false;
    setData({ ...DEFAULT_FINANCE_DATA });
  }, []);

  const portfolioSummary = useMemo(
    () => (portfolioHoldings.length > 0 ? getPortfolioSummary(portfolioHoldings) : null),
    [portfolioHoldings]
  );

  const value = useMemo(
    () => ({
      data,
      updateData,
      replaceData,
      resetData,
      loaded: loaded && !authLoading,
      saving,
      error,
      reload: loadData,
      portfolioHoldings,
      portfolioSummary,
      refreshPortfolioPrices,
      pricesLoading,
      lastPriceUpdate,
    }),
    [
      data,
      updateData,
      replaceData,
      resetData,
      loaded,
      authLoading,
      saving,
      error,
      loadData,
      portfolioHoldings,
      portfolioSummary,
      refreshPortfolioPrices,
      pricesLoading,
      lastPriceUpdate,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
