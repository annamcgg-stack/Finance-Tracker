import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_FINANCE_DATA, DEFAULT_ALLOCATION_BUCKETS } from "@/lib/constants";
import type {
  FinanceData,
  FixedExpense,
  SinkingFund,
  AllocationBucket,
  FinancialGoal,
  Asset,
  Liability,
  NetWorthSnapshot,
  Scenario,
  InvestmentHolding,
  MortgageAccount,
  MortgageExtraPayment,
  IncomeSettings,
  HouseDepositPlan,
  InvestmentProjectionSettings,
} from "@/lib/types";

function now() {
  return new Date().toISOString();
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
    supabase.from("scenarios").select("*").eq("user_id", userId),
    supabase.from("investment_holdings").select("*").eq("user_id", userId),
    supabase.from("mortgage_accounts").select("*").eq("user_id", userId),
    supabase.from("mortgage_extra_payments").select("*").eq("user_id", userId),
  ]);

  const profile = profileRes.data;
  const income = incomeRes.data;

  const incomeSettings: IncomeSettings = income
    ? {
        salary: Number(income.salary),
        payFrequency: income.pay_frequency as IncomeSettings["payFrequency"],
        country: income.country as IncomeSettings["country"],
        stateProvince: income.state_province,
        includeMedicareLevy: income.include_medicare_levy,
        salarySacrifice: Number(income.salary_sacrifice),
        superContribution: Number(income.super_contribution),
      }
    : DEFAULT_FINANCE_DATA.income;

  const houseDeposit: HouseDepositPlan = profile
    ? {
        propertyPrice: Number(profile.house_property_price),
        depositPercent: Number(profile.house_deposit_percent),
        currentSavings: Number(profile.house_current_savings),
        monthlyContribution: Number(profile.house_monthly_contribution),
        annualReturn: Number(profile.house_annual_return),
      }
    : DEFAULT_FINANCE_DATA.houseDeposit;

  const investmentProjection: InvestmentProjectionSettings = profile
    ? {
        currentValue: Number(profile.inv_current_value),
        monthlyContribution: Number(profile.inv_monthly_contribution),
        annualReturn: Number(profile.inv_annual_return),
        timeHorizonYears: Number(profile.inv_time_horizon_years),
      }
    : DEFAULT_FINANCE_DATA.investmentProjection;

  const expenses: FixedExpense[] = (expensesRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as FixedExpense["category"],
    amount: Number(r.amount),
    frequency: r.frequency as FixedExpense["frequency"],
    active: r.active,
  }));

  const sinkingFunds: SinkingFund[] = (sinkingRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    annualTarget: Number(r.annual_target),
    currentBalance: Number(r.current_balance),
  }));

  const allocationBuckets: AllocationBucket[] =
    (bucketsRes.data ?? []).length > 0
      ? bucketsRes.data!.map((r) => ({
          id: r.id,
          name: r.name,
          percentage: Number(r.percentage),
          isDefault: r.is_default,
        }))
      : DEFAULT_ALLOCATION_BUCKETS;

  const goals: FinancialGoal[] = (goalsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.goal_type as FinancialGoal["type"],
    targetAmount: Number(r.target_amount),
    currentAmount: Number(r.current_amount),
    monthlyContribution: Number(r.monthly_contribution),
    targetDate: r.target_date ?? "",
  }));

  const assets: Asset[] = (assetsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.asset_type as Asset["type"],
    value: Number(r.value),
  }));

  const liabilities: Liability[] = (liabilitiesRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.liability_type as Liability["type"],
    value: Number(r.value),
  }));

  const netWorthSnapshots: NetWorthSnapshot[] = (snapshotsRes.data ?? []).map((r) => ({
    id: r.id,
    date: r.snapshot_date,
    netWorth: Number(r.net_worth),
    totalAssets: Number(r.total_assets),
    totalLiabilities: Number(r.total_liabilities),
  }));

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
  }));

  const mortgageExtraPayments: MortgageExtraPayment[] = (extraPaymentsRes.data ?? []).map(
    (r) => ({
      id: r.id,
      mortgageAccountId: r.mortgage_account_id,
      amount: Number(r.amount),
      frequency: r.frequency as MortgageExtraPayment["frequency"],
      startDate: r.start_date ?? "",
      endDate: r.end_date,
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
    scenarios,
    investmentHoldings,
    mortgageAccounts,
    mortgageExtraPayments,
    emergencyFundBalance: profile ? Number(profile.emergency_fund_balance) : 0,
    darkMode: profile?.dark_mode ?? false,
  };
}

export async function saveFinanceDataToSupabase(
  supabase: SupabaseClient,
  userId: string,
  data: FinanceData,
  email?: string
): Promise<void> {
  const ts = now();

  await supabase.from("profiles").upsert(
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
      updated_at: ts,
    },
    { onConflict: "user_id" }
  );

  await supabase.from("income_settings").upsert(
    {
      user_id: userId,
      salary: data.income.salary,
      pay_frequency: data.income.payFrequency,
      country: data.income.country,
      state_province: data.income.stateProvince,
      include_medicare_levy: data.income.includeMedicareLevy,
      salary_sacrifice: data.income.salarySacrifice,
      super_contribution: data.income.superContribution,
      updated_at: ts,
    },
    { onConflict: "user_id" }
  );

  await syncCollection(supabase, "fixed_expenses", userId, data.expenses, (e) => ({
    id: e.id,
    user_id: userId,
    name: e.name,
    category: e.category,
    amount: e.amount,
    frequency: e.frequency,
    active: e.active,
    updated_at: ts,
  }));

  await syncCollection(supabase, "sinking_funds", userId, data.sinkingFunds, (f) => ({
    id: f.id,
    user_id: userId,
    name: f.name,
    annual_target: f.annualTarget,
    current_balance: f.currentBalance,
    updated_at: ts,
  }));

  await syncCollection(supabase, "allocation_buckets", userId, data.allocationBuckets, (b) => ({
    id: b.id,
    user_id: userId,
    name: b.name,
    percentage: b.percentage,
    is_default: b.isDefault,
    updated_at: ts,
  }));

  await syncCollection(supabase, "financial_goals", userId, data.goals, (g) => ({
    id: g.id,
    user_id: userId,
    name: g.name,
    goal_type: g.type,
    target_amount: g.targetAmount,
    current_amount: g.currentAmount,
    monthly_contribution: g.monthlyContribution,
    target_date: g.targetDate || null,
    updated_at: ts,
  }));

  await syncCollection(supabase, "assets", userId, data.assets, (a) => ({
    id: a.id,
    user_id: userId,
    name: a.name,
    asset_type: a.type,
    value: a.value,
    updated_at: ts,
  }));

  await syncCollection(supabase, "liabilities", userId, data.liabilities, (l) => ({
    id: l.id,
    user_id: userId,
    name: l.name,
    liability_type: l.type,
    value: l.value,
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
      updated_at: ts,
    })
  );
}

async function syncCollection<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  userId: string,
  items: T[],
  toRow: (item: T) => Record<string, unknown>
) {
  const { data: existing } = await supabase.from(table).select("id").eq("user_id", userId);
  const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id));
  const itemIds = new Set(items.map((i) => i.id));

  const toDelete = Array.from(existingIds).filter((id) => !itemIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from(table).delete().in("id", toDelete);
  }

  if (items.length > 0) {
    await supabase.from(table).upsert(items.map(toRow));
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
