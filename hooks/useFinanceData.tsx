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
import type { DashboardViewMode, FinanceData, HoldingWithQuote, SetupChoice } from "@/lib/types";
import { EMPTY_FINANCE_DATA } from "@/lib/constants";
import { createNetWorthSnapshot } from "@/lib/storage";
import { getIntegratedNetWorth } from "@/lib/calculations/net-worth";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  loadFinanceDataFromSupabase,
  saveFinanceDataToSupabase,
  saveProfilePreferences,
  updateHoldingPrices,
} from "@/lib/supabase/data-service";
import {
  enrichHolding,
  fetchQuoteForHolding,
  getPortfolioSummary,
} from "@/lib/calculations/portfolio";
import { useSupabaseUser } from "./useSupabaseUser";
import {
  FINANCE_SAVE_DEBOUNCE_MS,
  FINANCE_SAVED_DISPLAY_MS,
  preserveAccountPreferences,
} from "@/lib/finance/autosave";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = FINANCE_SAVE_DEBOUNCE_MS;
const SAVED_DISPLAY_MS = FINANCE_SAVED_DISPLAY_MS;

type FinanceContextValue = {
  data: FinanceData;
  updateData: (patch: Partial<FinanceData>) => void;
  replaceData: (data: FinanceData) => void;
  resetData: () => void;
  loaded: boolean;
  saving: boolean;
  saveStatus: SaveStatus;
  error: string | null;
  reload: () => Promise<void>;
  saveNow: (patch?: Partial<FinanceData>) => Promise<void>;
  flushSave: () => Promise<void>;
  setDashboardView: (view: DashboardViewMode) => Promise<void>;
  finishSetup: (
    choice: SetupChoice,
    dashboardView?: DashboardViewMode
  ) => Promise<void>;
  /** @deprecated Use finishSetup */
  finishOnboarding: (dashboardView?: DashboardViewMode) => Promise<void>;
  resetSetup: () => Promise<void>;
  /** @deprecated Use resetSetup */
  resetOnboarding: () => Promise<void>;
  portfolioHoldings: HoldingWithQuote[];
  portfolioSummary: ReturnType<typeof getPortfolioSummary> | null;
  refreshPortfolioPrices: () => Promise<void>;
  pricesLoading: boolean;
  lastPriceUpdate: string | null;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useSupabaseUser();
  const [data, setData] = useState<FinanceData>(EMPTY_FINANCE_DATA);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [portfolioHoldings, setPortfolioHoldings] = useState<HoldingWithQuote[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSave = useRef(true);
  const dirtyRef = useRef(false);
  const dataRef = useRef(data);
  const hydrateComplete = useRef(false);
  const persistInFlight = useRef<Promise<void> | null>(null);

  dataRef.current = data;

  const markClean = useCallback(() => {
    dirtyRef.current = false;
  }, []);

  const persistData = useCallback(
    async (payload: FinanceData, email?: string) => {
      const supabase = getSupabaseClient();
      if (!supabase || !user) return;

      const run = async () => {
        setSaveStatus("saving");
        setError(null);
        try {
          await saveFinanceDataToSupabase(supabase, user.id, payload, email);
          markClean();
          setSaveStatus("saved");
          if (savedTimer.current) clearTimeout(savedTimer.current);
          savedTimer.current = setTimeout(() => setSaveStatus("idle"), SAVED_DISPLAY_MS);
        } catch (e) {
          dirtyRef.current = true;
          const message = e instanceof Error ? e.message : "Failed to save";
          setError(message);
          setSaveStatus("error");
        }
      };

      const pending = persistInFlight.current?.then(run, run) ?? run();
      persistInFlight.current = pending.finally(() => {
        if (persistInFlight.current === pending) persistInFlight.current = null;
      });
      await pending;
    },
    [user, markClean]
  );

  const flushSave = useCallback(async () => {
    if (!user || !hydrateComplete.current || !dirtyRef.current) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    await persistData(dataRef.current, user.email);
  }, [user, persistData]);

  const saveNow = useCallback(
    async (patch?: Partial<FinanceData>) => {
      const next = patch ? { ...dataRef.current, ...patch } : dataRef.current;
      if (patch) {
        skipSave.current = true;
        dirtyRef.current = true;
        setData(next);
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await persistData(next, user?.email);
    },
    [persistData, user?.email]
  );

  const loadData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      setLoaded(true);
      return;
    }

    setLoaded(false);
    hydrateComplete.current = false;
    setError(null);
    try {
      const remote = await loadFinanceDataFromSupabase(supabase, user.id);
      skipSave.current = true;
      markClean();
      setData(remote);
      setLoaded(true);
      hydrateComplete.current = true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
      setLoaded(true);
      hydrateComplete.current = true;
      markClean();
    }
  }, [user, markClean]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      skipSave.current = true;
      hydrateComplete.current = false;
      markClean();
      setData(EMPTY_FINANCE_DATA);
      setLoaded(true);
      setSaveStatus("idle");
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
    if (!hydrateComplete.current) return;

    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void persistData(dataRef.current, user.email);
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loaded, user, persistData]);

  useEffect(() => {
    if (!user || !loaded) return;

    const flushOnExit = () => {
      if (!dirtyRef.current) return;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      void persistData(dataRef.current, user.email);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushOnExit();
    };

    window.addEventListener("pagehide", flushOnExit);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("pagehide", flushOnExit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user, loaded, persistData]);

  useEffect(() => {
    if (!hydrateComplete.current || !loaded || !user) return;
    const integrated = getIntegratedNetWorth(data);
    if (integrated.netWorth === 0 && data.assets.length === 0 && data.liabilities.length === 0) {
      return;
    }
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
    setPortfolioHoldings(data.investmentHoldings.map((h) => enrichHolding(h, null)));
    refreshPortfolioPrices();
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateData = useCallback((patch: Partial<FinanceData>) => {
    dirtyRef.current = true;
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const replaceData = useCallback((newData: FinanceData) => {
    skipSave.current = false;
    dirtyRef.current = true;
    setData(newData);
  }, []);

  const resetData = useCallback(async () => {
    const next = {
      ...EMPTY_FINANCE_DATA,
      ...preserveAccountPreferences(dataRef.current),
    };
    skipSave.current = true;
    dirtyRef.current = true;
    setData(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await persistData(next, user?.email);
  }, [persistData, user?.email]);

  const setDashboardView = useCallback(
    async (view: DashboardViewMode) => {
      await saveNow({ dashboardView: view });
    },
    [saveNow]
  );

  const finishSetup = useCallback(
    async (choice: SetupChoice, dashboardView: DashboardViewMode = "personal") => {
      const supabase = getSupabaseClient();
      if (!supabase || !user) throw new Error("Not signed in");

      const patch: Partial<FinanceData> = {
        setupCompleted: true,
        setupChoice: choice,
        onboardingCompleted: true,
        dashboardView,
      };

      skipSave.current = true;
      markClean();
      setData((prev) => ({ ...prev, ...patch }));

      await saveProfilePreferences(supabase, user.id, {
        setupCompleted: true,
        setupChoice: choice,
        onboardingCompleted: true,
        dashboardView,
        email: user.email,
      });

      if (saveTimer.current) clearTimeout(saveTimer.current);
      await persistData({ ...dataRef.current, ...patch }, user.email);
    },
    [user, persistData]
  );

  const finishOnboarding = useCallback(
    async (dashboardView: DashboardViewMode = "personal") => {
      await finishSetup("individual", dashboardView);
    },
    [finishSetup]
  );

  const resetSetup = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;
    skipSave.current = true;
    setData((prev) => ({
      ...prev,
      setupCompleted: false,
      setupChoice: null,
      onboardingCompleted: false,
    }));
    try {
      await saveProfilePreferences(supabase, user.id, {
        setupCompleted: false,
        setupChoice: null,
        onboardingCompleted: false,
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset setup");
    }
  }, [user]);

  const resetOnboarding = resetSetup;

  const portfolioSummary = useMemo(
    () => (portfolioHoldings.length > 0 ? getPortfolioSummary(portfolioHoldings) : null),
    [portfolioHoldings]
  );

  const saving = saveStatus === "saving";

  const value = useMemo(
    () => ({
      data,
      updateData,
      replaceData,
      resetData,
      loaded: loaded && !authLoading,
      saving,
      saveStatus,
      error,
      reload: loadData,
      saveNow,
      flushSave,
      setDashboardView,
      finishSetup,
      finishOnboarding,
      resetSetup,
      resetOnboarding,
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
      saveStatus,
      error,
      loadData,
      saveNow,
      flushSave,
      setDashboardView,
      finishSetup,
      finishOnboarding,
      resetSetup,
      resetOnboarding,
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
