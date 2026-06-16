-- One-time setup flow: track completion and user's initial choice

alter table public.profiles
  add column if not exists setup_completed boolean not null default false;

alter table public.profiles
  add column if not exists setup_choice text
    check (setup_choice is null or setup_choice in ('individual', 'create_household', 'join_household'));

-- Existing users: do not force onboarding again
update public.profiles
set setup_completed = true
where onboarding_completed = true;

update public.profiles
set setup_completed = true,
    setup_choice = coalesce(setup_choice, 'individual')
where setup_completed = false
  and user_id in (select distinct user_id from public.income_settings);

update public.profiles
set setup_completed = true
where setup_completed = false
  and user_id in (select distinct user_id from public.household_members where status = 'active');
