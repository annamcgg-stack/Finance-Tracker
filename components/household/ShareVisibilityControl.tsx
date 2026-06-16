"use client";

import { useState } from "react";
import type { DataVisibility } from "@/lib/types";
import { Field, Select, Button } from "@/components/ui/Field";
import { VisibilityBadge } from "./VisibilityBadge";
import { SHARE_CONFIRMATION_MESSAGE } from "@/lib/household/defaults";

type ShareVisibilityControlProps = {
  visibility: DataVisibility;
  householdId: string | null;
  activeHouseholdId: string | null;
  onChange: (visibility: DataVisibility, householdId: string | null) => void;
  disabled?: boolean;
};

export function ShareVisibilityControl({
  visibility,
  householdId,
  activeHouseholdId,
  onChange,
  disabled,
}: ShareVisibilityControlProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingVisibility, setPendingVisibility] = useState<DataVisibility | null>(null);

  const handleSelect = (value: DataVisibility) => {
    if (value === visibility) return;
    if (value !== "private" && activeHouseholdId) {
      setPendingVisibility(value);
      setConfirmOpen(true);
      return;
    }
    onChange(value, value === "private" ? null : householdId);
  };

  const confirmShare = () => {
    if (pendingVisibility && activeHouseholdId) {
      onChange(pendingVisibility, activeHouseholdId);
    }
    setConfirmOpen(false);
    setPendingVisibility(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Field label="Visibility" className="flex-1">
          <Select
            value={visibility}
            onChange={(e) => handleSelect(e.target.value as DataVisibility)}
            disabled={disabled || (!activeHouseholdId && visibility === "private")}
          >
            <option value="private">Private</option>
            {activeHouseholdId && (
              <>
                <option value="household">Shared with household</option>
                <option value="shared_account_only">Shared account only</option>
              </>
            )}
          </Select>
        </Field>
        <VisibilityBadge visibility={visibility} />
      </div>

      {confirmOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-200">{SHARE_CONFIRMATION_MESSAGE}</p>
          <div className="mt-2 flex gap-2">
            <Button type="button" onClick={confirmShare}>
              Confirm
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false);
                setPendingVisibility(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
