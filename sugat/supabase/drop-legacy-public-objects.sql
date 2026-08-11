-- One-off cleanup: remove the domain objects an earlier run of 0001–0005 left
-- in `public`, from before everything moved into the `sugat` schema.
--
-- NOT a migration. Run it once, by hand, then run 0001–0006 in order.
--
-- DESTRUCTIVE. It empties `public` completely. That is safe here only because
-- `public` was ours alone and the database holds no real members yet — Supabase
-- keeps its own machinery in `auth`, `storage`, `extensions` and
-- `supabase_migrations`, none of which this touches. Do not run it against a
-- database with anything in `public` you did not put there.

do $$
declare
  r record;
begin
  -- Tables first: cascade takes their policies, triggers, indexes and
  -- constraints with them.
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;

  -- Then the functions, by identity signature so overloads resolve.
  for r in
    select p.oid::regprocedure as signature
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
  loop
    execute format('drop function if exists %s cascade', r.signature);
  end loop;

  -- Enums last: the columns and function signatures using them are gone.
  for r in
    select t.typname
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typtype = 'e'
  loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end;
$$;

-- The trigger lives on `auth.users`, outside `public`, so the sweep above does
-- not reach it. 0001 now drops it itself before recreating, but clearing it
-- here leaves the database in a clean state either way.
drop trigger if exists on_auth_user_created on auth.users;

-- If the earlier run also got as far as 0006, the bucket already exists and its
-- `insert ... on conflict do nothing` makes a re-run harmless. The storage
-- policies do not have that luxury — they error on a second create.
drop policy if exists "org logos are publicly readable"        on storage.objects;
drop policy if exists "signed-in users may upload an org logo" on storage.objects;
drop policy if exists "uploaders may replace their own org logo" on storage.objects;
drop policy if exists "uploaders may delete their own org logo"  on storage.objects;
