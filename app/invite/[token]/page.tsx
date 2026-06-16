"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  acceptInvitation,
  completeOnboarding,
  getInvitationByToken,
} from "@/lib/supabase/household-service";
import { useFinance } from "@/hooks/useFinanceData";
import { useHousehold } from "@/hooks/useHousehold";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Field";

export default function InviteAcceptPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();
  const { updateData } = useFinance();
  const { reloadHousehold } = useHousehold();
  const [inviteInfo, setInviteInfo] = useState<{ householdName: string; invitedEmail: string } | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const inv = await getInvitationByToken(supabase, token);
      if (inv) {
        setInviteInfo({ householdName: inv.householdName, invitedEmail: inv.invitedEmail });
      } else {
        setError("This invitation is invalid or has expired.");
      }
    };
    load();
  }, [token]);

  const handleAccept = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      await acceptInvitation(supabase, token);
      await completeOnboarding(supabase, (await supabase.auth.getUser()).data.user!.id);
      updateData({ onboardingCompleted: true });
      await reloadHousehold();
      router.replace("/household");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <Card className="space-y-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Household invitation</h1>
        {inviteInfo ? (
          <>
            <p className="text-sm text-muted">
              You&apos;ve been invited to join <strong>{inviteInfo.householdName}</strong> as{" "}
              {inviteInfo.invitedEmail}.
            </p>
            <p className="text-xs text-muted">
              Shared items will be visible to household members. Your private data stays private.
            </p>
            <Button className="w-full" onClick={handleAccept} disabled={loading}>
              {loading ? "Accepting…" : "Accept invitation"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-red-600">{error || "Loading…"}</p>
        )}
        {error && inviteInfo && <p className="text-sm text-red-600">{error}</p>}
      </Card>
    </div>
  );
}
