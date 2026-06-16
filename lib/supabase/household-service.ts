import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Household,
  HouseholdMember,
  HouseholdInvitation,
  SharedAccount,
  PartnerSharedData,
  DataVisibility,
  ExpenseSplitType,
  HouseholdActivityLog,
  HouseholdActivityEvent,
} from "@/lib/types";
import { DEFAULT_SHAREABLE } from "@/lib/household/defaults";
import { saveProfilePreferences } from "@/lib/supabase/data-service";

function mapShareable(row: Record<string, unknown>, ownerUserId?: string) {
  return {
    visibility: (row.visibility as DataVisibility) ?? DEFAULT_SHAREABLE.visibility,
    householdId: (row.household_id as string) ?? null,
    sharedAccountId: (row.shared_account_id as string) ?? null,
    ownerUserId,
  };
}

export async function loadUserHouseholds(
  supabase: SupabaseClient,
  userId: string
): Promise<{ household: Household | null; membership: HouseholdMember | null }> {
  const { data: memberships } = await supabase
    .from("household_members")
    .select("*, households(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1);

  const row = memberships?.[0];
  if (!row) return { household: null, membership: null };

  const h = row.households as Record<string, unknown>;
  return {
    household: {
      id: h.id as string,
      name: h.name as string,
      createdBy: h.created_by as string,
      createdAt: h.created_at as string,
      updatedAt: h.updated_at as string,
    },
    membership: {
      id: row.id,
      householdId: row.household_id,
      userId: row.user_id,
      email: null,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    },
  };
}

export async function loadHouseholdMembers(
  supabase: SupabaseClient,
  householdId: string
): Promise<HouseholdMember[]> {
  const { data } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", householdId)
    .neq("status", "removed");

  const members: HouseholdMember[] = [];
  for (const row of data ?? []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("user_id", row.user_id)
      .maybeSingle();
    members.push({
      id: row.id,
      householdId: row.household_id,
      userId: row.user_id,
      email: profile?.email ?? null,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    });
  }
  return members;
}

export async function loadSharedAccounts(
  supabase: SupabaseClient,
  householdId: string
): Promise<SharedAccount[]> {
  const { data } = await supabase
    .from("shared_accounts")
    .select("*")
    .eq("household_id", householdId);

  return (data ?? []).map((r) => ({
    id: r.id,
    householdId: r.household_id,
    name: r.name,
    type: r.type,
    balance: Number(r.balance),
    currency: r.currency,
    ownershipType: r.ownership_type,
  }));
}

export async function loadPendingInvitations(
  supabase: SupabaseClient,
  householdId: string
): Promise<HouseholdInvitation[]> {
  const { data } = await supabase
    .from("household_invitations")
    .select("*")
    .eq("household_id", householdId)
    .eq("status", "pending");

  return (data ?? []).map((r) => ({
    id: r.id,
    householdId: r.household_id,
    invitedEmail: r.invited_email,
    invitedBy: r.invited_by,
    status: r.status,
    token: r.token,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }));
}

export async function loadPartnerSharedData(
  supabase: SupabaseClient,
  userId: string,
  householdId: string
): Promise<PartnerSharedData[]> {
  const members = await loadHouseholdMembers(supabase, householdId);
  const partners = members.filter((m) => m.userId !== userId && m.status === "active");

  const results: PartnerSharedData[] = [];
  for (const partner of partners) {
    const pid = partner.userId;
    const [expensesRes, goalsRes, holdingsRes, mortgagesRes, extraRes, assetsRes, liabilitiesRes, sinkingRes] =
      await Promise.all([
        supabase.from("fixed_expenses").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
        supabase.from("financial_goals").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
        supabase.from("investment_holdings").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
        supabase.from("mortgage_accounts").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
        supabase.from("mortgage_extra_payments").select("*").eq("user_id", pid),
        supabase.from("assets").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
        supabase.from("liabilities").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
        supabase.from("sinking_funds").select("*").eq("user_id", pid).in("visibility", ["household", "shared_account_only"]),
      ]);

    const mortgageIds = new Set((mortgagesRes.data ?? []).map((m) => m.id));

    results.push({
      userId: pid,
      email: partner.email,
      expenses: (expensesRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        amount: Number(r.amount),
        frequency: r.frequency,
        active: r.active,
        splitType: r.split_type as ExpenseSplitType,
        userContributionAmount: Number(r.user_contribution_amount),
        partnerContributionAmount: Number(r.partner_contribution_amount),
        userContributionPercent: Number(r.user_contribution_percent),
        ...mapShareable(r, pid),
      })),
      goals: (goalsRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.goal_type,
        targetAmount: Number(r.target_amount),
        currentAmount: Number(r.current_amount),
        monthlyContribution: Number(r.monthly_contribution),
        targetDate: r.target_date ?? "",
        userContributionAmount: Number(r.user_contribution_amount),
        partnerContributionAmount: Number(r.partner_contribution_amount),
        ...mapShareable(r, pid),
      })),
      investmentHoldings: (holdingsRes.data ?? []).map((r) => ({
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
        userContributionAmount: Number(r.user_contribution_amount),
        partnerContributionAmount: Number(r.partner_contribution_amount),
        ...mapShareable(r, pid),
      })),
      mortgageAccounts: (mortgagesRes.data ?? []).map((r) => ({
        id: r.id,
        propertyName: r.property_name,
        propertyValue: Number(r.property_value),
        loanAmount: Number(r.loan_amount),
        currentBalance: Number(r.current_balance),
        interestRate: Number(r.interest_rate),
        loanTermYears: Number(r.loan_term_years),
        repaymentFrequency: r.repayment_frequency,
        regularRepaymentAmount: Number(r.regular_repayment_amount),
        loanStartDate: r.loan_start_date ?? "",
        rateType: r.rate_type,
        offsetBalance: Number(r.offset_balance),
        ownershipSplitPercent: Number(r.ownership_split_percent ?? 50),
        userRepaymentContribution: Number(r.user_repayment_contribution),
        partnerRepaymentContribution: Number(r.partner_repayment_contribution),
        ...mapShareable(r, pid),
      })),
      mortgageExtraPayments: (extraRes.data ?? [])
        .filter((r) => mortgageIds.has(r.mortgage_account_id))
        .map((r) => ({
          id: r.id,
          mortgageAccountId: r.mortgage_account_id,
          amount: Number(r.amount),
          frequency: r.frequency,
          startDate: r.start_date ?? "",
          endDate: r.end_date,
          paidByUserId: r.paid_by_user_id ?? null,
        })),
      assets: (assetsRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.asset_type,
        value: Number(r.value),
        ...mapShareable(r, pid),
      })),
      liabilities: (liabilitiesRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        type: r.liability_type,
        value: Number(r.value),
        ...mapShareable(r, pid),
      })),
      sinkingFunds: (sinkingRes.data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        annualTarget: Number(r.annual_target),
        currentBalance: Number(r.current_balance),
        ...mapShareable(r, pid),
      })),
    });
  }
  return results;
}

export async function createHousehold(
  supabase: SupabaseClient,
  userId: string,
  name: string
): Promise<Household> {
  const { data: household, error } = await supabase
    .from("households")
    .insert({ name, created_by: userId })
    .select()
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase.from("household_members").insert({
    household_id: household.id,
    user_id: userId,
    role: "owner",
    status: "active",
  });
  if (memberError) throw memberError;

  await logActivity(supabase, household.id, userId, "member_joined", userId, {
    role: "owner",
  });

  return {
    id: household.id,
    name: household.name,
    createdBy: household.created_by,
    createdAt: household.created_at,
    updatedAt: household.updated_at,
  };
}

export async function renameHousehold(
  supabase: SupabaseClient,
  householdId: string,
  name: string
): Promise<void> {
  const { error } = await supabase.from("households").update({ name }).eq("id", householdId);
  if (error) throw error;
}

export async function inviteToHousehold(
  supabase: SupabaseClient,
  householdId: string,
  invitedBy: string,
  email: string
): Promise<HouseholdInvitation> {
  const { data, error } = await supabase
    .from("household_invitations")
    .insert({
      household_id: householdId,
      invited_email: email.toLowerCase().trim(),
      invited_by: invitedBy,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(supabase, householdId, invitedBy, "member_invited", null, {
    invited_email: email.toLowerCase().trim(),
  });
  return {
    id: data.id,
    householdId: data.household_id,
    invitedEmail: data.invited_email,
    invitedBy: data.invited_by,
    status: data.status,
    token: data.token,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
  };
}

export async function acceptInvitation(
  supabase: SupabaseClient,
  token: string
): Promise<string> {
  const { data, error } = await supabase.rpc("accept_household_invitation", {
    invite_token: token,
  });
  if (error) throw error;
  return data as string;
}

export async function transferOwnership(
  supabase: SupabaseClient,
  householdId: string,
  newOwnerUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("transfer_household_ownership", {
    p_household_id: householdId,
    p_new_owner_id: newOwnerUserId,
  });
  if (error) throw error;
}

export async function leaveHousehold(
  supabase: SupabaseClient,
  householdId: string
): Promise<void> {
  const { error } = await supabase.rpc("leave_household", {
    p_household_id: householdId,
  });
  if (error) throw error;
}

export async function removeMember(
  supabase: SupabaseClient,
  householdId: string,
  memberUserId: string
): Promise<void> {
  const { error } = await supabase.rpc("remove_household_member", {
    p_household_id: householdId,
    p_target_user_id: memberUserId,
  });
  if (error) throw error;
}

export async function deleteHousehold(
  supabase: SupabaseClient,
  householdId: string
): Promise<void> {
  const { error } = await supabase.rpc("delete_household", {
    p_household_id: householdId,
  });
  if (error) throw error;
}

export async function unlinkSharedAccount(
  supabase: SupabaseClient,
  accountId: string
): Promise<void> {
  const { error } = await supabase.rpc("unlink_shared_account", {
    p_account_id: accountId,
  });
  if (error) throw error;
}

export async function logActivity(
  supabase: SupabaseClient,
  householdId: string,
  actorUserId: string,
  eventType: HouseholdActivityEvent,
  targetUserId: string | null = null,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const { error } = await supabase.rpc("log_household_activity", {
    p_household_id: householdId,
    p_actor_user_id: actorUserId,
    p_event_type: eventType,
    p_target_user_id: targetUserId,
    p_metadata: metadata,
  });
  if (error) {
    // Activity log table may not exist until migration 008 is applied
    console.warn("Failed to log household activity:", error.message);
  }
}

export async function loadActivityLog(
  supabase: SupabaseClient,
  householdId: string,
  limit = 50
): Promise<HouseholdActivityLog[]> {
  const { data, error } = await supabase
    .from("household_activity_log")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.code === "42P01") return [];
    throw error;
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    householdId: r.household_id,
    actorUserId: r.actor_user_id,
    eventType: r.event_type as HouseholdActivityEvent,
    targetUserId: r.target_user_id,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at,
  }));
}

export async function createSharedAccount(
  supabase: SupabaseClient,
  account: Omit<SharedAccount, "id">,
  actorUserId: string
): Promise<SharedAccount> {
  const { data, error } = await supabase
    .from("shared_accounts")
    .insert({
      household_id: account.householdId,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      ownership_type: account.ownershipType,
    })
    .select()
    .single();
  if (error) throw error;
  await logActivity(supabase, account.householdId, actorUserId, "shared_account_created", null, {
    account_name: account.name,
    account_type: account.type,
    account_id: data.id,
  });
  return {
    id: data.id,
    householdId: data.household_id,
    name: data.name,
    type: data.type,
    balance: Number(data.balance),
    currency: data.currency,
    ownershipType: data.ownership_type,
  };
}

export async function completeOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  await saveProfilePreferences(supabase, userId, {
    setupCompleted: true,
    onboardingCompleted: true,
  });
}

export async function updateDashboardView(
  supabase: SupabaseClient,
  userId: string,
  view: string
): Promise<void> {
  await saveProfilePreferences(supabase, userId, {
    dashboardView: view as "personal" | "shared" | "combined",
  });
}

export async function getInvitationByToken(
  supabase: SupabaseClient,
  token: string
): Promise<(HouseholdInvitation & { householdName: string }) | null> {
  const { data } = await supabase
    .from("household_invitations")
    .select("*, households(name)")
    .eq("token", token)
    .eq("status", "pending")
    .maybeSingle();
  if (!data) return null;
  const h = data.households as { name: string };
  return {
    id: data.id,
    householdId: data.household_id,
    invitedEmail: data.invited_email,
    invitedBy: data.invited_by,
    status: data.status,
    token: data.token,
    expiresAt: data.expires_at,
    createdAt: data.created_at,
    householdName: h.name,
  };
}
