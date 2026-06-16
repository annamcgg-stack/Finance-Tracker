import type { AllocationBucket } from "@/lib/types";
import { isValidUuid } from "@/lib/uuid";

/** Stable frontend keys for default buckets — never persisted to Supabase. */
export const DEFAULT_ALLOCATION_SLUG_BY_NAME: Record<string, string> = {
  Investing: "investing",
  Savings: "savings",
  "Emergency Fund": "emergency",
  "House Deposit": "house",
  Holidays: "holidays",
  "Lifestyle Spending": "lifestyle",
};

export function inferAllocationBucketSlug(
  name: string,
  isDefault: boolean
): string | null {
  if (!isDefault) return null;
  return DEFAULT_ALLOCATION_SLUG_BY_NAME[name] ?? null;
}

export function getAllocationBucketKey(bucket: AllocationBucket): string {
  if (isValidUuid(bucket.id)) return bucket.id;
  if (bucket.slug) return bucket.slug;
  return bucket.id;
}

export function bucketMatchKey(name: string, isDefault: boolean): string {
  return `${isDefault ? "1" : "0"}:${name.trim().toLowerCase()}`;
}

type ExistingAllocationRow = {
  id: string;
  name: string;
  is_default: boolean;
};

export function resolveAllocationBucketDbId(
  bucket: AllocationBucket,
  existingById: Map<string, ExistingAllocationRow>,
  existingByKey: Map<string, string>
): string | undefined {
  if (isValidUuid(bucket.id) && existingById.has(bucket.id)) {
    return bucket.id;
  }
  return existingByKey.get(bucketMatchKey(bucket.name, bucket.isDefault));
}

export function mapAllocationBucketFromRow(row: {
  id: string;
  name: string;
  percentage: number | string;
  is_default: boolean;
  goal_id?: string | null;
}): AllocationBucket {
  const isDefault = row.is_default;
  return {
    id: row.id,
    name: row.name,
    percentage: Number(row.percentage),
    isDefault,
    slug: inferAllocationBucketSlug(row.name, isDefault),
    goalId: isValidUuid(row.goal_id) ? row.goal_id : null,
  };
}

/** Build a Supabase row — never sends slug or non-UUID values in id / goal_id. */
export function buildAllocationBucketDbRow(
  bucket: AllocationBucket,
  userId: string,
  updatedAt: string,
  resolvedId?: string
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    user_id: userId,
    name: bucket.name,
    percentage: bucket.percentage,
    is_default: bucket.isDefault,
    goal_id: isValidUuid(bucket.goalId) ? bucket.goalId : null,
    updated_at: updatedAt,
  };

  const id = resolvedId ?? (isValidUuid(bucket.id) ? bucket.id : undefined);
  if (id) row.id = id;

  return row;
}
