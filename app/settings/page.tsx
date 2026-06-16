"use client";

import { APP_NAME } from "@/lib/branding";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Trash2, AlertTriangle, RotateCcw } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { exportFinanceData, importFinanceData } from "@/lib/storage";
import { preserveAccountPreferences } from "@/lib/finance/autosave";
import { ACCOUNT_MODE_OPTIONS } from "@/lib/profile/preferences";
import type { DashboardViewMode } from "@/lib/types";
import { SectionHeader } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button, Field, Select } from "@/components/ui/Field";
import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { HouseholdSettings } from "@/components/settings/HouseholdSettings";

export default function SettingsPage() {
  const router = useRouter();
  const {
    data,
    replaceData,
    resetData,
    setDashboardView,
    resetSetup,
    saveNow,
    saveStatus,
    error,
  } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#household") {
      document.getElementById("household")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleExport = () => {
    const json = exportFinanceData(data);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "Data exported successfully." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = importFinanceData(reader.result as string);
        const merged = {
          ...imported,
          ...preserveAccountPreferences(data),
        };
        replaceData(merged);
        await saveNow();
        setMessage({ type: "success", text: "Data imported and saved to your account." });
      } catch {
        setMessage({
          type: "error",
          text: `Invalid file format. Please upload a valid ${APP_NAME} JSON export.`,
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = async () => {
    await resetData();
    setConfirmReset(false);
    setMessage({ type: "success", text: "All data has been reset." });
  };

  const handleDashboardViewChange = async (view: DashboardViewMode) => {
    try {
      await setDashboardView(view);
      setMessage({ type: "success", text: "Default dashboard view updated." });
    } catch {
      setMessage({ type: "error", text: "Failed to save dashboard preference." });
    }
  };

  const handleResetSetup = async () => {
    await resetSetup();
    router.push("/onboarding");
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Settings"
        description="Preferences, data management, and household options."
      />

      <div className="flex items-center gap-3">
        <SaveStatusIndicator status={saveStatus} error={error} />
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-foreground">Default dashboard view</h2>
        <p className="text-sm text-muted">
          Choose which view opens on your dashboard. You can also switch anytime from the sidebar.
        </p>
        <Field label="Dashboard mode">
          <Select
            value={data.dashboardView}
            onChange={(e) => handleDashboardViewChange(e.target.value as DashboardViewMode)}
          >
            {ACCOUNT_MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <HouseholdSettings />

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-foreground">Setup</h2>
        <p className="text-sm text-muted">
          Re-run the initial setup wizard. Your financial data is not deleted.
        </p>
        <Button type="button" variant="secondary" onClick={handleResetSetup}>
          <RotateCcw className="h-4 w-4" /> Reset setup wizard
        </Button>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-foreground">Export Data</h2>
          <p className="mt-1 text-sm text-muted">
            Download all your financial data as a JSON file for backup.
          </p>
          <Button className="mt-4" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export JSON
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-semibold text-foreground">Import Data</h2>
          <p className="mt-1 text-sm text-muted">
            Restore from a previously exported JSON backup file.
          </p>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <Button className="mt-4" variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import JSON
          </Button>
        </Card>
      </div>

      <Card className="border-red-500/20 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">Reset All Data</h2>
            <p className="mt-1 text-sm text-muted">
              Clear all financial data from your account. This cannot be undone.
            </p>
            {!confirmReset ? (
              <Button className="mt-4" variant="danger" onClick={() => setConfirmReset(true)}>
                <Trash2 className="h-4 w-4" /> Reset All Data
              </Button>
            ) : (
              <div className="mt-4 flex gap-2">
                <Button variant="danger" onClick={handleReset}>
                  Confirm Reset
                </Button>
                <Button variant="secondary" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-foreground">About</h2>
        <p className="mt-2 text-sm text-muted">
          {APP_NAME} stores your data securely in Supabase with row-level security. Changes save
          automatically while you edit.
        </p>
      </Card>
    </div>
  );
}
