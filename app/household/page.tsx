"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, UserMinus, Mail, Check, Unlink, LogOut, History } from "lucide-react";
import { useFinance } from "@/hooks/useFinanceData";
import { useHousehold } from "@/hooks/useHousehold";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  createHousehold,
  renameHousehold,
  inviteToHousehold,
  leaveHousehold,
  removeMember,
  deleteHousehold,
  createSharedAccount,
  completeOnboarding,
  transferOwnership,
  unlinkSharedAccount,
  loadActivityLog,
} from "@/lib/supabase/household-service";
import {
  HOUSEHOLD_ROLE_LABELS,
  SHARED_ACCOUNT_TYPES,
  HOUSEHOLD_ACTIVITY_LABELS,
} from "@/lib/household/defaults";
import {
  evaluateOwnerLeave,
  getOwnershipTransferCandidates,
  canMemberLeave,
} from "@/lib/household/unlink";
import { UnlinkConfirmDialog } from "@/components/household/UnlinkConfirmDialog";
import { SectionHeader, EmptyState } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Button } from "@/components/ui/Field";
import { formatCurrency, formatDate } from "@/lib/format";
import type { SharedAccountType, SharedAccountOwnership, HouseholdActivityLog } from "@/lib/types";

type UnlinkAction =
  | { type: "leave" }
  | { type: "remove"; userId: string; email: string | null }
  | { type: "unlink_account"; accountId: string; accountName: string }
  | { type: "delete_household" }
  | null;

export default function HouseholdPage() {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const { data, updateData } = useFinance();
  const { household, membership, members, sharedAccounts, reloadHousehold } = useHousehold();
  const [householdName, setHouseholdName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountType, setNewAccountType] = useState<SharedAccountType>("bank");
  const [unlinkAction, setUnlinkAction] = useState<UnlinkAction>(null);
  const [transferTargetId, setTransferTargetId] = useState("");
  const [showTransferPanel, setShowTransferPanel] = useState(false);
  const [activityLog, setActivityLog] = useState<HouseholdActivityLog[]>([]);
  const country = data.income.country;
  const fmt = (v: number) => formatCurrency(v, country);

  const isOwner = membership?.role === "owner";
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";
  const ownerLeaveOptions = user ? evaluateOwnerLeave(members, user.id) : null;
  const transferCandidates = user ? getOwnershipTransferCandidates(members, user.id) : [];

  const loadLog = useCallback(async () => {
    if (!household) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const log = await loadActivityLog(supabase, household.id);
      setActivityLog(log);
    } catch {
      setActivityLog([]);
    }
  }, [household]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  const handleCreate = async () => {
    if (!user || !householdName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      await createHousehold(supabase, user.id, householdName.trim());
      await completeOnboarding(supabase, user.id);
      updateData({ onboardingCompleted: true });
      await reloadHousehold();
      setHouseholdName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create household");
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async () => {
    if (!household || !householdName.trim()) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      await renameHousehold(supabase, household.id, householdName.trim());
      await reloadHousehold();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!household || !user || !inviteEmail.trim()) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      const inv = await inviteToHousehold(supabase, household.id, user.id, inviteEmail.trim());
      const link = `${window.location.origin}/invite/${inv.token}`;
      await navigator.clipboard.writeText(link);
      setCopiedToken(inv.token);
      setInviteEmail("");
      await loadLog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite");
    } finally {
      setLoading(false);
    }
  };

  const executeUnlink = async () => {
    if (!household || !user || !unlinkAction) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      if (unlinkAction.type === "leave") {
        await leaveHousehold(supabase, household.id);
        updateData({ dashboardView: "personal" });
      } else if (unlinkAction.type === "remove") {
        await removeMember(supabase, household.id, unlinkAction.userId);
      } else if (unlinkAction.type === "unlink_account") {
        await unlinkSharedAccount(supabase, unlinkAction.accountId);
      } else if (unlinkAction.type === "delete_household") {
        await deleteHousehold(supabase, household.id);
        updateData({ dashboardView: "personal" });
      }

      setUnlinkAction(null);
      await reloadHousehold();
      await loadLog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAndLeave = async () => {
    if (!household || !user || !transferTargetId) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      await transferOwnership(supabase, household.id, transferTargetId);
      await leaveHousehold(supabase, household.id);
      updateData({ dashboardView: "personal" });
      setShowTransferPanel(false);
      setTransferTargetId("");
      await reloadHousehold();
      await loadLog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSharedAccount = async () => {
    if (!household || !user || !newAccountName.trim()) return;
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");
      await createSharedAccount(
        supabase,
        {
          householdId: household.id,
          name: newAccountName.trim(),
          type: newAccountType,
          balance: 0,
          currency: "AUD",
          ownershipType: "shared" as SharedAccountOwnership,
        },
        user.id
      );
      setNewAccountName("");
      await reloadHousehold();
      await loadLog();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add account");
    } finally {
      setLoading(false);
    }
  };

  const unlinkDialogTitle = (() => {
    if (!unlinkAction) return "";
    switch (unlinkAction.type) {
      case "leave":
        return "Leave household";
      case "remove":
        return `Remove ${unlinkAction.email ?? "member"}`;
      case "unlink_account":
        return `Unlink ${unlinkAction.accountName}`;
      case "delete_household":
        return "Delete household";
      default:
        return "Confirm";
    }
  })();

  if (!household) {
    return (
      <div className="space-y-8">
        <SectionHeader
          title="Household"
          description="Link accounts with a partner or family to share selected finances."
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Card className="max-w-md space-y-4 p-6">
          <Field label="Household name">
            <Input
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. Smith Family"
            />
          </Field>
          <Button onClick={handleCreate} disabled={loading || !householdName.trim()}>
            Create household
          </Button>
          <Button variant="secondary" onClick={() => router.push("/onboarding")}>
            Back to onboarding
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title={household.name}
        description="Manage members, shared accounts, and household linking."
      />
      {error && <p className="text-sm text-red-600">{error}</p>}

      <UnlinkConfirmDialog
        open={unlinkAction !== null}
        title={unlinkDialogTitle}
        onConfirm={executeUnlink}
        onCancel={() => setUnlinkAction(null)}
        loading={loading}
        confirmLabel={
          unlinkAction?.type === "delete_household" ? "Delete household" : "Confirm unlink"
        }
      />

      {isAdmin && (
        <Card className="space-y-4 p-6">
          <h3 className="font-medium text-foreground">Rename household</h3>
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-xs"
              defaultValue={household.name}
              onChange={(e) => setHouseholdName(e.target.value)}
            />
            <Button onClick={handleRename} disabled={loading}>
              Save name
            </Button>
          </div>
        </Card>
      )}

      <Card className="space-y-4 p-6">
        <h3 className="font-medium text-foreground">Members</h3>
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{m.email ?? m.userId.slice(0, 8)}</p>
                <p className="text-xs text-muted">
                  {HOUSEHOLD_ROLE_LABELS[m.role]} · {m.status}
                  {m.userId === user?.id && " (you)"}
                </p>
              </div>
              {isAdmin && m.userId !== user?.id && m.status === "active" && m.role !== "owner" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setUnlinkAction({ type: "remove", userId: m.userId, email: m.email })
                  }
                >
                  <UserMinus className="h-4 w-4" /> Remove member
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      {isAdmin && (
        <Card className="space-y-4 p-6">
          <h3 className="flex items-center gap-2 font-medium text-foreground">
            <Mail className="h-4 w-4" /> Invite member
          </h3>
          <div className="flex flex-wrap gap-2">
            <Input
              type="email"
              className="max-w-sm"
              placeholder="partner@email.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Button onClick={handleInvite} disabled={loading || !inviteEmail.trim()}>
              Send invite
            </Button>
          </div>
          {copiedToken && (
            <p className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3 w-3" /> Invite link copied to clipboard
            </p>
          )}
        </Card>
      )}

      <Card className="space-y-4 p-6">
        <h3 className="font-medium text-foreground">Shared accounts</h3>
        {sharedAccounts.length === 0 ? (
          <EmptyState title="No shared accounts" description="Add a joint bank or savings account." />
        ) : (
          <ul className="divide-y divide-border">
            {sharedAccounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted capitalize">
                    {a.type.replace("_", " ")} · {a.ownershipType}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-medium">{fmt(a.balance)}</p>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setUnlinkAction({
                          type: "unlink_account",
                          accountId: a.id,
                          accountName: a.name,
                        })
                      }
                    >
                      <Unlink className="h-4 w-4" /> Unlink
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {isAdmin && (
          <div className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <Field label="Account name">
              <Input value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} />
            </Field>
            <Field label="Type">
              <Select
                value={newAccountType}
                onChange={(e) => setNewAccountType(e.target.value as SharedAccountType)}
              >
                {SHARED_ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={handleAddSharedAccount} disabled={!newAccountName.trim()}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="flex items-center gap-2 font-medium text-foreground">
          <History className="h-4 w-4" /> Activity log
        </h3>
        {activityLog.length === 0 ? (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {activityLog.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-surface-elevated px-3 py-2 text-sm">
                <span className="font-medium">{HOUSEHOLD_ACTIVITY_LABELS[entry.eventType]}</span>
                {entry.metadata.account_name != null && (
                  <span className="text-muted"> — {String(entry.metadata.account_name)}</span>
                )}
                {entry.metadata.invited_email != null && (
                  <span className="text-muted"> — {String(entry.metadata.invited_email)}</span>
                )}
                <p className="text-xs text-muted">{formatDate(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="font-medium text-foreground">Unlink & leave</h3>
        <p className="text-sm text-muted">
          Your private data stays with you. Shared household data may remain visible to remaining
          members as historical records.
        </p>

        {canMemberLeave(membership) && (
          <Button
            variant="secondary"
            onClick={() => setUnlinkAction({ type: "leave" })}
            disabled={loading}
          >
            <LogOut className="h-4 w-4" /> Leave household
          </Button>
        )}

        {isOwner && ownerLeaveOptions?.requiresTransfer && (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {ownerLeaveOptions.reason}
            </p>
            {!showTransferPanel ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setShowTransferPanel(true)}>
                  Transfer ownership & leave
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setUnlinkAction({ type: "delete_household" })}
                >
                  <Trash2 className="h-4 w-4" /> Delete household
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Field label="Transfer ownership to">
                  <Select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                  >
                    <option value="">Select member…</option>
                    {transferCandidates.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.email ?? m.userId.slice(0, 8)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="flex gap-2">
                  <Button
                    onClick={handleTransferAndLeave}
                    disabled={loading || !transferTargetId}
                  >
                    Transfer & unlink my account
                  </Button>
                  <Button variant="secondary" onClick={() => setShowTransferPanel(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {isOwner && ownerLeaveOptions?.requiresDelete && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setUnlinkAction({ type: "leave" })}
              disabled={loading}
            >
              <Unlink className="h-4 w-4" /> Unlink account (delete empty household)
            </Button>
            <Button
              variant="danger"
              onClick={() => setUnlinkAction({ type: "delete_household" })}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4" /> Delete household
            </Button>
          </div>
        )}

        {!isOwner && membership?.status === "active" && (
          <Button
            variant="ghost"
            onClick={() => setUnlinkAction({ type: "leave" })}
            disabled={loading}
          >
            <Unlink className="h-4 w-4" /> Unlink account
          </Button>
        )}
      </Card>
    </div>
  );
}
