-- Sugather — storage for organization logos.
--
-- Org creation captures name, category and logo (§10.1), and the logo is a
-- file, so the bucket has to exist before onboarding can complete. Public read:
-- the mark appears on the join screen, which renders before the visitor is a
-- member of anything.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'org-logos',
  'org-logos',
  true,
  2097152,  -- 2 MB; a logo that needs more than this is the wrong asset
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "org logos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'org-logos');

-- Any signed-in user may upload, because the person creating an organization is
-- not yet a member of one. Ownership is `owner`, set by Storage itself, so the
-- update and delete policies below still scope writes to the uploader.
create policy "signed-in users may upload an org logo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'org-logos');

create policy "uploaders may replace their own org logo"
  on storage.objects for update to authenticated
  using (bucket_id = 'org-logos' and owner = auth.uid())
  with check (bucket_id = 'org-logos' and owner = auth.uid());

create policy "uploaders may delete their own org logo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'org-logos' and owner = auth.uid());
