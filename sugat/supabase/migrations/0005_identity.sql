-- Sugat — stage 2 identity: what the pending member can see, and the one
-- membership invariant application code must not be trusted to hold.

-- ------------------------------------------------------- the pending member

-- `is_org_member` deliberately means *active* member: it gates every domain
-- table. But a member sitting in the approval queue still has to be told which
-- organization they are waiting on, and `orgs_read` as written in 0002 hides
-- the org from them entirely. This is the weaker check — any membership row at
-- all, in any status — and it is used for exactly one thing: reading the org
-- the caller has a relationship with.
create function public.has_org_membership(org uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = org and m.profile_id = auth.uid()
  );
$$;

drop policy orgs_read on organizations;

create policy orgs_read on organizations
  for select using (public.has_org_membership(id));

-- The auth trigger in 0001 creates the profile row for every new user, so this
-- is a backstop rather than the primary path — it keeps a user whose profile
-- row is missing (restored database, manually inserted auth user) from being
-- permanently unable to complete onboarding.
create policy profiles_self_insert on profiles
  for insert with check (id = auth.uid());

-- ------------------------------------------------------- the last admin

-- Role changes go through the `memberships_admin_write` policy, which is
-- correct about *who* may write but says nothing about the result. An admin
-- demoting or suspending themselves while they are the only active admin locks
-- the organization out of its own console, with no recovery path inside the
-- product. Enforced here rather than in a Server Action for the same reason the
-- ticketing rules are: application code is one caller among several, and two
-- admins demoting each other concurrently would slip past a read-then-write
-- check anyway.
create function public.prevent_last_admin_removal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  -- Only a transition *out* of active admin can strip the last one.
  if old.role = 'admin' and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active') then

    select count(*) into remaining
      from memberships m
     where m.org_id = old.org_id
       and m.role = 'admin'
       and m.status = 'active'
       and m.id <> old.id;

    if remaining = 0 then
      raise exception 'an organization must keep at least one active admin'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger memberships_keep_one_admin
  before update on memberships
  for each row execute function public.prevent_last_admin_removal();

create function public.prevent_last_admin_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer;
begin
  if old.role = 'admin' and old.status = 'active' then
    select count(*) into remaining
      from memberships m
     where m.org_id = old.org_id
       and m.role = 'admin'
       and m.status = 'active'
       and m.id <> old.id;

    if remaining = 0 then
      raise exception 'an organization must keep at least one active admin'
        using errcode = '23514';
    end if;
  end if;

  return old;
end;
$$;

-- Deleting the organization cascades to its memberships, and that must not trip
-- the guard; the trigger is skipped when the parent row is already gone.
create trigger memberships_keep_one_admin_on_delete
  before delete on memberships
  for each row
  when (exists (select 1 from organizations o where o.id = old.org_id))
  execute function public.prevent_last_admin_delete();

-- ------------------------------------------------------- suspension stamp

-- `suspended_at` exists in 0001 but nothing sets it. The admin table reads it,
-- so it is maintained here rather than by every caller that flips a status.
create function public.stamp_suspension()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'suspended' and old.status <> 'suspended' then
    new.suspended_at := now();
  elsif new.status <> 'suspended' then
    new.suspended_at := null;
  end if;
  return new;
end;
$$;

create trigger memberships_stamp_suspension
  before update of status on memberships
  for each row execute function public.stamp_suspension();

-- ------------------------------------------------------- grants

grant execute on function public.has_org_membership(uuid) to authenticated;
