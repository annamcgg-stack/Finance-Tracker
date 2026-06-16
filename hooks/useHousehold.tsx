"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Household,
  HouseholdMember,
  SharedAccount,
  PartnerSharedData,
  DashboardViewMode,
  FinanceData,
} from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  loadUserHouseholds,
  loadHouseholdMembers,
  loadSharedAccounts,
  loadPartnerSharedData,
} from "@/lib/supabase/household-service";
import { buildViewFinanceData } from "@/lib/calculations/household";
import { useSupabaseUser } from "./useSupabaseUser";
import { useFinance } from "./useFinanceData";

type HouseholdContextValue = {
  household: Household | null;
  membership: HouseholdMember | null;
  members: HouseholdMember[];
  sharedAccounts: SharedAccount[];
  partnerData: PartnerSharedData[];
  loaded: boolean;
  reloadHousehold: () => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useSupabaseUser();
  const [household, setHousehold] = useState<Household | null>(null);
  const [membership, setMembership] = useState<HouseholdMember | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [sharedAccounts, setSharedAccounts] = useState<SharedAccount[]>([]);
  const [partnerData, setPartnerData] = useState<PartnerSharedData[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reloadHousehold = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) {
      setHousehold(null);
      setMembership(null);
      setMembers([]);
      setSharedAccounts([]);
      setPartnerData([]);
      setLoaded(true);
      return;
    }

    try {
      const { household: h, membership: m } = await loadUserHouseholds(supabase, user.id);
      setHousehold(h);
      setMembership(m);

      if (h) {
        const [memberList, accounts, partners] = await Promise.all([
          loadHouseholdMembers(supabase, h.id),
          loadSharedAccounts(supabase, h.id),
          loadPartnerSharedData(supabase, user.id, h.id),
        ]);
        setMembers(memberList);
        setSharedAccounts(accounts);
        setPartnerData(partners);
      } else {
        setMembers([]);
        setSharedAccounts([]);
        setPartnerData([]);
      }
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoaded(true);
      return;
    }
    reloadHousehold();
  }, [user, authLoading, reloadHousehold]);

  const value = useMemo(
    () => ({
      household,
      membership,
      members,
      sharedAccounts,
      partnerData,
      loaded,
      reloadHousehold,
    }),
    [household, membership, members, sharedAccounts, partnerData, loaded, reloadHousehold]
  );

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

export function useHousehold() {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold must be used within HouseholdProvider");
  return ctx;
}

export function useDashboardView(): {
  viewData: FinanceData;
  dashboardView: DashboardViewMode;
  setDashboardView: (view: DashboardViewMode) => void;
  personalData: FinanceData;
  partnerData: PartnerSharedData[];
} {
  const { data, updateData } = useFinance();
  const { partnerData } = useHousehold();

  const viewData = useMemo(
    () => buildViewFinanceData(data, partnerData, data.dashboardView),
    [data, partnerData]
  );

  const setDashboardView = useCallback(
    (view: DashboardViewMode) => {
      updateData({ dashboardView: view });
    },
    [updateData]
  );

  return {
    viewData,
    dashboardView: data.dashboardView,
    setDashboardView,
    personalData: data,
    partnerData,
  };
}
