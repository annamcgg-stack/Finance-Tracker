-- 012_repair_existing_database.sql
-- Idempotent repair migration for existing Finance Tracker Supabase projects.
-- Safe to re-run. Does NOT drop user data. Skips objects that already exist.

-- ---------------------------------------------------------------------------
-- Extensions (invitation tokens)
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core finance tables (create only if missing)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text,
  dark_mode boolean not null default false,
  emergency_fund_balance numeric not null default 0,
  house_property_price numeric not null default 0,
  house_deposit_percent numeric not null default 20,
  house_current_savings numeric not null default 0,
  house_monthly_contribution numeric not null default 0,
  house_annual_return numeric not null default 4,
  inv_current_value numeric not null default 0,
  inv_monthly_contribution numeric not null default 0,
  inv_annual_return numeric not null default 7,
  inv_time_horizon_years integer not null default 20,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.income_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  salary numeric not null default 0,
  pay_frequency text not null default 'annual',
  country text not null default 'AU',
  state_province text not null default 'NSW',
  include_medicare_levy boolean not null default true,
  salary_sacrifice numeric not null default 0,
  super_contribution numeric not null default 0,
  tax_options jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  amount numeric not null default 0,
  frequency text not null default 'monthly',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sinking_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  annual_target numeric not null default 0,
  current_balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.allocation_buckets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  percentage numeric not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal_type text not null default 'custom',
  target_amount numeric not null default 0,
  current_amount numeric not null default 0,
  monthly_contribution numeric not null default 0,
  target_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  asset_type text not null default 'other',
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  liability_type text not null default 'other',
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date timestamptz not null default now(),
  net_worth numeric not null default 0,
  total_assets numeric not null default 0,
  total_liabilities numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  scenario_type text not null default 'salary_increase',
  value numeric not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.investment_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ticker text not null,
  exchange text,
  stock_name text not null,
  country text,
  currency text not null default 'USD',
  shares numeric not null default 0,
  average_purchase_price numeric not null default 0,
  purchase_date date,
  latest_price numeric,
  latest_price_updated_at timestamptz,
  sector text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mortgage_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_name text not null,
  property_value numeric not null default 0,
  loan_amount numeric not null default 0,
  current_balance numeric not null default 0,
  interest_rate numeric not null default 0,
  loan_term_years integer not null default 30,
  repayment_frequency text not null default 'monthly',
  regular_repayment_amount numeric not null default 0,
  loan_start_date date,
  rate_type text not null default 'variable',
  offset_balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mortgage_extra_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mortgage_account_id uuid not null references public.mortgage_accounts(id) on delete cascade,
  amount numeric not null default 0,
  frequency text not null default 'monthly',
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Household tables (must exist before visibility FK columns)
-- ---------------------------------------------------------------------------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My Household',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table if not exists public.shared_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null default 'other',
  balance numeric not null default 0,
  currency text not null default 'AUD',
  ownership_type text not null default 'shared',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.household_activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Financial health snapshots (household_id FK added separately below)
-- ---------------------------------------------------------------------------
create table if not exists public.financial_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid,
  score integer not null default 0,
  rating text not null default 'Getting Started',
  category_scores jsonb not null default '{}'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  snapshot_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (IF NOT EXISTS)
-- ---------------------------------------------------------------------------
create index if not exists fixed_expenses_user_id_idx on public.fixed_expenses(user_id);
create index if not exists sinking_funds_user_id_idx on public.sinking_funds(user_id);
create index if not exists allocation_buckets_user_id_idx on public.allocation_buckets(user_id);
create index if not exists financial_goals_user_id_idx on public.financial_goals(user_id);
create index if not exists assets_user_id_idx on public.assets(user_id);
create index if not exists liabilities_user_id_idx on public.liabilities(user_id);
create index if not exists net_worth_snapshots_user_id_idx on public.net_worth_snapshots(user_id);
create index if not exists scenarios_user_id_idx on public.scenarios(user_id);
create index if not exists investment_holdings_user_id_idx on public.investment_holdings(user_id);
create index if not exists mortgage_accounts_user_id_idx on public.mortgage_accounts(user_id);
create index if not exists mortgage_extra_payments_user_id_idx on public.mortgage_extra_payments(user_id);
create index if not exists mortgage_extra_payments_mortgage_id_idx on public.mortgage_extra_payments(mortgage_account_id);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_members_household_id_idx on public.household_members(household_id);
create index if not exists shared_accounts_household_id_idx on public.shared_accounts(household_id);
create index if not exists household_invitations_token_idx on public.household_invitations(token);
create index if not exists household_invitations_email_idx on public.household_invitations(invited_email);
create index if not exists household_activity_log_household_id_idx on public.household_activity_log(household_id);
create index if not exists household_activity_log_created_at_idx on public.household_activity_log(created_at desc);
create index if not exists financial_health_snapshots_user_id_idx on public.financial_health_snapshots(user_id);
create index if not exists financial_health_snapshots_user_date_idx on public.financial_health_snapshots(user_id, snapshot_date desc);

-- ---------------------------------------------------------------------------
-- Add missing columns (profiles + features)
-- ---------------------------------------------------------------------------
do $$
begin
  -- income_settings.tax_options (migration 006)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'income_settings' and column_name = 'tax_options'
  ) then
    alter table public.income_settings add column tax_options jsonb not null default '{}'::jsonb;
  end if;

  -- profiles onboarding / dashboard / setup (migrations 007, 009, 010)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'onboarding_completed'
  ) then
    alter table public.profiles add column onboarding_completed boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'dashboard_view'
  ) then
    alter table public.profiles add column dashboard_view text not null default 'personal';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'default_dashboard_mode'
  ) then
    alter table public.profiles add column default_dashboard_mode text not null default 'individual';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'setup_completed'
  ) then
    alter table public.profiles add column setup_completed boolean not null default false;
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'setup_choice'
  ) then
    alter table public.profiles add column setup_choice text;
  end if;

  -- financial_goals.priority (migration 011)
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'financial_goals'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'financial_goals' and column_name = 'priority'
  ) then
    alter table public.financial_goals add column priority integer not null default 3;
  end if;

  -- allocation_buckets.goal_id (migration 011) — column first, FK later
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'allocation_buckets'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'allocation_buckets' and column_name = 'goal_id'
  ) then
    alter table public.allocation_buckets add column goal_id uuid;
  end if;
end $$;

-- Backfill default_dashboard_mode from dashboard_view when both exist
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'dashboard_view'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'default_dashboard_mode'
  ) then
    update public.profiles
    set default_dashboard_mode = case dashboard_view
      when 'shared' then 'household'
      when 'combined' then 'combined'
      else 'individual'
    end
    where default_dashboard_mode = 'individual'
      and dashboard_view is not null
      and dashboard_view <> 'personal';
  end if;
end $$;

-- Backfill setup_completed for existing users (idempotent)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'setup_completed'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'profiles' and column_name = 'onboarding_completed'
    ) then
      update public.profiles
      set setup_completed = true
      where onboarding_completed = true and setup_completed = false;
    end if;

    update public.profiles
    set setup_completed = true,
        setup_choice = coalesce(setup_choice, 'individual')
    where setup_completed = false
      and user_id in (select distinct user_id from public.income_settings);

    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'household_members'
    ) then
      update public.profiles
      set setup_completed = true
      where setup_completed = false
        and user_id in (
          select distinct user_id from public.household_members where status = 'active'
        );
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Household visibility columns on finance tables
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'fixed_expenses', 'financial_goals', 'investment_holdings', 'mortgage_accounts',
    'assets', 'liabilities', 'sinking_funds'
  ] loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      execute format(
        'alter table public.%I add column if not exists visibility text not null default ''private''',
        tbl
      );
      execute format(
        'alter table public.%I add column if not exists household_id uuid',
        tbl
      );
      execute format(
        'alter table public.%I add column if not exists shared_account_id uuid',
        tbl
      );
    end if;
  end loop;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'fixed_expenses') then
    alter table public.fixed_expenses add column if not exists split_type text not null default '50_50';
    alter table public.fixed_expenses add column if not exists user_contribution_amount numeric not null default 0;
    alter table public.fixed_expenses add column if not exists partner_contribution_amount numeric not null default 0;
    alter table public.fixed_expenses add column if not exists user_contribution_percent numeric not null default 50;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'financial_goals') then
    alter table public.financial_goals add column if not exists user_contribution_amount numeric not null default 0;
    alter table public.financial_goals add column if not exists partner_contribution_amount numeric not null default 0;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'investment_holdings') then
    alter table public.investment_holdings add column if not exists ownership_percent numeric not null default 100;
    alter table public.investment_holdings add column if not exists user_contribution_amount numeric not null default 0;
    alter table public.investment_holdings add column if not exists partner_contribution_amount numeric not null default 0;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mortgage_accounts') then
    alter table public.mortgage_accounts add column if not exists ownership_split_percent numeric not null default 50;
    alter table public.mortgage_accounts add column if not exists user_repayment_contribution numeric not null default 0;
    alter table public.mortgage_accounts add column if not exists partner_repayment_contribution numeric not null default 0;
  end if;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mortgage_extra_payments') then
    alter table public.mortgage_extra_payments add column if not exists paid_by_user_id uuid;
  end if;
end $$;

-- Foreign keys for household / goal references (only when missing)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'financial_health_snapshots_household_id_fkey'
  ) and exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'households'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'financial_health_snapshots' and column_name = 'household_id'
  ) then
    alter table public.financial_health_snapshots
      add constraint financial_health_snapshots_household_id_fkey
      foreign key (household_id) references public.households(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'allocation_buckets_goal_id_fkey'
  ) and exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'financial_goals'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'allocation_buckets' and column_name = 'goal_id'
  ) then
    alter table public.allocation_buckets
      add constraint allocation_buckets_goal_id_fkey
      foreign key (goal_id) references public.financial_goals(id) on delete set null;
  end if;

  -- household_id FK on fixed_expenses
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'households')
     and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'fixed_expenses' and column_name = 'household_id')
     and not exists (select 1 from pg_constraint where conname = 'fixed_expenses_household_id_fkey')
  then
    alter table public.fixed_expenses
      add constraint fixed_expenses_household_id_fkey
      foreign key (household_id) references public.households(id) on delete set null;
  end if;
end $$;

-- Add remaining household_id FKs in a loop
do $$
declare
  tbl text;
  cname text;
begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'households') then
    return;
  end if;

  foreach tbl in array array[
    'financial_goals', 'investment_holdings', 'mortgage_accounts',
    'assets', 'liabilities', 'sinking_funds'
  ] loop
    cname := tbl || '_household_id_fkey';
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl)
       and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'household_id')
       and not exists (select 1 from pg_constraint where conname = cname)
    then
      execute format(
        'alter table public.%I add constraint %I foreign key (household_id) references public.households(id) on delete set null',
        tbl, cname
      );
    end if;
  end loop;

  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'shared_accounts') then
    foreach tbl in array array[
      'fixed_expenses', 'financial_goals', 'investment_holdings', 'mortgage_accounts',
      'assets', 'liabilities', 'sinking_funds'
    ] loop
      cname := tbl || '_shared_account_id_fkey';
      if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl)
         and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = tbl and column_name = 'shared_account_id')
         and not exists (select 1 from pg_constraint where conname = cname)
      then
        execute format(
          'alter table public.%I add constraint %I foreign key (shared_account_id) references public.shared_accounts(id) on delete set null',
          tbl, cname
        );
      end if;
    end loop;
  end if;
end $$;

-- Score constraints on financial_health_snapshots
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'financial_health_snapshots_score_check') then
    alter table public.financial_health_snapshots
      add constraint financial_health_snapshots_score_check check (score >= 0 and score <= 100);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS helper functions (CREATE OR REPLACE — safe on production)
-- ---------------------------------------------------------------------------
create or replace function public.is_active_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.is_household_admin(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.household_members
    where household_id = hid
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.can_read_finance_row(row_user_id uuid, row_visibility text, row_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = row_user_id
    or (
      row_visibility in ('household', 'shared_account_only')
      and row_household_id is not null
      and public.is_active_household_member(row_household_id)
    );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on all app tables
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'profiles', 'income_settings', 'fixed_expenses', 'sinking_funds', 'allocation_buckets',
    'financial_goals', 'assets', 'liabilities', 'net_worth_snapshots', 'scenarios',
    'investment_holdings', 'mortgage_accounts', 'mortgage_extra_payments',
    'households', 'household_members', 'shared_accounts', 'household_invitations',
    'household_activity_log', 'financial_health_snapshots'
  ] loop
    if exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = tbl
    ) then
      execute format('alter table public.%I enable row level security', tbl);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Policies: create ONLY when missing (never error on duplicate)
-- ---------------------------------------------------------------------------
do $$
begin
  -- profiles
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own') then
    create policy profiles_select_own on public.profiles for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_own') then
    create policy profiles_insert_own on public.profiles for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own') then
    create policy profiles_update_own on public.profiles for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_delete_own') then
    create policy profiles_delete_own on public.profiles for delete using (auth.uid() = user_id);
  end if;

  -- income_settings
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'income_settings' and policyname = 'income_settings_select_own') then
    create policy income_settings_select_own on public.income_settings for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'income_settings' and policyname = 'income_settings_insert_own') then
    create policy income_settings_insert_own on public.income_settings for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'income_settings' and policyname = 'income_settings_update_own') then
    create policy income_settings_update_own on public.income_settings for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'income_settings' and policyname = 'income_settings_delete_own') then
    create policy income_settings_delete_own on public.income_settings for delete using (auth.uid() = user_id);
  end if;

  -- net_worth_snapshots, scenarios, allocation_buckets (own-data only)
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'net_worth_snapshots' and policyname = 'net_worth_snapshots_select_own') then
    create policy net_worth_snapshots_select_own on public.net_worth_snapshots for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'net_worth_snapshots' and policyname = 'net_worth_snapshots_insert_own') then
    create policy net_worth_snapshots_insert_own on public.net_worth_snapshots for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'net_worth_snapshots' and policyname = 'net_worth_snapshots_update_own') then
    create policy net_worth_snapshots_update_own on public.net_worth_snapshots for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'net_worth_snapshots' and policyname = 'net_worth_snapshots_delete_own') then
    create policy net_worth_snapshots_delete_own on public.net_worth_snapshots for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scenarios' and policyname = 'scenarios_select_own') then
    create policy scenarios_select_own on public.scenarios for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scenarios' and policyname = 'scenarios_insert_own') then
    create policy scenarios_insert_own on public.scenarios for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scenarios' and policyname = 'scenarios_update_own') then
    create policy scenarios_update_own on public.scenarios for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'scenarios' and policyname = 'scenarios_delete_own') then
    create policy scenarios_delete_own on public.scenarios for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'allocation_buckets' and policyname = 'allocation_buckets_select_own') then
    create policy allocation_buckets_select_own on public.allocation_buckets for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'allocation_buckets' and policyname = 'allocation_buckets_insert_own') then
    create policy allocation_buckets_insert_own on public.allocation_buckets for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'allocation_buckets' and policyname = 'allocation_buckets_update_own') then
    create policy allocation_buckets_update_own on public.allocation_buckets for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'allocation_buckets' and policyname = 'allocation_buckets_delete_own') then
    create policy allocation_buckets_delete_own on public.allocation_buckets for delete using (auth.uid() = user_id);
  end if;

  -- financial_health_snapshots
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'financial_health_snapshots' and policyname = 'financial_health_snapshots_select_own') then
    create policy financial_health_snapshots_select_own on public.financial_health_snapshots for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'financial_health_snapshots' and policyname = 'financial_health_snapshots_insert_own') then
    create policy financial_health_snapshots_insert_own on public.financial_health_snapshots for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'financial_health_snapshots' and policyname = 'financial_health_snapshots_update_own') then
    create policy financial_health_snapshots_update_own on public.financial_health_snapshots for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'financial_health_snapshots' and policyname = 'financial_health_snapshots_delete_own') then
    create policy financial_health_snapshots_delete_own on public.financial_health_snapshots for delete using (auth.uid() = user_id);
  end if;

  -- households
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'households' and policyname = 'households_select_member') then
    create policy households_select_member on public.households for select
      using (public.is_active_household_member(id) or created_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'households' and policyname = 'households_insert_own') then
    create policy households_insert_own on public.households for insert with check (created_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'households' and policyname = 'households_update_admin') then
    create policy households_update_admin on public.households for update using (public.is_household_admin(id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'households' and policyname = 'households_delete_owner') then
    create policy households_delete_owner on public.households for delete using (
      exists (
        select 1 from public.household_members
        where household_id = id and user_id = auth.uid() and role = 'owner' and status = 'active'
      )
    );
  end if;

  -- household_members
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_members' and policyname = 'members_select_same_household') then
    create policy members_select_same_household on public.household_members for select
      using (public.is_active_household_member(household_id) or user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_members' and policyname = 'members_insert_admin') then
    create policy members_insert_admin on public.household_members for insert
      with check (public.is_household_admin(household_id) or user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_members' and policyname = 'members_update_admin_or_self') then
    create policy members_update_admin_or_self on public.household_members for update
      using (public.is_household_admin(household_id) or user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_members' and policyname = 'members_delete_admin') then
    create policy members_delete_admin on public.household_members for delete
      using (public.is_household_admin(household_id));
  end if;

  -- shared_accounts
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_accounts' and policyname = 'shared_accounts_select_member') then
    create policy shared_accounts_select_member on public.shared_accounts for select
      using (public.is_active_household_member(household_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_accounts' and policyname = 'shared_accounts_insert_admin') then
    create policy shared_accounts_insert_admin on public.shared_accounts for insert
      with check (public.is_household_admin(household_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_accounts' and policyname = 'shared_accounts_update_admin') then
    create policy shared_accounts_update_admin on public.shared_accounts for update
      using (public.is_household_admin(household_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'shared_accounts' and policyname = 'shared_accounts_delete_admin') then
    create policy shared_accounts_delete_admin on public.shared_accounts for delete
      using (public.is_household_admin(household_id));
  end if;

  -- household_invitations
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_invitations' and policyname = 'invitations_select_involved') then
    create policy invitations_select_involved on public.household_invitations for select using (
      invited_by = auth.uid()
      or public.is_household_admin(household_id)
      or invited_email = (select email from auth.users where id = auth.uid())
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_invitations' and policyname = 'invitations_insert_admin') then
    create policy invitations_insert_admin on public.household_invitations for insert
      with check (public.is_household_admin(household_id) and invited_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_invitations' and policyname = 'invitations_update_involved') then
    create policy invitations_update_involved on public.household_invitations for update using (
      invited_by = auth.uid()
      or public.is_household_admin(household_id)
      or invited_email = (select email from auth.users where id = auth.uid())
    );
  end if;

  -- household_activity_log
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'household_activity_log' and policyname = 'activity_log_select_member') then
    create policy activity_log_select_member on public.household_activity_log for select
      using (public.is_active_household_member(household_id));
  end if;
end $$;

-- Finance tables: upgrade to household-aware policies when visibility column exists
do $$
declare
  t text;
  has_visibility boolean;
begin
  foreach t in array array[
    'fixed_expenses', 'financial_goals', 'investment_holdings', 'mortgage_accounts',
    'assets', 'liabilities', 'sinking_funds'
  ] loop
    if not exists (
      select 1 from information_schema.tables where table_schema = 'public' and table_name = t
    ) then
      continue;
    end if;

    select exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = t and column_name = 'visibility'
    ) into has_visibility;

    if has_visibility then
      -- Household-aware policies
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select') then
        execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
        execute format(
          'create policy %I on public.%I for select using (
            public.can_read_finance_row(user_id, visibility, household_id)
          )', t || '_select', t
        );
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert_own') then
        execute format(
          'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
          t || '_insert_own', t
        );
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update') then
        execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
        execute format(
          'create policy %I on public.%I for update using (
            auth.uid() = user_id
            or (public.is_household_admin(household_id) and visibility != ''private'')
          )', t || '_update', t
        );
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_delete') then
        execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
        execute format(
          'create policy %I on public.%I for delete using (
            auth.uid() = user_id or public.is_household_admin(household_id)
          )', t || '_delete', t
        );
      end if;
    else
      -- Legacy own-data-only policies
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_select_own') then
        execute format(
          'create policy %I on public.%I for select using (auth.uid() = user_id)',
          t || '_select_own', t
        );
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_insert_own') then
        execute format(
          'create policy %I on public.%I for insert with check (auth.uid() = user_id)',
          t || '_insert_own', t
        );
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_update_own') then
        execute format(
          'create policy %I on public.%I for update using (auth.uid() = user_id)',
          t || '_update_own', t
        );
      end if;
      if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_delete_own') then
        execute format(
          'create policy %I on public.%I for delete using (auth.uid() = user_id)',
          t || '_delete_own', t
        );
      end if;
    end if;
  end loop;
end $$;

-- mortgage_extra_payments household-aware select
do $$
begin
  if not exists (
    select 1 from information_schema.tables where table_schema = 'public' and table_name = 'mortgage_extra_payments'
  ) then
    return;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'mortgage_accounts' and column_name = 'visibility'
  ) then
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_select'
    ) then
      drop policy if exists mortgage_extra_payments_select_own on public.mortgage_extra_payments;
      create policy mortgage_extra_payments_select on public.mortgage_extra_payments for select using (
        auth.uid() = user_id
        or exists (
          select 1 from public.mortgage_accounts m
          where m.id = mortgage_account_id
            and public.can_read_finance_row(m.user_id, m.visibility, m.household_id)
        )
      );
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_update'
    ) then
      create policy mortgage_extra_payments_update on public.mortgage_extra_payments for update using (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_delete'
    ) then
      create policy mortgage_extra_payments_delete on public.mortgage_extra_payments for delete using (auth.uid() = user_id);
    end if;
  else
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_select_own'
    ) then
      create policy mortgage_extra_payments_select_own on public.mortgage_extra_payments for select using (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_insert_own'
    ) then
      create policy mortgage_extra_payments_insert_own on public.mortgage_extra_payments for insert with check (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_update_own'
    ) then
      create policy mortgage_extra_payments_update_own on public.mortgage_extra_payments for update using (auth.uid() = user_id);
    end if;
    if not exists (
      select 1 from pg_policies where schemaname = 'public' and tablename = 'mortgage_extra_payments' and policyname = 'mortgage_extra_payments_delete_own'
    ) then
      create policy mortgage_extra_payments_delete_own on public.mortgage_extra_payments for delete using (auth.uid() = user_id);
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'profiles', 'income_settings', 'fixed_expenses', 'sinking_funds', 'allocation_buckets',
    'financial_goals', 'assets', 'liabilities', 'net_worth_snapshots', 'scenarios',
    'investment_holdings', 'mortgage_accounts', 'mortgage_extra_payments',
    'households', 'household_members', 'shared_accounts', 'financial_health_snapshots'
  ] loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      execute format('drop trigger if exists set_updated_at on public.%I', tbl);
      execute format(
        'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
        tbl
      );
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Household RPC functions (CREATE OR REPLACE)
-- ---------------------------------------------------------------------------
create or replace function public.log_household_activity(
  p_household_id uuid,
  p_actor_user_id uuid,
  p_event_type text,
  p_target_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_actor_user_id is distinct from auth.uid() then
    raise exception 'Actor must be the authenticated user';
  end if;
  if not public.is_active_household_member(p_household_id) then
    raise exception 'Not a member of this household';
  end if;
  insert into public.household_activity_log (
    household_id, actor_user_id, event_type, target_user_id, metadata
  ) values (
    p_household_id, p_actor_user_id, p_event_type, p_target_user_id, p_metadata
  );
end;
$$;

create or replace function public.accept_household_invitation(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  uid uuid := auth.uid();
  user_email text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select email into user_email from auth.users where id = uid;

  select * into inv from public.household_invitations
  where token = invite_token and status = 'pending' and expires_at > now()
  for update;

  if inv is null then raise exception 'Invalid or expired invitation'; end if;
  if lower(inv.invited_email) != lower(user_email) then
    raise exception 'Invitation email does not match your account';
  end if;

  update public.household_invitations set status = 'accepted' where id = inv.id;

  insert into public.household_members (household_id, user_id, role, status)
  values (inv.household_id, uid, 'member', 'active')
  on conflict (household_id, user_id) do update
  set status = 'active', role = 'member', updated_at = now();

  perform public.log_household_activity(
    inv.household_id, uid, 'member_joined', uid,
    jsonb_build_object('invited_email', inv.invited_email)
  );

  return inv.household_id;
end;
$$;

create or replace function public.transfer_household_ownership(p_household_id uuid, p_new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  old_owner_id uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select user_id into old_owner_id from public.household_members
  where household_id = p_household_id and role = 'owner' and status = 'active';
  if old_owner_id is null or old_owner_id != uid then
    raise exception 'Only the household owner can transfer ownership';
  end if;
  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = p_new_owner_id and status = 'active'
  ) then
    raise exception 'New owner must be an active household member';
  end if;
  if p_new_owner_id = uid then raise exception 'Cannot transfer ownership to yourself'; end if;

  update public.household_members set role = 'member', updated_at = now()
  where household_id = p_household_id and user_id = uid;
  update public.household_members set role = 'owner', updated_at = now()
  where household_id = p_household_id and user_id = p_new_owner_id;
  update public.households set created_by = p_new_owner_id, updated_at = now()
  where id = p_household_id;

  perform public.log_household_activity(
    p_household_id, uid, 'ownership_transferred', p_new_owner_id,
    jsonb_build_object('from_user_id', uid, 'to_user_id', p_new_owner_id)
  );
end;
$$;

create or replace function public.leave_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  member_role text;
  other_active_count int;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select role into member_role from public.household_members
  where household_id = p_household_id and user_id = uid and status = 'active';
  if member_role is null then raise exception 'Not an active member of this household'; end if;

  if member_role = 'owner' then
    select count(*) into other_active_count from public.household_members
    where household_id = p_household_id and status = 'active' and user_id != uid;
    if other_active_count > 0 then
      raise exception 'Owner must transfer ownership or delete the household before leaving';
    end if;
    perform public.log_household_activity(p_household_id, uid, 'household_deleted', null, '{}'::jsonb);
    delete from public.households where id = p_household_id;
    return;
  end if;

  update public.household_members set status = 'removed', updated_at = now()
  where household_id = p_household_id and user_id = uid;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'dashboard_view'
  ) then
    update public.profiles set dashboard_view = 'personal', updated_at = now() where user_id = uid;
  end if;

  perform public.log_household_activity(p_household_id, uid, 'member_left', uid, '{}'::jsonb);
end;
$$;

create or replace function public.remove_household_member(p_household_id uuid, p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  target_role text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.is_household_admin(p_household_id) then
    raise exception 'Only owners or admins can remove members';
  end if;
  if p_target_user_id = uid then raise exception 'Use leave household to remove yourself'; end if;

  select role into target_role from public.household_members
  where household_id = p_household_id and user_id = p_target_user_id and status = 'active';
  if target_role is null then raise exception 'Member not found or already removed'; end if;
  if target_role = 'owner' then raise exception 'Cannot remove the household owner. Transfer ownership first.'; end if;

  update public.household_members set status = 'removed', updated_at = now()
  where household_id = p_household_id and user_id = p_target_user_id;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'dashboard_view'
  ) then
    update public.profiles set dashboard_view = 'personal', updated_at = now()
    where user_id = p_target_user_id;
  end if;

  perform public.log_household_activity(
    p_household_id, uid, 'member_removed', p_target_user_id, '{}'::jsonb
  );
end;
$$;

create or replace function public.delete_household(p_household_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not exists (
    select 1 from public.household_members
    where household_id = p_household_id and user_id = uid and role = 'owner' and status = 'active'
  ) then
    raise exception 'Only the household owner can delete the household';
  end if;
  perform public.log_household_activity(p_household_id, uid, 'household_deleted', null, '{}'::jsonb);
  delete from public.households where id = p_household_id;
end;
$$;

create or replace function public.unlink_shared_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  acc record;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into acc from public.shared_accounts where id = p_account_id;
  if acc is null then raise exception 'Shared account not found'; end if;
  if not public.is_household_admin(acc.household_id) then
    raise exception 'Only owners or admins can unlink shared accounts';
  end if;
  perform public.log_household_activity(
    acc.household_id, uid, 'shared_account_unlinked', null,
    jsonb_build_object('account_id', p_account_id, 'account_name', acc.name)
  );
  delete from public.shared_accounts where id = p_account_id;
end;
$$;

-- Signup trigger (create profile + income row)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;

  insert into public.income_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grants
grant execute on function public.is_active_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.can_read_finance_row(uuid, text, uuid) to authenticated;
grant execute on function public.log_household_activity(uuid, uuid, text, uuid, jsonb) to authenticated;
grant execute on function public.accept_household_invitation(text) to authenticated;
grant execute on function public.transfer_household_ownership(uuid, uuid) to authenticated;
grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.delete_household(uuid) to authenticated;
grant execute on function public.unlink_shared_account(uuid) to authenticated;
