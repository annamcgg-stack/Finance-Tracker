-- Profile preferences: default dashboard mode (alias for dashboard_view)

alter table public.profiles
  add column if not exists default_dashboard_mode text not null default 'individual'
    check (default_dashboard_mode in ('individual', 'household', 'combined'));

-- Backfill from legacy dashboard_view column when present
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'dashboard_view'
  ) then
    update public.profiles
    set default_dashboard_mode = case dashboard_view
      when 'shared' then 'household'
      when 'combined' then 'combined'
      else 'individual'
    end
    where default_dashboard_mode = 'individual';
  end if;
end $$;

-- Ensure onboarding_completed exists (from migration 007)
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

alter table public.profiles
  add column if not exists dashboard_view text not null default 'personal'
    check (dashboard_view in ('personal', 'shared', 'combined'));
