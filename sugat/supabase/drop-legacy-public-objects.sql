-- One-off cleanup: remove the objects an earlier run of 0001–0005 left in
-- `public`, from before everything moved into the `sugat` schema.
--
-- NOT a migration. Run it once, by hand, after the checks below pass.
--
-- THIS DATABASE IS SHARED. Every statement here names one object explicitly —
-- there is no sweep of `public`, because `public` is not ours to sweep. Read
-- the list. If any name below belongs to another application, delete that line
-- before running; `drop ... if exists` protects you from a typo, not from
-- dropping the right name owned by the wrong app.
--
-- These are exactly the objects migrations 0001–0005 used to create in
-- `public`. They now live in `sugat` and nothing reads the `public` copies.

-- ---------------------------------------------------------------- check first

-- 1. What is in `public`, and did we create it? Run this on its own and read
--    the output before running anything below. Anything you do not recognise
--    from the drop list further down belongs to someone else.
--
--   select table_name from information_schema.tables where table_schema = 'public'
--   union all
--   select routine_name from information_schema.routines where routine_schema = 'public';

-- 2. Which triggers hang off auth.users, and what does each one call? On a
--    shared database `on_auth_user_created` may well be another application's
--    signup hook — the name is the one every Supabase tutorial uses.
--
--   select t.tgname,
--          n.nspname || '.' || p.proname as calls
--     from pg_trigger t
--     join pg_proc p      on p.oid = t.tgfoid
--     join pg_namespace n on n.oid = p.pronamespace
--    where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;
--
--    Drop `on_auth_user_created` ONLY if that query shows it calling
--    `public.handle_new_user` — that one is ours, from the earlier run, and it
--    now points at a function that is about to disappear. If it calls anything
--    else, leave it alone and skip the drop at the bottom of this file.

-- ---------------------------------------------------------------- tables

-- Cascade takes each table's own policies, triggers, indexes and constraints.
-- It does not reach outside the table.
drop table if exists public.notifications      cascade;
drop table if exists public.moderation_reports cascade;
drop table if exists public.payments           cascade;
drop table if exists public.subscriptions      cascade;
drop table if exists public.plans              cascade;
drop table if exists public.votes              cascade;
drop table if exists public.poll_options       cascade;
drop table if exists public.polls              cascade;
drop table if exists public.messages           cascade;
drop table if exists public.thread_members     cascade;
drop table if exists public.threads            cascade;
drop table if exists public.event_checkers     cascade;
drop table if exists public.tickets            cascade;
drop table if exists public.registrations      cascade;
drop table if exists public.events             cascade;
drop table if exists public.follows            cascade;
drop table if exists public.reactions          cascade;
drop table if exists public.comments           cascade;
drop table if exists public.posts              cascade;
drop table if exists public.invitations        cascade;
drop table if exists public.memberships        cascade;
drop table if exists public.organizations      cascade;
drop table if exists public.profiles           cascade;

-- ---------------------------------------------------------------- functions

drop function if exists public.handle_new_user()                        cascade;
drop function if exists public.is_org_member(uuid)                      cascade;
drop function if exists public.current_member_role(uuid)                cascade;
drop function if exists public.is_org_admin(uuid)                       cascade;
drop function if exists public.is_org_moderator(uuid)                   cascade;
drop function if exists public.can_manage_events(uuid)                  cascade;
drop function if exists public.is_event_checker(uuid)                   cascade;
drop function if exists public.shares_org(uuid)                         cascade;
drop function if exists public.is_thread_member(uuid)                   cascade;
drop function if exists public.issue_tickets_for_registration()         cascade;
drop function if exists public.check_in_ticket(text)                    cascade;
drop function if exists public.admin_check_in_ticket(uuid)              cascade;
drop function if exists public.void_ticket(uuid)                        cascade;
drop function if exists public.next_member_no(uuid)                     cascade;
drop function if exists public.assign_member_no()                       cascade;
drop function if exists public.create_organization(text, text, text)    cascade;
drop function if exists public.preview_invitation(text)                 cascade;
drop function if exists public.redeem_invitation(text)                  cascade;
drop function if exists public.has_org_membership(uuid)                 cascade;
drop function if exists public.prevent_last_admin_removal()             cascade;
drop function if exists public.prevent_last_admin_delete()              cascade;
drop function if exists public.stamp_suspension()                       cascade;

-- ---------------------------------------------------------------- enums

drop type if exists public.member_role         cascade;
drop type if exists public.member_status       cascade;
drop type if exists public.invitation_policy   cascade;
drop type if exists public.post_kind           cascade;
drop type if exists public.registration_status cascade;
drop type if exists public.ticket_status       cascade;
drop type if exists public.thread_kind         cascade;
drop type if exists public.poll_kind           cascade;
drop type if exists public.report_target       cascade;
drop type if exists public.report_status       cascade;
drop type if exists public.plan_interval       cascade;

-- ---------------------------------------------------------------- shared objects

-- Storage policies from an earlier run of 0006, under their old unprefixed
-- names. Scoped by name to the four we created; every other policy on
-- storage.objects is untouched.
drop policy if exists "org logos are publicly readable"          on storage.objects;
drop policy if exists "signed-in users may upload an org logo"   on storage.objects;
drop policy if exists "uploaders may replace their own org logo" on storage.objects;
drop policy if exists "uploaders may delete their own org logo"  on storage.objects;

-- ONLY after check 2 above confirmed this trigger calls public.handle_new_user.
-- If it calls anything else, it is not ours — leave this commented out.
-- 0001 now creates `sugat_on_auth_user_created` alongside whatever else is
-- there, so nothing depends on this line running.
--
--   drop trigger if exists on_auth_user_created on auth.users;

-- The bucket row itself is left in place: `org-logos` is ours, 0006 re-inserts
-- it with `on conflict do nothing`, and dropping it would delete the files.
