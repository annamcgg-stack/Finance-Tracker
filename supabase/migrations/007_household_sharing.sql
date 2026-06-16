-- Household sharing: households, members, invitations, shared accounts, visibility

-- ---------------------------------------------------------------------------
-- Households
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
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, user_id)
);
create index if not exists household_members_user_id_idx on public.household_members(user_id);
create index if not exists household_members_household_id_idx on public.household_members(household_id);

create table if not exists public.shared_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type text not null default 'other' check (type in ('bank', 'savings', 'investment', 'mortgage', 'loan', 'property', 'other')),
  balance numeric not null default 0,
  currency text not null default 'AUD',
  ownership_type text not null default 'shared' check (ownership_type in ('shared', 'mine', 'partner')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists shared_accounts_household_id_idx on public.shared_accounts(household_id);

create table if not exists public.household_invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  invited_email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);
create index if not exists household_invitations_token_idx on public.household_invitations(token);
create index if not exists household_invitations_email_idx on public.household_invitations(invited_email);

-- Profile onboarding / dashboard preferences
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists dashboard_view text not null default 'personal'
    check (dashboard_view in ('personal', 'shared', 'combined'));

-- Visibility columns on finance tables (default private)
alter table public.fixed_expenses
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null,
  add column if not exists split_type text not null default '50_50'
    check (split_type in ('50_50', 'percentage', 'custom')),
  add column if not exists user_contribution_amount numeric not null default 0,
  add column if not exists partner_contribution_amount numeric not null default 0,
  add column if not exists user_contribution_percent numeric not null default 50;

alter table public.financial_goals
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null,
  add column if not exists user_contribution_amount numeric not null default 0,
  add column if not exists partner_contribution_amount numeric not null default 0;

alter table public.investment_holdings
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null,
  add column if not exists ownership_percent numeric not null default 100,
  add column if not exists user_contribution_amount numeric not null default 0,
  add column if not exists partner_contribution_amount numeric not null default 0;

alter table public.mortgage_accounts
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null,
  add column if not exists ownership_split_percent numeric not null default 50,
  add column if not exists user_repayment_contribution numeric not null default 0,
  add column if not exists partner_repayment_contribution numeric not null default 0;

alter table public.mortgage_extra_payments
  add column if not exists paid_by_user_id uuid references auth.users(id) on delete set null;

alter table public.assets
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null;

alter table public.liabilities
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null;

alter table public.sinking_funds
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'household', 'shared_account_only')),
  add column if not exists household_id uuid references public.households(id) on delete set null,
  add column if not exists shared_account_id uuid references public.shared_accounts(id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS helper functions
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
-- Enable RLS on new tables
-- ---------------------------------------------------------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.shared_accounts enable row level security;
alter table public.household_invitations enable row level security;

-- Households
create policy "households_select_member" on public.households for select
  using (public.is_active_household_member(id) or created_by = auth.uid());
create policy "households_insert_own" on public.households for insert
  with check (created_by = auth.uid());
create policy "households_update_admin" on public.households for update
  using (public.is_household_admin(id));
create policy "households_delete_owner" on public.households for delete
  using (
    exists (
      select 1 from public.household_members
      where household_id = id and user_id = auth.uid() and role = 'owner' and status = 'active'
    )
  );

-- Household members
create policy "members_select_same_household" on public.household_members for select
  using (public.is_active_household_member(household_id) or user_id = auth.uid());
create policy "members_insert_admin" on public.household_members for insert
  with check (public.is_household_admin(household_id) or user_id = auth.uid());
create policy "members_update_admin_or_self" on public.household_members for update
  using (public.is_household_admin(household_id) or user_id = auth.uid());
create policy "members_delete_admin" on public.household_members for delete
  using (public.is_household_admin(household_id));

-- Shared accounts
create policy "shared_accounts_select_member" on public.shared_accounts for select
  using (public.is_active_household_member(household_id));
create policy "shared_accounts_insert_admin" on public.shared_accounts for insert
  with check (public.is_household_admin(household_id));
create policy "shared_accounts_update_admin" on public.shared_accounts for update
  using (public.is_household_admin(household_id));
create policy "shared_accounts_delete_admin" on public.shared_accounts for delete
  using (public.is_household_admin(household_id));

-- Invitations
create policy "invitations_select_involved" on public.household_invitations for select
  using (
    invited_by = auth.uid()
    or public.is_household_admin(household_id)
    or invited_email = (select email from auth.users where id = auth.uid())
  );
create policy "invitations_insert_admin" on public.household_invitations for insert
  with check (public.is_household_admin(household_id) and invited_by = auth.uid());
create policy "invitations_update_involved" on public.household_invitations for update
  using (
    invited_by = auth.uid()
    or public.is_household_admin(household_id)
    or invited_email = (select email from auth.users where id = auth.uid())
  );

-- Update finance table RLS (drop old policies, add new)
do $$
declare
  t text;
  tables text[] := array[
    'fixed_expenses','financial_goals','investment_holdings','mortgage_accounts',
    'assets','liabilities','sinking_funds'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select using (
        public.can_read_finance_row(user_id, visibility, household_id)
      )', t || '_select', t
    );
    execute format(
      'create policy %I on public.%I for insert with check (auth.uid() = user_id)', t || '_insert_own', t
    );
    execute format(
      'create policy %I on public.%I for update using (
        auth.uid() = user_id
        or (public.is_household_admin(household_id) and visibility != ''private'')
      )', t || '_update', t
    );
    execute format(
      'create policy %I on public.%I for delete using (
        auth.uid() = user_id
        or public.is_household_admin(household_id)
      )', t || '_delete', t
    );
  end loop;
end $$;

-- Mortgage extra payments: readable if mortgage is readable
drop policy if exists mortgage_extra_payments_select_own on public.mortgage_extra_payments;
drop policy if exists mortgage_extra_payments_update_own on public.mortgage_extra_payments;
drop policy if exists mortgage_extra_payments_delete_own on public.mortgage_extra_payments;

create policy "mortgage_extra_payments_select" on public.mortgage_extra_payments for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.mortgage_accounts m
      where m.id = mortgage_account_id
        and public.can_read_finance_row(m.user_id, m.visibility, m.household_id)
    )
  );
create policy "mortgage_extra_payments_update" on public.mortgage_extra_payments for update
  using (auth.uid() = user_id);
create policy "mortgage_extra_payments_delete" on public.mortgage_extra_payments for delete
  using (auth.uid() = user_id);

-- Triggers for updated_at
drop trigger if exists set_updated_at on public.households;
create trigger set_updated_at before update on public.households
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.household_members;
create trigger set_updated_at before update on public.household_members
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.shared_accounts;
create trigger set_updated_at before update on public.shared_accounts
  for each row execute function public.set_updated_at();

-- Accept invitation function
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
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into user_email from auth.users where id = uid;

  select * into inv from public.household_invitations
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  for update;

  if inv is null then
    raise exception 'Invalid or expired invitation';
  end if;

  if lower(inv.invited_email) != lower(user_email) then
    raise exception 'Invitation email does not match your account';
  end if;

  update public.household_invitations
  set status = 'accepted'
  where id = inv.id;

  insert into public.household_members (household_id, user_id, role, status)
  values (inv.household_id, uid, 'member', 'active')
  on conflict (household_id, user_id) do update
  set status = 'active', role = 'member', updated_at = now();

  return inv.household_id;
end;
$$;

grant execute on function public.accept_household_invitation(text) to authenticated;
grant execute on function public.is_active_household_member(uuid) to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.can_read_finance_row(uuid, text, uuid) to authenticated;
