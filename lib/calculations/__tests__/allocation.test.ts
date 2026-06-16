import { describe, it, expect } from "vitest";
import {
  getAllocationTotal,
  isAllocationValid,
  getBucketAllocations,
} from "@/lib/calculations/allocation";
import type { AllocationBucket } from "@/lib/types";

const validBuckets: AllocationBucket[] = [
  { id: "1", name: "Investing", percentage: 50, isDefault: true },
  { id: "2", name: "Savings", percentage: 50, isDefault: true },
];

describe("allocation", () => {
  it("totals percentages", () => {
    expect(getAllocationTotal(validBuckets)).toBe(100);
  });

  it("validates 100% allocation", () => {
    expect(isAllocationValid(validBuckets)).toBe(true);
    expect(isAllocationValid([{ id: "1", name: "A", percentage: 60, isDefault: false }])).toBe(
      false
    );
  });

  it("computes monthly and annual amounts", () => {
    const result = getBucketAllocations(validBuckets, 2000);
    expect(result[0].monthlyAmount).toBe(1000);
    expect(result[0].annualAmount).toBe(12000);
  });
});
