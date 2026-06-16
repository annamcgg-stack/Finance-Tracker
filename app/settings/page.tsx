"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import {
  exportFinanceData,
  importFinanceData,
} from "@/lib/storage";
import { SectionHeader } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Field";

export default function SettingsPage() {
  const { data, replaceData, resetData } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    const json = exportFinanceData(data);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wealthplan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "Data exported successfully." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importFinanceData(reader.result as string);
        replaceData(imported);
        setMessage({ type: "success", text: "Data imported successfully." });
      } catch {
        setMessage({ type: "error", text: "Invalid file format. Please upload a valid WealthPlan JSON export." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    resetData();
    setConfirmReset(false);
    setMessage({ type: "success", text: "All data has been reset to defaults." });
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Data Management"
        description="Export, import, or reset your financial data."
      />

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
              Permanently delete all financial data and restore defaults. This cannot be undone.
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
          WealthPlan stores your data securely in Supabase with row-level security.
          Each user can only access their own financial data.
        </p>
        <p className="mt-2 text-xs text-muted">Version 1.0 · Data key: wealthplan-data-v1</p>
      </Card>
    </div>
  );
}
