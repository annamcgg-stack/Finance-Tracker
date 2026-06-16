export interface EmergencyFundResult {
  threeMonths: number;
  sixMonths: number;
  twelveMonths: number;
  recommended: number;
  currentBalance: number;
  coverageMonths: number;
  progress: number;
}

export function calculateEmergencyFund(
  monthlyExpenses: number,
  currentBalance: number
): EmergencyFundResult {
  const threeMonths = monthlyExpenses * 3;
  const sixMonths = monthlyExpenses * 6;
  const twelveMonths = monthlyExpenses * 12;
  const recommended = sixMonths;
  const coverageMonths =
    monthlyExpenses > 0 ? currentBalance / monthlyExpenses : 0;
  const progress =
    recommended > 0 ? Math.min(100, (currentBalance / recommended) * 100) : 0;

  return {
    threeMonths,
    sixMonths,
    twelveMonths,
    recommended,
    currentBalance,
    coverageMonths,
    progress,
  };
}
