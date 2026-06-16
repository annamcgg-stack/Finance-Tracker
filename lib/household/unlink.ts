import type { FinanceData, HouseholdMember, PartnerSharedData, ShareableFields } from "@/lib/types";

export interface OwnerLeaveOptions {
  allowed: boolean;
  requiresTransfer: boolean;
  requiresDelete: boolean;
  reason?: string;
}

/** Active members excluding the given user. */
export function getActiveMembersExcluding(
  members: HouseholdMember[],
  userId: string
): HouseholdMember[] {
  return members.filter((m) => m.status === "active" && m.userId !== userId);
}

/** Members eligible to receive ownership (active, not the current owner). */
export function getOwnershipTransferCandidates(
  members: HouseholdMember[],
  ownerUserId: string
): HouseholdMember[] {
  return members.filter(
    (m) => m.status === "active" && m.userId !== ownerUserId && m.role !== "owner"
  );
}

/** Whether the owner can leave without transferring or deleting. */
export function evaluateOwnerLeave(
  members: HouseholdMember[],
  ownerUserId: string
): OwnerLeaveOptions {
  const otherActive = getActiveMembersExcluding(members, ownerUserId);
  if (otherActive.length === 0) {
    return { allowed: true, requiresTransfer: false, requiresDelete: true };
  }
  return {
    allowed: false,
    requiresTransfer: true,
    requiresDelete: false,
    reason: "Transfer ownership to another member or delete the household before leaving.",
  };
}

/** Non-owners can leave if they are active members. */
export function canMemberLeave(membership: HouseholdMember | null): boolean {
  return membership?.status === "active" && membership.role !== "owner";
}

/** After unlink, removed users must not appear in partner data. */
export function filterPartnerDataByActiveMembers(
  partnerData: PartnerSharedData[],
  activeMemberUserIds: Set<string>
): PartnerSharedData[] {
  return partnerData.filter((p) => activeMemberUserIds.has(p.userId));
}

/** Private data always stays with the user — unchanged on unlink. */
export function retainPrivateDataAfterUnlink(data: FinanceData): FinanceData {
  return {
    ...data,
    dashboardView: "personal",
  };
}

/** Items shared with the household stay linked to the household for remaining members. */
export function sharedItemsRemainWithHousehold<T extends ShareableFields>(
  items: T[],
  householdId: string
): T[] {
  return items.filter(
    (item) =>
      item.householdId === householdId &&
      (item.visibility === "household" || item.visibility === "shared_account_only")
  );
}

/** Removed user loses access to household views — partner data should be empty. */
export function partnerDataAfterRemoval(): PartnerSharedData[] {
  return [];
}

/** Validate ownership transfer target. */
export function validateOwnershipTransfer(
  members: HouseholdMember[],
  fromUserId: string,
  toUserId: string
): { valid: boolean; error?: string } {
  const from = members.find((m) => m.userId === fromUserId);
  const to = members.find((m) => m.userId === toUserId);
  if (!from || from.role !== "owner" || from.status !== "active") {
    return { valid: false, error: "Only the active owner can transfer ownership." };
  }
  if (!to || to.status !== "active") {
    return { valid: false, error: "Target must be an active household member." };
  }
  if (toUserId === fromUserId) {
    return { valid: false, error: "Cannot transfer ownership to yourself." };
  }
  return { valid: true };
}
