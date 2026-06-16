export type PayFrequency = "annual" | "monthly" | "fortnightly" | "weekly";
export type ExpenseFrequency = "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually";

export type CountryCode = "AU" | "NZ" | "SG" | "CA" | "GB" | "US";
export type ResidencyStatus = "resident" | "non_resident";
export type UsFilingStatus = "single" | "married_joint" | "married_separate" | "head_of_household";
export type UkRegion = "ENG" | "SCT" | "WLS";

export type ExpenseCategory =
  | "rent_mortgage"
  | "utilities"
  | "internet"
  | "phone"
  | "insurance"
  | "car"
  | "fuel"
  | "public_transport"
  | "debt"
  | "subscriptions"
  | "health"
  | "other";

export type GoalType =
  | "house_deposit"
  | "emergency_fund"
  | "holiday"
  | "car"
  | "investment_portfolio"
  | "education"
  | "wedding"
  | "renovation"
  | "custom";

export type DataVisibility = "private" | "household" | "shared_account_only";
export type DashboardViewMode = "personal" | "shared" | "combined";
export type HouseholdRole = "owner" | "admin" | "member";
export type HouseholdMemberStatus = "invited" | "active" | "removed";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";
export type SharedAccountType =
  | "bank"
  | "savings"
  | "investment"
  | "mortgage"
  | "loan"
  | "property"
  | "other";
export type SharedAccountOwnership = "shared" | "mine" | "partner";
export type ExpenseSplitType = "50_50" | "percentage" | "custom";

export type AssetType =
  | "cash"
  | "savings"
  | "shares_etfs"
  | "superannuation"
  | "property"
  | "vehicles"
  | "other";

export type LiabilityType =
  | "credit_cards"
  | "personal_loans"
  | "hecs_help"
  | "car_loans"
  | "mortgage"
  | "other";

export type ScenarioType =
  | "salary_increase"
  | "salary_decrease"
  | "higher_rent"
  | "new_mortgage"
  | "increased_investment"
  | "reduced_spending";

export interface IncomeSettings {
  salary: number;
  payFrequency: PayFrequency;
  country: CountryCode;
  stateProvince: string;
  taxYear: string;
  includeMedicareLevy: boolean;
  salarySacrifice: number;
  superContribution: number;
  includeAccLevy: boolean;
  residencyStatus: ResidencyStatus;
  includeCpp: boolean;
  includeEi: boolean;
  ukRegion: UkRegion;
  includeNationalInsurance: boolean;
  usFilingStatus: UsFilingStatus;
}

export interface ShareableFields {
  visibility: DataVisibility;
  householdId: string | null;
  sharedAccountId: string | null;
  ownerUserId?: string;
}

export interface FixedExpense extends ShareableFields {
  id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  frequency: ExpenseFrequency;
  active: boolean;
  splitType: ExpenseSplitType;
  userContributionAmount: number;
  partnerContributionAmount: number;
  userContributionPercent: number;
}

export interface SinkingFund extends ShareableFields {
  id: string;
  name: string;
  annualTarget: number;
  currentBalance: number;
}

export interface AllocationBucket {
  id: string;
  name: string;
  percentage: number;
  isDefault: boolean;
}

export interface FinancialGoal extends ShareableFields {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  userContributionAmount: number;
  partnerContributionAmount: number;
}

export interface HouseDepositPlan {
  propertyPrice: number;
  depositPercent: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturn: number;
}

export interface InvestmentProjectionSettings {
  currentValue: number;
  monthlyContribution: number;
  annualReturn: number;
  timeHorizonYears: number;
}

export interface Asset extends ShareableFields {
  id: string;
  name: string;
  type: AssetType;
  value: number;
}

export interface Liability extends ShareableFields {
  id: string;
  name: string;
  type: LiabilityType;
  value: number;
}

export interface NetWorthSnapshot {
  id: string;
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export type RepaymentFrequency = "weekly" | "fortnightly" | "monthly";
export type RateType = "fixed" | "variable";
export type ExtraPaymentFrequency = "weekly" | "fortnightly" | "monthly";

export interface InvestmentHolding extends ShareableFields {
  id: string;
  ticker: string;
  exchange: string;
  stockName: string;
  country: string;
  currency: string;
  shares: number;
  averagePurchasePrice: number;
  purchaseDate: string;
  latestPrice: number | null;
  latestPriceUpdatedAt: string | null;
  sector: string | null;
  notes: string;
  ownershipPercent: number;
  userContributionAmount: number;
  partnerContributionAmount: number;
}

export interface MortgageAccount extends ShareableFields {
  id: string;
  propertyName: string;
  propertyValue: number;
  loanAmount: number;
  currentBalance: number;
  interestRate: number;
  loanTermYears: number;
  repaymentFrequency: RepaymentFrequency;
  regularRepaymentAmount: number;
  loanStartDate: string;
  rateType: RateType;
  offsetBalance: number;
  ownershipSplitPercent: number;
  userRepaymentContribution: number;
  partnerRepaymentContribution: number;
}

export interface MortgageExtraPayment {
  id: string;
  mortgageAccountId: string;
  amount: number;
  frequency: ExtraPaymentFrequency;
  startDate: string;
  endDate: string | null;
  paidByUserId: string | null;
}

export interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  value: number;
  enabled: boolean;
}

export interface FinanceData {
  version: number;
  income: IncomeSettings;
  expenses: FixedExpense[];
  sinkingFunds: SinkingFund[];
  allocationBuckets: AllocationBucket[];
  goals: FinancialGoal[];
  houseDeposit: HouseDepositPlan;
  investmentProjection: InvestmentProjectionSettings;
  assets: Asset[];
  liabilities: Liability[];
  netWorthSnapshots: NetWorthSnapshot[];
  scenarios: Scenario[];
  investmentHoldings: InvestmentHolding[];
  mortgageAccounts: MortgageAccount[];
  mortgageExtraPayments: MortgageExtraPayment[];
  emergencyFundBalance: number;
  darkMode: boolean;
  onboardingCompleted: boolean;
  dashboardView: DashboardViewMode;
}

export interface Household {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  email: string | null;
  role: HouseholdRole;
  status: HouseholdMemberStatus;
  createdAt: string;
}

export interface SharedAccount {
  id: string;
  householdId: string;
  name: string;
  type: SharedAccountType;
  balance: number;
  currency: string;
  ownershipType: SharedAccountOwnership;
}

export interface HouseholdInvitation {
  id: string;
  householdId: string;
  invitedEmail: string;
  invitedBy: string;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export type HouseholdActivityEvent =
  | "member_invited"
  | "member_joined"
  | "member_removed"
  | "member_left"
  | "household_deleted"
  | "shared_account_created"
  | "shared_account_unlinked"
  | "ownership_transferred";

export interface HouseholdActivityLog {
  id: string;
  householdId: string;
  actorUserId: string;
  eventType: HouseholdActivityEvent;
  targetUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PartnerSharedData {
  userId: string;
  email: string | null;
  expenses: FixedExpense[];
  goals: FinancialGoal[];
  investmentHoldings: InvestmentHolding[];
  mortgageAccounts: MortgageAccount[];
  mortgageExtraPayments: MortgageExtraPayment[];
  assets: Asset[];
  liabilities: Liability[];
  sinkingFunds: SinkingFund[];
}

export interface HoldingWithQuote extends InvestmentHolding {
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealisedGainLoss: number;
  unrealisedGainLossPercent: number;
  dailyChange: number;
  dailyChangePercent: number;
  priceIsStale: boolean;
}

export interface TaxResult {
  grossIncome: number;
  taxableIncome: number;
  incomeTax: number;
  deductions: number;
  totalTaxDeductions: number;
  taxPayable: number;
  medicareLevy: number;
  stateTax: number;
  netIncome: number;
  monthlyTakeHome: number;
  fortnightlyTakeHome: number;
  weeklyTakeHome: number;
  effectiveTaxRate: number;
  marginalTaxRate: number;
  warnings: string[];
  estimateDisclaimer: string;
}
