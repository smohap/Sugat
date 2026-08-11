-- Sugather — storage for organization logos.
--
-- Org creation captures name, category and logo (§10.1), and the logo is a
-- file, so the bucket has to exist before onboarding can complete. Public read:
-- the mark appears on the join screen, which renders before the visitor is a
-- member of anything.
--
-- `storage.buckets` and `storage.objects` are shared with every other
-- application on this database. Nothing here redefines them. The bucket row is
-- ours alone, every policy is named with a `sugat_` prefix so it cannot collide
-- with someone else's, and every policy body is fenced to
-- `bucket_id = 'org-logos'` — RLS policies combine with OR, so a policy that
-- can only ever be true for our bucket cannot widen access to anyone else's.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152,  -- 2 MB; a logo that needs more than this is the wrong asset
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Dropped by our own prefixed names first, so this file is re-runnable without
-- reaching any policy we did not create.
drop policy if exists sugat_org_logos_read   on storage.objects;
drop policy if exists sugat_org_logos_insert on storage.objects;
drop policy if exists sugat_org_logos_update on storage.objects;
drop policy if exists sugat_org_logos_delete on storage.objects;

create policy sugat_org_logos_read
  on storage.objects for select
  using (bucket_id = 'org-logos');

-- Any signed-in user may upload, because the person creating an organization is
-- not yet a member of one. Ownership is `owner`, set by Storage itself, so the
-- update and delete policies below still scope writes to the uploader.
create policy sugat_org_logos_insert
  on storage.objects for insert to authenticated
  with check (bucket_id = 'org-logos');

create policy sugat_org_logos_update
  on storage.objects for update to authenticated
  using (bucket_id = 'org-logos' and owner = auth.uid())
  with check (bucket_id = 'org-logos' and owner = auth.uid());

create policy sugat_org_logos_delete
  on storage.objects for delete to authenticated
  using (bucket_id = 'org-logos' and owner = auth.uid());
