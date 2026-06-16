import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPTY_FINANCE_DATA, DEFAULT_ALLOCATION_BUCKETS } from "@/lib/constants";
import {
  dbModeToDashboardView,
  dashboardViewToDbMode,
} from "@/lib/profile/preferences";
import { parseSetupCompleted } from "@/lib/profile/setup";
import type {
  FinanceData,
  FixedExpense,
  SinkingFund,
  AllocationBucket,
  FinancialGoal,
  FinancialHealthSnapshot,
  Asset,
  Liability,
  NetWorthSnapshot,
  Scenario,
  InvestmentHolding,
  MortgageAccount,
  MortgageExtraPayment,
  HouseDepositPlan,
  InvestmentProjectionSettings,
  DataVisibility,
  ExpenseSplitType,
  DashboardViewMode,
  SetupChoice,
} from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import {
  bucketMatchKey,
  buildAllocationBucketDbRow,
  mapAllocationBucketFromRow,
  resolveAllocationBucketDbId,
} from "@/lib/allocation/buckets";

function now() {
  return new Date().toISOString();
}

function mapShareable(row: Record<string, unknown>) {
  return {
    visibility: (row.visibility as DataVisibility) ?? DEFAULT_SHAREABLE.visibility,
    householdId: (row.household_id as string) ?? null,
    sharedAccountId: (row.shared_account_id as string) ?? null,
  };
}

function assertNoError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

function mapIncomeFromRow(
  income: Record<string, unknown> | null | undefined
): FinanceData["income"] {
  if (!income) return { ...EMPTY_FINANCE_DATA.income };
  const taxOptions = (income.tax_options ?? {}) as Record<string, unknown>;
  return {
    salary: Number(income.salary),
    payFrequency: income.pay_frequency as FinanceData["income"]["payFrequency"],
    country: income.country as FinanceData["income"]["country"],
    stateProvince: String(income.state_province ?? "NSW"),
    taxYear: String(taxOptions.taxYear ?? EMPTY_FINANCE_DATA.income.taxYear),
    includeMedicareLevy: Boolean(income.include_medicare_levy),
    salarySacrifice: Number(income.salary_sacrifice),
    superContribution: Number(income.super_contribution),
    includeAccLevy: Boolean(taxOptions.includeAccLevy ?? true),
    residencyStatus: (taxOptions.residencyStatus as FinanceData["income"]["residencyStatus"]) ?? "resident",
    includeCpp: Boolean(taxOptions.includeCpp ?? true),
    includeEi: Boolean(taxOptions.includeEi ?? true),
    ukRegion: (taxOptions.ukRegion as FinanceData["income"]["ukRegion"]) ?? "ENG",
    includeNationalInsurance: Boolean(taxOptions.includeNationalInsurance ?? true),
    usFilingStatus: (taxOptions.usFilingStatus as FinanceData["income"]["usFilingStatus"]) ?? "single",
  };
}

export type ProfileSetupState = {
  profile: Record<string, unknown> | null;
  setupCompleted: boolean;
  setupChoice: SetupChoice | null;
  onboardingCompleted: boolean;
  dashboardView: DashboardViewMode;
  householdId: string | null;
};

/** Load profile onboarding flags independently of full finance data. */
export async function loadProfileSetupState(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileSetupState> {
  const [profileRes, memberRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("household_members")
      .select("household_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle(),
  ]);

  assertNoError(profileRes.error, "profiles setup load");

  const profileRecord = profileRes.data as Record<string, unknown> | null;
  const householdId = (memberRes.data?.household_id as string | undefined) ?? null;
  const setupCompleted = parseSetupCompleted(profileRecord);

  console.log("[FinanceTracker Debug] raw profile row from Supabase", {
    userId,
    profileRow: profileRecord,
    setup_completed: profileRecord?.setup_completed ?? null,
    setup_choice: profileRecord?.setup_choice ?? null,
    onboarding_completed: profileRecord?.onboarding_completed ?? null,
    household_id: householdId,
    memberLoadError: memberRes.error?.message ?? null,
    parseSetupCompletedResult: setupCompleted,
  });

  return {
    profile: profileRecord,
    setupCompleted,
    setupChoice: (profileRecord?.setup_choice as SetupChoice | null) ?? null,
    onboardingCompleted: setupCompleted,
    dashboardView: dbModeToDashboardView(
      (profileRecord?.default_dashboard_mode ?? profileRecord?.dashboard_view) as string | undefined
    ),
    householdId,
  };
}

export async function loadFinanceDataFromSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<FinanceData> {
  const [
    profileRes,
    incomeRes,
    expensesRes,
    sinkingRes,
    bucketsRes,
    goalsRes,
    assetsRes,
    liabilitiesRes,
    snapshotsRes,
    healthRes,
    scenariosRes,
    holdingsRes,
    mortgagesRes,
    extraPaymentsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("income_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("fixed_expenses").select("*").eq("user_id", userId),
    supabase.from("sinking_funds").select("*").eq("user_id", userId),
    supabase.from("allocation_buckets").select("*").eq("user_id", userId),
    supabase.from("financial_goals").select("*").eq("user_id", userId),
    supabase.from("assets").select("*").eq("user_id", userId),
    supabase.from("liabilities").select("*").eq("user_id", userId),
    supabase.from("net_worth_snapshots").select("*").eq("user_id", userId),
    supabase.from("financial_health_snapshots").select("*").eq("user_id", userId),
    supabase.from("scenarios").select("*").eq("user_id", userId),
    supabase.from("investment_holdings").select("*").eq("user_id", userId),
    supabase.from("mortgage_accounts").select("*").eq("user_id", userId),
    supabase.from("mortgage_extra_payments").select("*").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const income = incomeRes.data;

  assertNoError(profileRes.error, "profiles load");
  assertNoError(incomeRes.error, "income_settings load");
  assertNoError(expensesRes.error, "fixed_expenses load");
  assertNoError(sinkingRes.error, "sinking_funds load");
  assertNoError(bucketsRes.error, "allocation_buckets load");
  assertNoError(goalsRes.error, "financial_goals load");
  assertNoError(assetsRes.error, "assets load");
  assertNoError(liabilitiesRes.error, "liabilities load");
  assertNoError(snapshotsRes.error, "net_worth_snapshots load");
  assertNoError(healthRes.error, "financial_health_snapshots load");
  assertNoError(scenariosRes.error, "scenarios load");
  assertNoError(holdingsRes.error, "investment_holdings load");
  assertNoError(mortgagesRes.error, "mortgage_accounts load");
  assertNoError(extraPaymentsRes.error, "mortgage_extra_payments load");

  const incomeSettings = mapIncomeFromRow(income);

  const houseDeposit: HouseDepositPlan = profile
    ? {
        propertyPrice: Number(profile.house_property_price),
        depositPercent: Number(profile.house_deposit_percent),
        currentSavings: Number(profile.house_current_savings),
        monthlyContribution: Number(profile.house_monthly_contribution),
        annualReturn: Number(profile.house_annual_return),
      }
    : { ...EMPTY_FINANCE_DATA.houseDeposit };

  const investmentProjection: InvestmentProjectionSettings = profile
    ? {
        currentValue: Number(profile.inv_current_value),
        monthlyContribution: Number(profile.inv_monthly_contribution),
        annualReturn: Number(profile.inv_annual_return),
        timeHorizonYears: Number(profile.inv_time_horizon_years),
      }
    : { ...EMPTY_FINANCE_DATA.investmentProjection };

  const profileRecord = profile as Record<string, unknown> | null;
  const setupCompleted = parseSetupCompleted(profileRecord);
  const setupChoice = (profileRecord?.setup_choice as SetupChoice | null) ?? null;
  const onboardingCompleted = setupCompleted;
  const dashboardView = dbModeToDashboardView(
    (profileRecord?.default_dashboard_mode ?? profileRecord?.dashboard_view) as string | undefined
  );

  const expenses: FixedExpense[] = (expensesRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as FixedExpense["category"],
    amount: Number(r.amount),
    frequency: r.frequency as FixedExpense["frequency"],
    active: r.active,
    splitType: (r.split_type as ExpenseSplitType) ?? "50_50",
    userContributionAmount: Number(r.user_contribution_amount ?? 0),
    partnerContributionAmount: Number(r.partner_contribution_amount ?? 0),
    userContributionPercent: Number(r.user_contribution_percent ?? 50),
    ...mapShareable(r),
  }));

  const sinkingFunds: SinkingFund[] = (sinkingRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    annualTarget: Number(r.annual_target),
    currentBalance: Number(r.current_balance),
    ...mapShareable(r),
  }));

  const allocationBuckets: AllocationBucket[] =
    (bucketsRes.data ?? []).length > 0
      ? bucketsRes.data!.map((r) => mapAllocationBucketFromRow(r))
      : [...DEFAULT_ALLOCATION_BUCKETS];

  const goals: FinancialGoal[] = (goalsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.goal_type as FinancialGoal["type"],
    targetAmount: Number(r.target_amount),
    currentAmount: Number(r.current_amount),
    monthlyContribution: Number(r.monthly_contribution),
    targetDate: r.target_date ?? "",
    priority: Number(r.priority ?? 3),
    userContributionAmount: Number(r.user_contribution_amount ?? 0),
    partnerContributionAmount: Number(r.partner_contribution_amount ?? 0),
    ...mapShareable(r),
  }));

  const assets: Asset[] = (assetsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.asset_type as Asset["type"],
    value: Number(r.value),
    ...mapShareable(r),
  }));

  const liabilities: Liability[] = (liabilitiesRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.liability_type as Liability["type"],
    value: Number(r.value),
    ...mapShareable(r),
  }));

  const netWorthSnapshots: NetWorthSnapshot[] = (snapshotsRes.data ?? []).map((r) => ({
    id: r.id,
    date: r.snapshot_date,
    netWorth: Number(r.net_worth),
    totalAssets: Number(r.total_assets),
    totalLiabilities: Number(r.total_liabilities),
  }));

  const financialHealthSnapshots: FinancialHealthSnapshot[] = (healthRes.data ?? []).map(
    (r) => ({
      id: r.id,
      date: r.snapshot_date,
      score: Number(r.score),
      rating: r.rating as FinancialHealthSnapshot["rating"],
      categoryScores: (r.category_scores ?? {}) as Record<string, number>,
      suggestions: (r.suggestions ?? []) as string[],
      householdId: (r.household_id as string | null) ?? null,
    })
  );

  const scenarios: Scenario[] = (scenariosRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.scenario_type as Scenario["type"],
    value: Number(r.value),
    enabled: r.enabled,
  }));

  const investmentHoldings: InvestmentHolding[] = (holdingsRes.data ?? []).map((r) => ({
    id: r.id,
    ticker: r.ticker,
    exchange: r.exchange ?? "",
    stockName: r.stock_name,
    country: r.country ?? "",
    currency: r.currency,
    shares: Number(r.shares),
    averagePurchasePrice: Number(r.average_purchase_price),
    purchaseDate: r.purchase_date ?? "",
    latestPrice: r.latest_price != null ? Number(r.latest_price) : null,
    latestPriceUpdatedAt: r.latest_price_updated_at,
    sector: r.sector,
    notes: r.notes ?? "",
    ownershipPercent: Number(r.ownership_percent ?? 100),
    userContributionAmount: Number(r.user_contribution_amount ?? 0),
    partnerContributionAmount: Number(r.partner_contribution_amount ?? 0),
    ...mapShareable(r),
  }));

  const mortgageAccounts: MortgageAccount[] = (mortgagesRes.data ?? []).map((r) => ({
    id: r.id,
    propertyName: r.property_name,
    propertyValue: Number(r.property_value),
    loanAmount: Number(r.loan_amount),
    currentBalance: Number(r.current_balance),
    interestRate: Number(r.interest_rate),
    loanTermYears: Number(r.loan_term_years),
    repaymentFrequency: r.repayment_frequency as MortgageAccount["repaymentFrequency"],
    regularRepaymentAmount: Number(r.regular_repayment_amount),
    loanStartDate: r.loan_start_date ?? "",
    rateType: r.rate_type as MortgageAccount["rateType"],
    offsetBalance: Number(r.offset_balance),
    ownershipSplitPercent: Number(r.ownership_split_percent ?? 50),
    userRepaymentContribution: Number(r.user_repayment_contribution ?? 0),
    partnerRepaymentContribution: Number(r.partner_repayment_contribution ?? 0),
    ...mapShareable(r),
  }));

  const mortgageExtraPayments: MortgageExtraPayment[] = (extraPaymentsRes.data ?? []).map(
    (r) => ({
      id: r.id,
      mortgageAccountId: r.mortgage_account_id,
      amount: Number(r.amount),
      frequency: r.frequency as MortgageExtraPayment["frequency"],
      startDate: r.start_date ?? "",
      endDate: r.end_date,
      paidByUserId: r.paid_by_user_id ?? null,
    })
  );

  return {
    version: 1,
    income: incomeSettings,
    expenses,
    sinkingFunds,
    allocationBuckets,
    goals,
    houseDeposit,
    investmentProjection,
    assets,
    liabilities,
    netWorthSnapshots,
    financialHealthSnapshots,
    scenarios,
    investmentHoldings,
    mortgageAccounts,
    mortgageExtraPayments,
    emergencyFundBalance: profile ? Number(profile.emergency_fund_balance) : 0,
    darkMode: profile?.dark_mode ?? false,
    setupCompleted,
    setupChoice,
    onboardingCompleted,
    dashboardView,
  };
}

export async function saveProfilePreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: {
    setupCompleted?: boolean;
    setupChoice?: SetupChoice | null;
    onboardingCompleted?: boolean;
    dashboardView?: DashboardViewMode;
    email?: string;
  }
): Promise<void> {
  const ts = now();
  const payload: Record<string, unknown> = {
    user_id: userId,
    updated_at: ts,
  };
  if (prefs.email !== undefined) payload.email = prefs.email;
  if (prefs.setupCompleted !== undefined) {
    payload.setup_completed = prefs.setupCompleted;
    if (prefs.setupCompleted) payload.onboarding_completed = true;
  }
  if (prefs.setupChoice !== undefined) payload.setup_choice = prefs.setupChoice;
  if (prefs.onboardingCompleted !== undefined) {
    payload.onboarding_completed = prefs.onboardingCompleted;
  }
  if (prefs.dashboardView !== undefined) {
    payload.dashboard_view = prefs.dashboardView;
    payload.default_dashboard_mode = dashboardViewToDbMode(prefs.dashboardView);
  }
  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
  assertNoError(error, "profiles preferences save");

  const { data: verify, error: verifyError } = await supabase
    .from("profiles")
    .select("user_id, setup_completed, setup_choice, onboarding_completed")
    .eq("user_id", userId)
    .maybeSingle();

  console.log("[FinanceTracker] saveProfilePreferences verify", {
    userId,
    requested: {
      setupCompleted: prefs.setupCompleted,
      setupChoice: prefs.setupChoice,
    },
    profileRow: verify,
    verifyError: verifyError?.message ?? null,
  });

  if (prefs.setupCompleted === true && verify?.setup_completed !== true) {
    console.error("[FinanceTracker] setup_completed was NOT saved as true", {
      userId,
      verify,
      verifyError,
    });
  }
}

export async function saveFinanceDataToSupabase(
  supabase: SupabaseClient,
  userId: string,
  data: FinanceData,
  email?: string
): Promise<void> {
  const ts = now();
  const dbDashboardMode = dashboardViewToDbMode(data.dashboardView);

  const profileResult = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      email,
      dark_mode: data.darkMode,
      emergency_fund_balance: data.emergencyFundBalance,
      house_property_price: data.houseDeposit.propertyPrice,
      house_deposit_percent: data.houseDeposit.depositPercent,
      house_current_savings: data.houseDeposit.currentSavings,
      house_monthly_contribution: data.houseDeposit.monthlyContribution,
      house_annual_return: data.houseDeposit.annualReturn,
      inv_current_value: data.investmentProjection.currentValue,
      inv_monthly_contribution: data.investmentProjection.monthlyContribution,
      inv_annual_return: data.investmentProjection.annualReturn,
      inv_time_horizon_years: data.investmentProjection.timeHorizonYears,
      dashboard_view: data.dashboardView,
      default_dashboard_mode: dbDashboardMode,
      updated_at: ts,
    },
    { onConflict: "user_id" }
  );
  assertNoError(profileResult.error, "profiles save");

  const incomeResult = await supabase.from("income_settings").upsert(
    {
      user_id: userId,
      salary: data.income.salary,
      pay_frequency: data.income.payFrequency,
      country: data.income.country,
      state_province: data.income.stateProvince,
      include_medicare_levy: data.income.includeMedicareLevy,
      salary_sacrifice: data.income.salarySacrifice,
      super_contribution: data.income.superContribution,
      tax_options: {
        taxYear: data.income.taxYear,
        includeAccLevy: data.income.includeAccLevy,
        residencyStatus: data.income.residencyStatus,
        includeCpp: data.income.includeCpp,
        includeEi: data.income.includeEi,
        ukRegion: data.income.ukRegion,
        includeNationalInsurance: data.income.includeNationalInsurance,
        usFilingStatus: data.income.usFilingStatus,
      },
      updated_at: ts,
    },
    { onConflict: "user_id" }
  );
  assertNoError(incomeResult.error, "income_settings save");

  await syncCollection(supabase, "fixed_expenses", userId, data.expenses, (e) => ({
    id: e.id,
    user_id: userId,
    name: e.name,
    category: e.category,
    amount: e.amount,
    frequency: e.frequency,
    active: e.active,
    visibility: e.visibility,
    household_id: e.householdId,
    shared_account_id: e.sharedAccountId,
    split_type: e.splitType,
    user_contribution_amount: e.userContributionAmount,
    partner_contribution_amount: e.partnerContributionAmount,
    user_contribution_percent: e.userContributionPercent,
    updated_at: ts,
  }));

  await syncCollection(supabase, "sinking_funds", userId, data.sinkingFunds, (f) => ({
    id: f.id,
    user_id: userId,
    name: f.name,
    annual_target: f.annualTarget,
    current_balance: f.currentBalance,
    visibility: f.visibility,
    household_id: f.householdId,
    shared_account_id: f.sharedAccountId,
    updated_at: ts,
  }));

  await syncAllocationBuckets(supabase, userId, data.allocationBuckets, ts);

  await syncCollection(supabase, "financial_goals", userId, data.goals, (g) => ({
    id: g.id,
    user_id: userId,
    name: g.name,
    goal_type: g.type,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount,
    monthly_contribution: g.monthlyContribution,
    target_date: g.targetDate || null,
    priority: g.priority ?? 3,
    visibility: g.visibility,
    household_id: g.householdId,
    shared_account_id: g.sharedAccountId,
    user_contribution_amount: g.userContributionAmount,
    partner_contribution_amount: g.partnerContributionAmount,
    updated_at: ts,
  }));

  await syncCollection(supabase, "assets", userId, data.assets, (a) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    asset_type: a.type,
    value: a.value,
    visibility: a.visibility,
    household_id: a.householdId,
    shared_account_id: a.sharedAccountId,
    updated_at: ts,
  }));

  await syncCollection(supabase, "liabilities", userId, data.liabilities, (l) => ({
    id: l.id,
    user_id: userId,
    name: l.name,
    liability_type: l.type,
    value: l.value,
    visibility: l.visibility,
    household_id: l.householdId,
    shared_account_id: l.sharedAccountId,
    updated_at: ts,
  }));

  await syncCollection(supabase, "net_worth_snapshots", userId, data.netWorthSnapshots, (s) => ({
    id: s.id,
    user_id: userId,
    snapshot_date: s.date,
    net_worth: s.netWorth,
    total_assets: s.totalAssets,
    total_liabilities: s.totalLiabilities,
    updated_at: ts,
  }));

  await syncCollection(
    supabase,
    "financial_health_snapshots",
    userId,
    data.financialHealthSnapshots,
    (s) => ({
      id: s.id,
      user_id: userId,
      household_id: s.householdId,
      score: s.score,
      rating: s.rating,
      category_scores: s.categoryScores,
      suggestions: s.suggestions,
      snapshot_date: s.date,
      updated_at: ts,
    })
  );

  await syncCollection(supabase, "scenarios", userId, data.scenarios, (s) => ({
    id: s.id,
    user_id: userId,
    name: s.name,
    scenario_type: s.type,
    value: s.value,
    enabled: s.enabled,
    updated_at: ts,
  }));

  await syncCollection(supabase, "investment_holdings", userId, data.investmentHoldings, (h) => ({
    id: h.id,
    user_id: userId,
    ticker: h.ticker,
    exchange: h.exchange,
    stock_name: h.stockName,
    country: h.country,
    currency: h.currency,
    shares: h.shares,
    average_purchase_price: h.averagePurchasePrice,
    purchase_date: h.purchaseDate || null,
    latest_price: h.latestPrice,
    latest_price_updated_at: h.latestPriceUpdatedAt,
    sector: h.sector,
    notes: h.notes,
    visibility: h.visibility,
    household_id: h.householdId,
    shared_account_id: h.sharedAccountId,
    ownership_percent: h.ownershipPercent,
    user_contribution_amount: h.userContributionAmount,
    partner_contribution_amount: h.partnerContributionAmount,
    updated_at: ts,
  }));

  await syncCollection(supabase, "mortgage_accounts", userId, data.mortgageAccounts, (m) => ({
    id: m.id,
    user_id: userId,
    property_name: m.propertyName,
    property_value: m.propertyValue,
    loan_amount: m.loanAmount,
    current_balance: m.currentBalance,
    interest_rate: m.interestRate,
    loan_term_years: m.loanTermYears,
    repayment_frequency: m.repaymentFrequency,
    regular_repayment_amount: m.regularRepaymentAmount,
    loan_start_date: m.loanStartDate || null,
    rate_type: m.rateType,
    offset_balance: m.offsetBalance,
    visibility: m.visibility,
    household_id: m.householdId,
    shared_account_id: m.sharedAccountId,
    ownership_split_percent: m.ownershipSplitPercent,
    user_repayment_contribution: m.userRepaymentContribution,
    partner_repayment_contribution: m.partnerRepaymentContribution,
    updated_at: ts,
  }));

  await syncCollection(
    supabase,
    "mortgage_extra_payments",
    userId,
    data.mortgageExtraPayments,
    (p) => ({
      id: p.id,
      user_id: userId,
      mortgage_account_id: p.mortgageAccountId,
      amount: p.amount,
      frequency: p.frequency,
      start_date: p.startDate || null,
      end_date: p.endDate,
      paid_by_user_id: p.paidByUserId,
      updated_at: ts,
    })
  );
}

async function syncAllocationBuckets(
  supabase: SupabaseClient,
  userId: string,
  buckets: AllocationBucket[],
  updatedAt: string
) {
  const { data: existing, error: fetchError } = await supabase
    .from("allocation_buckets")
    .select("id, name, is_default")
    .eq("user_id", userId);
  assertNoError(fetchError, "allocation_buckets fetch");

  const existingRows = existing ?? [];
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const existingByKey = new Map(
    existingRows.map((row) => [bucketMatchKey(row.name, row.is_default), row.id])
  );

  const rows = buckets.map((bucket) => {
    const resolvedId = resolveAllocationBucketDbId(bucket, existingById, existingByKey);
    return buildAllocationBucketDbRow(bucket, userId, updatedAt, resolvedId);
  });

  if (rows.length === 0) {
    if (existingRows.length > 0) {
      const { error: deleteError } = await supabase
        .from("allocation_buckets")
        .delete()
        .eq("user_id", userId);
      assertNoError(deleteError, "allocation_buckets delete");
    }
    return;
  }

  const { data: upserted, error: upsertError } = await supabase
    .from("allocation_buckets")
    .upsert(rows)
    .select("id");
  assertNoError(upsertError, "allocation_buckets upsert");

  const keptIds = new Set((upserted ?? []).map((row) => row.id));
  const toDelete = existingRows.map((row) => row.id).filter((id) => !keptIds.has(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("allocation_buckets")
      .delete()
      .in("id", toDelete);
    assertNoError(deleteError, "allocation_buckets delete");
  }
}

async function syncCollection<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  items: T[],
  toRow: (item: T) => Record<string, unknown>
) {
  const { data: existing, error: fetchError } = await supabase
    .from(table)
    .select("id")
    .eq("user_id", userId);
  assertNoError(fetchError, `${table} fetch`);
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id));
  const itemIds = new Set(items.map((i) => i.id));

  const toDelete = Array.from(existingIds).filter((id) => !itemIds.has(id));
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", toDelete);
    assertNoError(deleteError, `${table} delete`);
  }

  if (items.length > 0) {
    const { error: upsertError } = await supabase.from(table).upsert(items.map(toRow));
    assertNoError(upsertError, `${table} upsert`);
  }
}

export async function updateHoldingPrices(
  supabase: SupabaseClient,
  userId: string,
  updates: { id: string; latestPrice: number; latestPriceUpdatedAt: string }[]
) {
  for (const u of updates) {
    await supabase
      .from("investment_holdings")
      .update({
        latest_price: u.latestPrice,
        latest_price_updated_at: u.latestPriceUpdatedAt,
      })
      .eq("id", u.id)
      .eq("user_id", userId);
  }
}
