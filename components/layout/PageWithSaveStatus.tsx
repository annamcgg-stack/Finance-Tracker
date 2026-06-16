"use client";

import { SaveStatusIndicator } from "@/components/SaveStatusIndicator";
import { useFinance } from "@/hooks/useFinanceData";
import { SectionHeader } from "@/components/ui/StatCard";

export function PageWithSaveStatus({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { saveStatus, error } = useFinance();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionHeader title={title} description={description} action={action} />
        <SaveStatusIndicator status={saveStatus} error={error} />
      </div>
      {children}
    </div>
  );
}
