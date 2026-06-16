-- Platform features: goal priority, allocation-goal links, financial health snapshots

alter table public.financial_goals
  add column if not exists priority integer not null default 3
    check (priority >= 1 and priority <= 5);

alter table public.allocation_buckets
  add column if not exists goal_id uuid references public.financial_goals(id) on delete set null;

create table if not exists public.financial_health_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid references public.households(id) on delete set null,
  score integer not null check (score >= 0 and score <= 100),
  rating text not null,
  category_scores jsonb not null default '{}'::jsonb,
  suggestions jsonb not null default '[]'::jsonb,
  snapshot_date timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_health_snapshots_user_id_idx
  on public.financial_health_snapshots(user_id);

create index if not exists financial_health_snapshots_user_date_idx
  on public.financial_health_snapshots(user_id, snapshot_date desc);

alter table public.financial_health_snapshots enable row level security;

create policy "financial_health_snapshots_select_own"
  on public.financial_health_snapshots for select using (auth.uid() = user_id);
create policy "financial_health_snapshots_insert_own"
  on public.financial_health_snapshots for insert with check (auth.uid() = user_id);
create policy "financial_health_snapshots_update_own"
  on public.financial_health_snapshots for update using (auth.uid() = user_id);
create policy "financial_health_snapshots_delete_own"
  on public.financial_health_snapshots for delete using (auth.uid() = user_id);
