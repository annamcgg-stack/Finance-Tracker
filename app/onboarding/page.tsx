"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Users, Link2 } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { getSupabaseClient } from "@/lib/supabase/client";
import { createHousehold, completeOnboarding } from "@/lib/supabase/household-service";
import { Card } from "@/components/ui/Card";
import { Field, Input, Button } from "@/components/ui/Field";

type Choice = "individual" | "create" | "join" | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const { updateData } = useFinance();
  const [choice, setChoice] = useState<Choice>(null);
  const [householdName, setHouseholdName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finishIndividual = async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) throw new Error("Not signed in");
      await completeOnboarding(supabase, user.id);
      updateData({ onboardingCompleted: true });
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const finishCreate = async () => {
    if (!householdName.trim() || !user) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      await createHousehold(supabase, user.id, householdName.trim());
      await completeOnboarding(supabase, user.id);
      updateData({ onboardingCompleted: true });
      router.replace("/household");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create household");
    } finally {
      setLoading(false);
    }
  };

  const finishJoin = () => {
    const token = inviteToken.trim();
    if (!token) return;
    router.push(`/invite/${token}`);
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Welcome to WealthPlan</h1>
        <p className="mt-2 text-sm text-muted">
          How would you like to use the app?
        </p>
      </div>

      {!choice && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setChoice("individual")}
            className="flex w-full items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/50"
          >
            <User className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Use individually</p>
              <p className="text-sm text-muted">Keep all finances private to your account</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setChoice("create")}
            className="flex w-full items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/50"
          >
            <Users className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Create a household</p>
              <p className="text-sm text-muted">Share selected finances with a partner or family</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setChoice("join")}
            className="flex w-full items-start gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/50"
          >
            <Link2 className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Join with invite link</p>
              <p className="text-sm text-muted">Accept an invitation from someone who invited you</p>
            </div>
          </button>
        </div>
      )}

      {choice === "individual" && (
        <Card className="space-y-4 p-6">
          <p className="text-sm text-muted">
            Your data stays private by default. You can create or join a household later from the
            Household section.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setChoice(null)}>
              Back
            </Button>
            <Button onClick={finishIndividual} disabled={loading}>
              Continue
            </Button>
          </div>
        </Card>
      )}

      {choice === "create" && (
        <Card className="space-y-4 p-6">
          <Field label="Household name">
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. Smith Family"
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setChoice(null)}>
              Back
            </Button>
            <Button onClick={finishCreate} disabled={loading || !householdName.trim()}>
              Create & continue
            </Button>
          </div>
        </Card>
      )}

      {choice === "join" && (
        <Card className="space-y-4 p-6">
          <Field label="Invite token or link" hint="Paste the token from your invite link">
            <Input
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Paste invite token"
            />
          </Field>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setChoice(null)}>
              Back
            </Button>
            <Button onClick={finishJoin} disabled={!inviteToken.trim()}>
              Continue
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
