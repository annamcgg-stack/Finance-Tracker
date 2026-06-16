"use client";

import { WifiOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Field";

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="max-w-md space-y-4 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <WifiOff className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">You&apos;re offline</h1>
        <p className="text-sm text-muted">
          Finance Tracker needs an internet connection to load and sync your data. Your private
          information on this device remains secure.
        </p>
        <Button type="button" className="w-full" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
