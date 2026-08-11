-- Sugather — row level security
--
-- Membership checks route through SECURITY DEFINER helpers. This is not
-- decoration: a policy on `memberships` that itself selects from `memberships`
-- recurses and the planner rejects it. The helpers bypass RLS internally, so
-- every other policy can call them freely.

-- ---------------------------------------------------------------- helpers

create function public.is_org_member(org uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = org and m.profile_id = auth.uid() and m.status = 'active'
  );
$$;

create function public.current_member_role(org uuid)
returns member_role language sql security definer stable set search_path = public as $$
  select m.role from memberships m
  where m.org_id = org and m.profile_id = auth.uid() and m.status = 'active';
$$;

create function public.is_org_admin(org uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select public.current_member_role(org) = 'admin';
$$;

-- Moderators and admins share the moderation surface.
create function public.is_org_moderator(org uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select public.current_member_role(org) in ('admin', 'moderator');
$$;

-- Committee members create events; admins may touch any of them.
create function public.can_manage_events(org uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select public.current_member_role(org) in ('admin', 'committee');
$$;

-- Rule 4: scoped to one event, grants nothing else anywhere.
create function public.is_event_checker(evt uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from event_checkers c
    where c.event_id = evt and c.profile_id = auth.uid()
  );
$$;

-- Directory visibility: people who share at least one active org.
create function public.shares_org(p uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1
    from memberships a
    join memberships b on a.org_id = b.org_id
    where a.profile_id = auth.uid() and a.status = 'active'
      and b.profile_id = p and b.status <> 'suspended'
  );
$$;

create function public.is_thread_member(t uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from thread_members tm
    where tm.thread_id = t and tm.profile_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------- enable

alter table profiles           enable row level security;
alter table organizations      enable row level security;
alter table memberships        enable row level security;
alter table invitations        enable row level security;
alter table posts              enable row level security;
alter table comments           enable row level security;
alter table reactions          enable row level security;
alter table follows            enable row level security;
alter table events             enable row level security;
alter table registrations      enable row level security;
alter table tickets            enable row level security;
alter table event_checkers     enable row level security;
alter table threads            enable row level security;
alter table thread_members     enable row level security;
alter table messages           enable row level security;
alter table polls              enable row level security;
alter table poll_options       enable row level security;
alter table votes              enable row level security;
alter table plans              enable row level security;
alter table subscriptions      enable row level security;
alter table payments           enable row level security;
alter table moderation_reports enable row level security;
alter table notifications      enable row level security;

-- ---------------------------------------------------------------- identity

create policy profiles_self_read on profiles
  for select using (id = auth.uid() or public.shares_org(id));

create policy profiles_self_write on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Orgs are created through public.create_organization(), never by direct
-- insert — a bare insert could not also grant the creator their admin row.
create policy orgs_read on organizations
  for select using (public.is_org_member(id));

create policy orgs_admin_update on organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy memberships_read on memberships
  for select using (public.is_org_member(org_id) or profile_id = auth.uid());

create policy memberships_admin_write on memberships
  for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy memberships_admin_delete on memberships
  for delete using (public.is_org_admin(org_id));

create policy invitations_admin_all on invitations
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

-- ---------------------------------------------------------------- social

create policy posts_read on posts
  for select using (public.is_org_member(org_id));

create policy posts_author_insert on posts
  for insert with check (public.is_org_member(org_id) and author_id = auth.uid());

create policy posts_author_update on posts
  for update using (public.is_org_member(org_id) and author_id = auth.uid())
  with check (author_id = auth.uid());

-- Moderators hide content; they never delete it, so the audit trail survives.
create policy posts_moderator_update on posts
  for update using (public.is_org_moderator(org_id)) with check (public.is_org_moderator(org_id));

create policy posts_author_delete on posts
  for delete using (author_id = auth.uid() or public.is_org_moderator(org_id));

create policy comments_read on comments
  for select using (public.is_org_member(org_id));

create policy comments_author_insert on comments
  for insert with check (public.is_org_member(org_id) and author_id = auth.uid());

create policy comments_author_update on comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy comments_moderator_update on comments
  for update using (public.is_org_moderator(org_id)) with check (public.is_org_moderator(org_id));

create policy comments_delete on comments
  for delete using (author_id = auth.uid() or public.is_org_moderator(org_id));

create policy reactions_read on reactions
  for select using (public.is_org_member(org_id));

create policy reactions_own_insert on reactions
  for insert with check (public.is_org_member(org_id) and profile_id = auth.uid());

create policy reactions_own_delete on reactions
  for delete using (profile_id = auth.uid());

create policy follows_read on follows
  for select using (public.is_org_member(org_id));

create policy follows_own_write on follows
  for all using (follower_id = auth.uid())
  with check (public.is_org_member(org_id) and follower_id = auth.uid());

-- ---------------------------------------------------------------- events

create policy events_read on events
  for select using (public.is_org_member(org_id));

create policy events_committee_insert on events
  for insert with check (public.can_manage_events(org_id) and created_by = auth.uid());

-- Committee members may only edit what they created; admins may edit anything.
create policy events_committee_update on events
  for update using (
    public.is_org_admin(org_id)
    or (public.can_manage_events(org_id) and created_by = auth.uid())
  )
  with check (
    public.is_org_admin(org_id)
    or (public.can_manage_events(org_id) and created_by = auth.uid())
  );

create policy events_admin_delete on events
  for delete using (public.is_org_admin(org_id));

create policy registrations_read on registrations
  for select using (profile_id = auth.uid() or public.can_manage_events(org_id) or public.is_org_admin(org_id));

create policy registrations_own_insert on registrations
  for insert with check (public.is_org_member(org_id) and profile_id = auth.uid());

create policy registrations_own_update on registrations
  for update using (profile_id = auth.uid() or public.is_org_admin(org_id))
  with check (profile_id = auth.uid() or public.is_org_admin(org_id));

-- Tickets are readable by the holder, by org admins, and by checkers working
-- that event. There is deliberately NO client insert or update policy: rows are
-- created by the issuance trigger and mutated only by check_in_ticket(). That
-- absence is what makes rules 3 and 4 hold — a checker cannot forge or rewrite
-- a ticket even with a valid session.
create policy tickets_read on tickets
  for select using (
    profile_id = auth.uid()
    or public.is_org_admin(org_id)
    or public.is_event_checker(event_id)
  );

create policy event_checkers_read on event_checkers
  for select using (public.is_org_member(org_id));

create policy event_checkers_admin_write on event_checkers
  for all using (public.is_org_admin(org_id) or public.can_manage_events(org_id))
  with check (public.is_org_admin(org_id) or public.can_manage_events(org_id));

-- ---------------------------------------------------------------- messaging

create policy threads_read on threads
  for select using (public.is_thread_member(id));

create policy threads_insert on threads
  for insert with check (public.is_org_member(org_id) and created_by = auth.uid());

create policy thread_members_read on thread_members
  for select using (public.is_thread_member(thread_id) or profile_id = auth.uid());

create policy thread_members_insert on thread_members
  for insert with check (public.is_thread_member(thread_id) or profile_id = auth.uid());

create policy thread_members_own_update on thread_members
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy messages_read on messages
  for select using (public.is_thread_member(thread_id));

-- Broadcast threads are admin-to-org and one way; members read but never post.
create policy messages_insert on messages
  for insert with check (
    author_id = auth.uid()
    and public.is_thread_member(thread_id)
    and (
      public.is_org_admin(org_id)
      or (select t.kind from threads t where t.id = thread_id) <> 'broadcast'
    )
  );

-- ---------------------------------------------------------------- polls

create policy polls_read on polls
  for select using (public.is_org_member(org_id));

create policy polls_admin_write on polls
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy poll_options_read on poll_options
  for select using (public.is_org_member(org_id));

create policy poll_options_admin_write on poll_options
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy votes_read on votes
  for select using (public.is_org_member(org_id));

-- One vote per verified member. The unique constraint enforces the count;
-- this policy enforces that only active members may cast one at all.
create policy votes_own_insert on votes
  for insert with check (public.is_org_member(org_id) and profile_id = auth.uid());

-- ---------------------------------------------------------------- money

create policy plans_read on plans
  for select using (public.is_org_member(org_id));

create policy plans_admin_write on plans
  for all using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));

create policy subscriptions_read on subscriptions
  for select using (profile_id = auth.uid() or public.is_org_admin(org_id));

create policy payments_read on payments
  for select using (profile_id = auth.uid() or public.is_org_admin(org_id));

-- ---------------------------------------------------------------- moderation

create policy reports_insert on moderation_reports
  for insert with check (public.is_org_member(org_id) and reporter_id = auth.uid());

create policy reports_moderator_read on moderation_reports
  for select using (public.is_org_moderator(org_id) or reporter_id = auth.uid());

create policy reports_moderator_update on moderation_reports
  for update using (public.is_org_moderator(org_id)) with check (public.is_org_moderator(org_id));

create policy notifications_own on notifications
  for select using (profile_id = auth.uid());

create policy notifications_own_update on notifications
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
