"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  PieChart,
  Target,
  Home,
  Shield,
  LineChart,
  Landmark,
  FlaskConical,
  Database,
  Building2,
  Menu,
  X,
  Moon,
  Sun,
  Loader2,
  Users,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { useFinance } from "@/hooks/useFinanceData";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { LogoutButton } from "@/components/LogoutButton";
import { LocalDataImportPrompt } from "@/components/LocalDataImportPrompt";

const PUBLIC_ROUTES = ["/welcome", "/login", "/signup"];
const ONBOARDING_ROUTES = ["/onboarding", "/invite"];

const ICONS = {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  PieChart,
  Target,
  Home,
  Shield,
  LineChart,
  Landmark,
  FlaskConical,
  Database,
  Building2,
  Users,
} as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data, updateData, loaded, saving, error } = useFinance();
  const { user } = useSupabaseUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isOnboarding = ONBOARDING_ROUTES.some((r) => pathname.startsWith(r));
  const toggleDark = () => updateData({ darkMode: !data.darkMode });

  useEffect(() => {
    if (!loaded || !user || isPublic || isOnboarding) return;
    if (!data.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [loaded, user, data.onboardingCompleted, isPublic, isOnboarding, router]);

  if (isPublic || isOnboarding) {
    return <div className="min-h-screen min-h-[100dvh] bg-background safe-top">{children}</div>;
  }

  const nav = (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon as keyof typeof ICONS];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-surface-elevated hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      <header className="safe-top sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-lg lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            W
          </div>
          <span className="font-semibold text-foreground">WealthPlan</span>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
          <button
            onClick={toggleDark}
            className="touch-target rounded-lg p-2 text-muted hover:bg-surface-elevated"
            aria-label="Toggle dark mode"
          >
            {data.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="touch-target rounded-lg p-2 text-muted hover:bg-surface-elevated"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 top-[calc(57px+env(safe-area-inset-top))] z-30 overflow-y-auto bg-surface lg:hidden">
          {nav}
        </div>
      )}

      <div className="mx-auto flex max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="border-b border-border px-5 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                  W
                </div>
                <div>
                  <p className="font-semibold text-foreground">WealthPlan</p>
                  <p className="text-xs text-muted">Personal Finance</p>
                </div>
              </div>
              <button
                onClick={toggleDark}
                className="rounded-lg p-2 text-muted hover:bg-surface-elevated"
                aria-label="Toggle dark mode"
              >
                {data.darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            {user?.email && (
              <p className="mt-3 truncate text-xs text-muted">{user.email}</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
          <div className="border-t border-border p-3">
            <LogoutButton className="w-full justify-start" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8">
          {!loaded ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <p>Loading your financial data…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <LocalDataImportPrompt />
              {children}
              <p className="mt-12 text-center text-xs text-muted">
                This app provides estimates only and is not financial, tax, or investment advice.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
