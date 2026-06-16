import { describe, it, expect } from "vitest";
import { DEFAULT_ALLOCATION_BUCKETS } from "@/lib/constants";
import {
  buildAllocationBucketDbRow,
  getAllocationBucketKey,
  inferAllocationBucketSlug,
  mapAllocationBucketFromRow,
} from "@/lib/allocation/buckets";
import { isValidUuid } from "@/lib/uuid";

describe("allocation bucket persistence", () => {
  it("does not send default bucket slugs to UUID columns", () => {
    for (const bucket of DEFAULT_ALLOCATION_BUCKETS) {
      expect(bucket.slug).toBeTruthy();
      expect(isValidUuid(bucket.id)).toBe(false);

      const row = buildAllocationBucketDbRow(bucket, "550e8400-e29b-41d4-a716-446655440000", "2026-01-01T00:00:00.000Z");

      expect(row.id).toBeUndefined();
      expect(row.goal_id).toBeNull();
      expect(row).not.toHaveProperty("slug");
      expect(row.user_id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(row.name).toBe(bucket.name);
    }
  });

  it("includes id only when it is a valid UUID", () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const row = buildAllocationBucketDbRow(
      {
        id: uuid,
        slug: "investing",
        name: "Investing",
        percentage: 30,
        isDefault: true,
      },
      uuid,
      "2026-01-01T00:00:00.000Z"
    );
    expect(row.id).toBe(uuid);
  });

  it("nulls invalid goal_id values", () => {
    const row = buildAllocationBucketDbRow(
      {
        id: "",
        slug: "investing",
        name: "Investing",
        percentage: 30,
        isDefault: true,
        goalId: "not-a-uuid",
      },
      "550e8400-e29b-41d4-a716-446655440000",
      "2026-01-01T00:00:00.000Z"
    );
    expect(row.goal_id).toBeNull();
  });

  it("uses slug as client key before a database id exists", () => {
    const bucket = DEFAULT_ALLOCATION_BUCKETS[0];
    expect(getAllocationBucketKey(bucket)).toBe(bucket.slug);
  });

  it("maps database rows and restores default slugs", () => {
    const mapped = mapAllocationBucketFromRow({
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Investing",
      percentage: 30,
      is_default: true,
      goal_id: "invalid-slug",
    });
    expect(mapped.id).toBe("550e8400-e29b-41d4-a716-446655440001");
    expect(mapped.slug).toBe("investing");
    expect(mapped.goalId).toBeNull();
    expect(inferAllocationBucketSlug("Investing", true)).toBe("investing");
  });
});
