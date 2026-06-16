import type {
  AllocationBucket,
  CountryCode,
  ExpenseCategory,
  FinanceData,
  GoalType,
  ScenarioType,
} from "./types";

export const STORAGE_KEY = "wealthplan-data-v1";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "rent_mortgage", label: "Rent / Mortgage" },
  { value: "utilities", label: "Utilities" },
  { value: "internet", label: "Internet" },
  { value: "phone", label: "Phone" },
  { value: "insurance", label: "Insurance" },
  { value: "car", label: "Car" },
  { value: "fuel", label: "Fuel" },
  { value: "public_transport", label: "Public Transport" },
  { value: "debt", label: "Debt" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "health", label: "Health" },
  { value: "other", label: "Other" },
];

export const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: "house_deposit", label: "House Deposit" },
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "holiday", label: "Holiday" },
  { value: "car", label: "Car" },
  { value: "investment_portfolio", label: "Investment Portfolio" },
  { value: "education", label: "Education" },
  { value: "custom", label: "Custom" },
];

export const COUNTRIES: { code: CountryCode; label: string; currency: string; symbol: string }[] = [
  { code: "AU", label: "Australia", currency: "AUD", symbol: "$" },
  { code: "NZ", label: "New Zealand", currency: "NZD", symbol: "$" },
  { code: "GB", label: "United Kingdom", currency: "GBP", symbol: "£" },
  { code: "US", label: "United States", currency: "USD", symbol: "$" },
];

export const AU_STATES = [
  { code: "NSW", label: "New South Wales" },
  { code: "VIC", label: "Victoria" },
  { code: "QLD", label: "Queensland" },
  { code: "WA", label: "Western Australia" },
  { code: "SA", label: "South Australia" },
  { code: "TAS", label: "Tasmania" },
  { code: "ACT", label: "Australian Capital Territory" },
  { code: "NT", label: "Northern Territory" },
];

export const US_STATES = [
  { code: "CA", label: "California" },
  { code: "NY", label: "New York" },
  { code: "TX", label: "Texas" },
  { code: "FL", label: "Florida" },
  { code: "WA", label: "Washington" },
  { code: "IL", label: "Illinois" },
  { code: "OTHER", label: "Other" },
];

export const DEFAULT_ALLOCATION_BUCKETS: AllocationBucket[] = [
  { id: "investing", name: "Investing", percentage: 30, isDefault: true },
  { id: "savings", name: "Savings", percentage: 20, isDefault: true },
  { id: "emergency", name: "Emergency Fund", percentage: 15, isDefault: true },
  { id: "house", name: "House Deposit", percentage: 20, isDefault: true },
  { id: "holidays", name: "Holidays", percentage: 10, isDefault: true },
  { id: "lifestyle", name: "Lifestyle Spending", percentage: 5, isDefault: true },
];

export const SCENARIO_TYPES: { value: ScenarioType; label: string; unit: string }[] = [
  { value: "salary_increase", label: "Salary Increase", unit: "$/year" },
  { value: "salary_decrease", label: "Salary Decrease", unit: "$/year" },
  { value: "higher_rent", label: "Higher Rent", unit: "$/month" },
  { value: "new_mortgage", label: "New Mortgage", unit: "$/month" },
  { value: "increased_investment", label: "Increased Investment", unit: "$/month" },
  { value: "reduced_spending", label: "Reduced Spending", unit: "$/month" },
];

export const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#A855F7",
];

export const DEFAULT_FINANCE_DATA: FinanceData = {
  version: 1,
  income: {
    salary: 95000,
    payFrequency: "annual",
    country: "AU",
    stateProvince: "NSW",
    includeMedicareLevy: true,
    salarySacrifice: 0,
    superContribution: 0,
  },
  expenses: [
    { id: "exp-rent", name: "Rent", category: "rent_mortgage", amount: 2200, frequency: "monthly", active: true },
    { id: "exp-util", name: "Utilities", category: "utilities", amount: 180, frequency: "monthly", active: true },
    { id: "exp-internet", name: "Internet", category: "internet", amount: 80, frequency: "monthly", active: true },
    { id: "exp-phone", name: "Mobile Phone", category: "phone", amount: 55, frequency: "monthly", active: true },
    { id: "exp-insurance", name: "Car Insurance", category: "insurance", amount: 1200, frequency: "annually", active: true },
    { id: "exp-sub", name: "Subscriptions", category: "subscriptions", amount: 45, frequency: "monthly", active: true },
  ],
  sinkingFunds: [
    { id: "sf-rego", name: "Car Registration", annualTarget: 800, currentBalance: 400 },
    { id: "sf-xmas", name: "Christmas", annualTarget: 1500, currentBalance: 600 },
    { id: "sf-travel", name: "Travel", annualTarget: 3000, currentBalance: 1200 },
  ],
  allocationBuckets: DEFAULT_ALLOCATION_BUCKETS,
  goals: [
    {
      id: "goal-ef",
      name: "Emergency Fund",
      type: "emergency_fund",
      targetAmount: 30000,
      currentAmount: 15000,
      monthlyContribution: 800,
      targetDate: "2027-06-01",
    },
    {
      id: "goal-hol",
      name: "Europe Trip",
      type: "holiday",
      targetAmount: 8000,
      currentAmount: 2500,
      monthlyContribution: 400,
      targetDate: "2026-12-01",
    },
  ],
  houseDeposit: {
    propertyPrice: 750000,
    depositPercent: 20,
    currentSavings: 50000,
    monthlyContribution: 2000,
    annualReturn: 4,
  },
  investmentProjection: {
    currentValue: 25000,
    monthlyContribution: 1000,
    annualReturn: 7,
    timeHorizonYears: 20,
  },
  assets: [
    { id: "cash-1", name: "Everyday Account", type: "cash", value: 5000 },
    { id: "savings-1", name: "High Interest Savings", type: "savings", value: 15000 },
    { id: "shares-1", name: "ETF Portfolio", type: "shares_etfs", value: 25000 },
    { id: "super-1", name: "Superannuation", type: "superannuation", value: 85000 },
  ],
  liabilities: [
    { id: "hecs-1", name: "HECS/HELP", type: "hecs_help", value: 12000 },
  ],
  netWorthSnapshots: [],
  scenarios: [],
  investmentHoldings: [],
  mortgageAccounts: [],
  mortgageExtraPayments: [],
  emergencyFundBalance: 15000,
  darkMode: false,
};

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/income", label: "Income & Tax", icon: "Wallet" },
  { href: "/expenses", label: "Fixed Expenses", icon: "Receipt" },
  { href: "/sinking-funds", label: "Sinking Funds", icon: "PiggyBank" },
  { href: "/cashflow", label: "Cashflow", icon: "TrendingUp" },
  { href: "/allocation", label: "Allocation", icon: "PieChart" },
  { href: "/goals", label: "Goals", icon: "Target" },
  { href: "/house-deposit", label: "House Deposit", icon: "Home" },
  { href: "/emergency-fund", label: "Emergency Fund", icon: "Shield" },
  { href: "/investments", label: "Projections", icon: "LineChart" },
  { href: "/portfolio", label: "Portfolio", icon: "TrendingUp" },
  { href: "/mortgage", label: "Mortgage", icon: "Building2" },
  { href: "/net-worth", label: "Net Worth", icon: "Landmark" },
  { href: "/scenarios", label: "Scenarios", icon: "FlaskConical" },
  { href: "/settings", label: "Data", icon: "Database" },
] as const;
