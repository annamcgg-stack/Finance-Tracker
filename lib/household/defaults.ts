import type { ShareableFields, HouseholdActivityEvent } from "@/lib/types";

export const DEFAULT_SHAREABLE: ShareableFields = {
  visibility: "private",
  householdId: null,
  sharedAccountId: null,
};

export const VISIBILITY_LABELS: Record<
  ShareableFields["visibility"],
  { label: string; description: string }
> = {
  private: {
    label: "Private",
    description: "Only you can see this",
  },
  household: {
    label: "Shared with household",
    description: "Visible to partner/family in your household",
  },
  shared_account_only: {
    label: "Shared account only",
    description: "Only shown inside the selected shared account",
  },
};

export const SHARE_CONFIRMATION_MESSAGE =
  "This will make this item visible to members of your household.";

export const UNLINK_CONFIRMATION_MESSAGE =
  "This will remove shared access between these accounts. Your private data will remain yours. Shared household data may remain visible to remaining household members.";

export const HOUSEHOLD_ACTIVITY_LABELS: Record<HouseholdActivityEvent, string> = {
  member_invited: "Member invited",
  member_joined: "Member joined",
  member_removed: "Member removed",
  member_left: "Member left",
  household_deleted: "Household deleted",
  shared_account_created: "Shared account created",
  shared_account_unlinked: "Shared account unlinked",
  ownership_transferred: "Ownership transferred",
};

export const DASHBOARD_VIEW_OPTIONS = [
  { value: "personal" as const, label: "My Finances", description: "Your private data only" },
  {
    value: "shared" as const,
    label: "Shared Finances",
    description: "Shared accounts, expenses, goals, and investments",
  },
  {
    value: "combined" as const,
    label: "Household Combined",
    description: "Your private data plus household-shared items",
  },
];

export const HOUSEHOLD_ROLE_LABELS = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export const SHARED_ACCOUNT_TYPES = [
  { value: "bank" as const, label: "Bank" },
  { value: "savings" as const, label: "Savings" },
  { value: "investment" as const, label: "Investment" },
  { value: "mortgage" as const, label: "Mortgage" },
  { value: "loan" as const, label: "Loan" },
  { value: "property" as const, label: "Property" },
  { value: "other" as const, label: "Other" },
];

export function withShareable<T extends ShareableFields>(item: Omit<T, keyof ShareableFields>): T {
  return { ...DEFAULT_SHAREABLE, ...item } as T;
}
