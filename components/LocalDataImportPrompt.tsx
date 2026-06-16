"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  hasLocalFinanceData,
  importLocalDataToSupabase,
  LOCAL_IMPORT_DISMISSED_KEY,
} from "@/lib/supabase/migrate-local";
import { Button } from "@/components/ui/Field";

export function LocalDataImportPrompt() {
  const { user } = useSupabaseUser();
  const { reload } = useFinance();
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return hasLocalFinanceData() && !localStorage.getItem(LOCAL_IMPORT_DISMISSED_KEY);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!visible || !user) return null;

  const dismiss = () => {
    localStorage.setItem(LOCAL_IMPORT_DISMISSED_KEY, "1");
    setVisible(false);
  };

  const handleImport = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    setError("");
    try {
      await importLocalDataToSupabase(supabase, user.id, user.email);
      localStorage.setItem(LOCAL_IMPORT_DISMISSED_KEY, "1");
      await reload();
      setVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
      <Upload className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1">
        <p className="font-medium text-foreground">
          Import your existing local data into your account?
        </p>
        <p className="mt-1 text-sm text-muted">
          We found finance data saved in this browser. Import it to your secure cloud account.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={handleImport} disabled={loading}>
            {loading ? "Importing…" : "Import data"}
          </Button>
          <Button size="sm" variant="secondary" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
      <button onClick={dismiss} className="text-muted hover:text-foreground" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
