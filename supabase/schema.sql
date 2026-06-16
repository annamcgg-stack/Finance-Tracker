-- Finance Tracker database schema
-- Run in Supabase SQL Editor or via CLI migrations

-- ---------------------------------------------------------------------------
-- Profiles (one row per user)
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

-- ---------------------------------------------------------------------------
-- Income settings (one row per user)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Fixed expenses
-- ---------------------------------------------------------------------------
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
create index if not exists fixed_expenses_user_id_idx on public.fixed_expenses(user_id);

-- ---------------------------------------------------------------------------
-- Sinking funds
-- ---------------------------------------------------------------------------
create table if not exists public.sinking_funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  annual_target numeric not null default 0,
  current_balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sinking_funds_user_id_idx on public.sinking_funds(user_id);

-- ---------------------------------------------------------------------------
-- Allocation buckets
-- ---------------------------------------------------------------------------
create table if not exists public.allocation_buckets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  percentage numeric not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists allocation_buckets_user_id_idx on public.allocation_buckets(user_id);

-- ---------------------------------------------------------------------------
-- Financial goals
-- ---------------------------------------------------------------------------
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
create index if not exists financial_goals_user_id_idx on public.financial_goals(user_id);

-- ---------------------------------------------------------------------------
-- Assets
-- ---------------------------------------------------------------------------
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  asset_type text not null default 'other',
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists assets_user_id_idx on public.assets(user_id);

-- ---------------------------------------------------------------------------
-- Liabilities
-- ---------------------------------------------------------------------------
create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  liability_type text not null default 'other',
  value numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists liabilities_user_id_idx on public.liabilities(user_id);

-- ---------------------------------------------------------------------------
-- Net worth snapshots
-- ---------------------------------------------------------------------------
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
create index if not exists net_worth_snapshots_user_id_idx on public.net_worth_snapshots(user_id);

-- ---------------------------------------------------------------------------
-- Scenarios
-- ---------------------------------------------------------------------------
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
create index if not exists scenarios_user_id_idx on public.scenarios(user_id);

-- ---------------------------------------------------------------------------
-- Investment holdings
-- ---------------------------------------------------------------------------
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
create index if not exists investment_holdings_user_id_idx on public.investment_holdings(user_id);

-- ---------------------------------------------------------------------------
-- Mortgage accounts
-- ---------------------------------------------------------------------------
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
create index if not exists mortgage_accounts_user_id_idx on public.mortgage_accounts(user_id);

-- ---------------------------------------------------------------------------
-- Mortgage extra payments
-- ---------------------------------------------------------------------------
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
create index if not exists mortgage_extra_payments_user_id_idx on public.mortgage_extra_payments(user_id);
create index if not exists mortgage_extra_payments_mortgage_id_idx on public.mortgage_extra_payments(mortgage_account_id);

-- ---------------------------------------------------------------------------
-- Updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles','income_settings','fixed_expenses','sinking_funds',
    'allocation_buckets','financial_goals','assets','liabilities',
    'net_worth_snapshots','scenarios','investment_holdings',
    'mortgage_accounts','mortgage_extra_payments'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.income_settings enable row level security;
alter table public.fixed_expenses enable row level security;
alter table public.sinking_funds enable row level security;
alter table public.allocation_buckets enable row level security;
alter table public.financial_goals enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.net_worth_snapshots enable row level security;
alter table public.scenarios enable row level security;
alter table public.investment_holdings enable row level security;
alter table public.mortgage_accounts enable row level security;
alter table public.mortgage_extra_payments enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = user_id);

-- Income settings
create policy "income_settings_select_own" on public.income_settings for select using (auth.uid() = user_id);
create policy "income_settings_insert_own" on public.income_settings for insert with check (auth.uid() = user_id);
create policy "income_settings_update_own" on public.income_settings for update using (auth.uid() = user_id);
create policy "income_settings_delete_own" on public.income_settings for delete using (auth.uid() = user_id);

-- Fixed expenses
create policy "fixed_expenses_select_own" on public.fixed_expenses for select using (auth.uid() = user_id);
create policy "fixed_expenses_insert_own" on public.fixed_expenses for insert with check (auth.uid() = user_id);
create policy "fixed_expenses_update_own" on public.fixed_expenses for update using (auth.uid() = user_id);
create policy "fixed_expenses_delete_own" on public.fixed_expenses for delete using (auth.uid() = user_id);

-- Sinking funds
create policy "sinking_funds_select_own" on public.sinking_funds for select using (auth.uid() = user_id);
create policy "sinking_funds_insert_own" on public.sinking_funds for insert with check (auth.uid() = user_id);
create policy "sinking_funds_update_own" on public.sinking_funds for update using (auth.uid() = user_id);
create policy "sinking_funds_delete_own" on public.sinking_funds for delete using (auth.uid() = user_id);

-- Allocation buckets
create policy "allocation_buckets_select_own" on public.allocation_buckets for select using (auth.uid() = user_id);
create policy "allocation_buckets_insert_own" on public.allocation_buckets for insert with check (auth.uid() = user_id);
create policy "allocation_buckets_update_own" on public.allocation_buckets for update using (auth.uid() = user_id);
create policy "allocation_buckets_delete_own" on public.allocation_buckets for delete using (auth.uid() = user_id);

-- Financial goals
create policy "financial_goals_select_own" on public.financial_goals for select using (auth.uid() = user_id);
create policy "financial_goals_insert_own" on public.financial_goals for insert with check (auth.uid() = user_id);
create policy "financial_goals_update_own" on public.financial_goals for update using (auth.uid() = user_id);
create policy "financial_goals_delete_own" on public.financial_goals for delete using (auth.uid() = user_id);

-- Assets
create policy "assets_select_own" on public.assets for select using (auth.uid() = user_id);
create policy "assets_insert_own" on public.assets for insert with check (auth.uid() = user_id);
create policy "assets_update_own" on public.assets for update using (auth.uid() = user_id);
create policy "assets_delete_own" on public.assets for delete using (auth.uid() = user_id);

-- Liabilities
create policy "liabilities_select_own" on public.liabilities for select using (auth.uid() = user_id);
create policy "liabilities_insert_own" on public.liabilities for insert with check (auth.uid() = user_id);
create policy "liabilities_update_own" on public.liabilities for update using (auth.uid() = user_id);
create policy "liabilities_delete_own" on public.liabilities for delete using (auth.uid() = user_id);

-- Net worth snapshots
create policy "net_worth_snapshots_select_own" on public.net_worth_snapshots for select using (auth.uid() = user_id);
create policy "net_worth_snapshots_insert_own" on public.net_worth_snapshots for insert with check (auth.uid() = user_id);
create policy "net_worth_snapshots_update_own" on public.net_worth_snapshots for update using (auth.uid() = user_id);
create policy "net_worth_snapshots_delete_own" on public.net_worth_snapshots for delete using (auth.uid() = user_id);

-- Scenarios
create policy "scenarios_select_own" on public.scenarios for select using (auth.uid() = user_id);
create policy "scenarios_insert_own" on public.scenarios for insert with check (auth.uid() = user_id);
create policy "scenarios_update_own" on public.scenarios for update using (auth.uid() = user_id);
create policy "scenarios_delete_own" on public.scenarios for delete using (auth.uid() = user_id);

-- Investment holdings
create policy "investment_holdings_select_own" on public.investment_holdings for select using (auth.uid() = user_id);
create policy "investment_holdings_insert_own" on public.investment_holdings for insert with check (auth.uid() = user_id);
create policy "investment_holdings_update_own" on public.investment_holdings for update using (auth.uid() = user_id);
create policy "investment_holdings_delete_own" on public.investment_holdings for delete using (auth.uid() = user_id);

-- Mortgage accounts
create policy "mortgage_accounts_select_own" on public.mortgage_accounts for select using (auth.uid() = user_id);
create policy "mortgage_accounts_insert_own" on public.mortgage_accounts for insert with check (auth.uid() = user_id);
create policy "mortgage_accounts_update_own" on public.mortgage_accounts for update using (auth.uid() = user_id);
create policy "mortgage_accounts_delete_own" on public.mortgage_accounts for delete using (auth.uid() = user_id);

-- Mortgage extra payments
create policy "mortgage_extra_payments_select_own" on public.mortgage_extra_payments for select using (auth.uid() = user_id);
create policy "mortgage_extra_payments_insert_own" on public.mortgage_extra_payments for insert with check (auth.uid() = user_id);
create policy "mortgage_extra_payments_update_own" on public.mortgage_extra_payments for update using (auth.uid() = user_id);
create policy "mortgage_extra_payments_delete_own" on public.mortgage_extra_payments for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;

  insert into public.income_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
