-- Household unlink: activity log, ownership transfer, secure leave/remove RPCs

-- ---------------------------------------------------------------------------
-- Activity log
-- ---------------------------------------------------------------------------
create table if not exists public.household_activity_log (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in (
    'member_invited', 'member_joined', 'member_removed', 'member_left',
    'household_deleted', 'shared_account_created', 'shared_account_unlinked',
    'ownership_transferred'
  )),
  target_user_id uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists household_activity_log_household_id_idx
  on public.household_activity_log(household_id);
create index if not exists household_activity_log_created_at_idx
  on public.household_activity_log(created_at desc);

alter table public.household_activity_log enable row level security;

create policy "activity_log_select_member" on public.household_activity_log for select
  using (public.is_active_household_member(household_id));

-- Inserts only via security definer functions

-- ---------------------------------------------------------------------------
-- Log helper (internal)
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

-- ---------------------------------------------------------------------------
-- Transfer ownership
-- ---------------------------------------------------------------------------
create or replace function public.transfer_household_ownership(
  p_household_id uuid,
  p_new_owner_id uuid
)
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

  select user_id into old_owner_id
  from public.household_members
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

  if p_new_owner_id = uid then
    raise exception 'Cannot transfer ownership to yourself';
  end if;

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

-- ---------------------------------------------------------------------------
-- Leave household (non-owner, or owner after transfer / sole member delete path)
-- ---------------------------------------------------------------------------
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

  select role into member_role
  from public.household_members
  where household_id = p_household_id and user_id = uid and status = 'active';

  if member_role is null then raise exception 'Not an active member of this household'; end if;

  if member_role = 'owner' then
    select count(*) into other_active_count
    from public.household_members
    where household_id = p_household_id and status = 'active' and user_id != uid;

    if other_active_count > 0 then
      raise exception 'Owner must transfer ownership or delete the household before leaving';
    end if;

    perform public.log_household_activity(p_household_id, uid, 'household_deleted', null, '{}'::jsonb);
    delete from public.households where id = p_household_id;
    return;
  end if;

  update public.household_members
  set status = 'removed', updated_at = now()
  where household_id = p_household_id and user_id = uid;

  update public.profiles set dashboard_view = 'personal', updated_at = now()
  where user_id = uid;

  perform public.log_household_activity(p_household_id, uid, 'member_left', uid, '{}'::jsonb);
end;
$$;

-- ---------------------------------------------------------------------------
-- Remove member (admin/owner)
-- ---------------------------------------------------------------------------
create or replace function public.remove_household_member(
  p_household_id uuid,
  p_target_user_id uuid
)
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

  if p_target_user_id = uid then
    raise exception 'Use leave household to remove yourself';
  end if;

  select role into target_role
  from public.household_members
  where household_id = p_household_id and user_id = p_target_user_id and status = 'active';

  if target_role is null then raise exception 'Member not found or already removed'; end if;

  if target_role = 'owner' then
    raise exception 'Cannot remove the household owner. Transfer ownership first.';
  end if;

  update public.household_members
  set status = 'removed', updated_at = now()
  where household_id = p_household_id and user_id = p_target_user_id;

  update public.profiles set dashboard_view = 'personal', updated_at = now()
  where user_id = p_target_user_id;

  perform public.log_household_activity(
    p_household_id, uid, 'member_removed', p_target_user_id, '{}'::jsonb
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Delete household (owner only, explicit)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Unlink shared account
-- ---------------------------------------------------------------------------
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

-- Update accept invitation to log member_joined
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

grant execute on function public.log_household_activity(uuid, uuid, text, uuid, jsonb) to authenticated;
grant execute on function public.transfer_household_ownership(uuid, uuid) to authenticated;
grant execute on function public.leave_household(uuid) to authenticated;
grant execute on function public.remove_household_member(uuid, uuid) to authenticated;
grant execute on function public.delete_household(uuid) to authenticated;
grant execute on function public.unlink_shared_account(uuid) to authenticated;
