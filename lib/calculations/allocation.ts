import type { AllocationBucket } from "../types";

export function getAllocationTotal(buckets: AllocationBucket[]): number {
  return buckets.reduce((sum, b) => sum + b.percentage, 0);
}

export function isAllocationValid(buckets: AllocationBucket[]): boolean {
  return Math.abs(getAllocationTotal(buckets) - 100) < 0.01;
}

export function getBucketAllocations(buckets: AllocationBucket[], monthlySurplus: number) {
  return buckets.map((bucket) => ({
    ...bucket,
    monthlyAmount: (bucket.percentage / 100) * monthlySurplus,
    annualAmount: (bucket.percentage / 100) * monthlySurplus * 12,
  }));
}

export function getInvestingAllocation(
  buckets: AllocationBucket[],
  monthlySurplus: number
): number {
  const investing = buckets.find(
    (b) => b.slug === "investing" || b.name.toLowerCase().includes("invest")
  );
  if (!investing) return 0;
  return (investing.percentage / 100) * monthlySurplus * 12;
}
