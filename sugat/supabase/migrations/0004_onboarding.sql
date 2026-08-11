-- Sugather — organization creation and invitation redemption
--
-- Both operations create a `memberships` row for a caller who is not yet a
-- member, which no RLS policy can allow without opening a hole: the admin-write
-- policy requires an existing admin membership in the org being joined. These
-- SECURITY DEFINER functions are the bootstrap, and they are the only insert
-- path into `memberships`.

-- Member numbers follow the format on the physical card: 048-2291.
create function public.next_member_no(p_org uuid)
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select lpad(((select count(*) from memberships where org_id = p_org) + 1)::text, 3, '0')
         || '-' ||
         lpad((floor(random() * 9000) + 1000)::text, 4, '0');
$$;

-- A member approved out of the pending queue gets their number on the way in.
create function public.assign_member_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'active' and new.member_no is null then
    new.member_no := public.next_member_no(new.org_id);
  end if;
  return new;
end;
$$;

create trigger memberships_assign_member_no
  before insert or update of status on memberships
  for each row execute function public.assign_member_no();

-- ---------------------------------------------------------------- org creation

create function public.create_organization(
  p_name     text,
  p_category text default null,
  p_logo_url text default null
)
returns organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  slug text;
  n    integer := 0;
  org  organizations;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'organization name is required' using errcode = '22023';
  end if;

  base := trim(both '-' from regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g'));
  if base = '' then
    base := 'org';
  end if;

  slug := base;
  while exists (select 1 from organizations o where o.slug = slug) loop
    n := n + 1;
    slug := base || '-' || n::text;
  end loop;

  insert into organizations (name, slug, category, logo_url, created_by)
  values (trim(p_name), slug, p_category, p_logo_url, auth.uid())
  returning * into org;

  -- The creator is the first admin, and is active immediately.
  insert into memberships (org_id, profile_id, role, status, tier)
  values (org.id, auth.uid(), 'admin', 'active', 'Founding');

  insert into plans (org_id, name, price_cents, interval, is_default)
  values (org.id, 'Standard', 0, 'annual', true);

  return org;
end;
$$;

-- ---------------------------------------------------------------- invitations

-- Reading an invitation before joining cannot go through RLS either, since the
-- caller is not yet a member of the org. Returns only what the join screen needs
-- to render — never the whole invitation row.
create function public.preview_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inv invitations;
  org organizations;
begin
  select * into inv from invitations where token = p_token;
  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  if inv.revoked_at is not null then
    return jsonb_build_object('valid', false, 'reason', 'revoked');
  end if;

  if inv.expires_at is not null and inv.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  select * into org from organizations where id = inv.org_id;

  return jsonb_build_object(
    'valid',    true,
    'org_name', org.name,
    'org_logo', org.logo_url,
    'category', org.category,
    'role',     inv.role,
    'policy',   org.invitation_policy
  );
end;
$$;

create function public.redeem_invitation(p_token text)
returns memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  inv        invitations;
  org        organizations;
  existing   memberships;
  m          memberships;
  join_state member_status;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into inv from invitations where token = p_token;
  if not found then
    raise exception 'invitation not found' using errcode = '22023';
  end if;
  if inv.revoked_at is not null then
    raise exception 'invitation has been revoked' using errcode = '22023';
  end if;
  if inv.expires_at is not null and inv.expires_at < now() then
    raise exception 'invitation has expired' using errcode = '22023';
  end if;

  -- Redeeming twice is idempotent, not an error.
  select * into existing
    from memberships
   where org_id = inv.org_id and profile_id = auth.uid();
  if found then
    return existing;
  end if;

  select * into org from organizations where id = inv.org_id;

  -- An open link admits immediately; otherwise the member lands in the queue
  -- the admin opens the console to clear.
  join_state := case
    when org.invitation_policy = 'open_link' then 'active'
    else 'pending'
  end;

  insert into memberships (org_id, profile_id, role, status)
  values (inv.org_id, auth.uid(), inv.role, join_state)
  returning * into m;

  update invitations
     set redeemed_by = auth.uid(), redeemed_at = now()
   where id = inv.id and redeemed_by is null;

  return m;
end;
$$;

-- ---------------------------------------------------------------- grants

revoke execute on function public.create_organization(text, text, text) from public;
revoke execute on function public.redeem_invitation(text)               from public;

grant execute on function public.create_organization(text, text, text) to authenticated;
grant execute on function public.redeem_invitation(text)               to authenticated;

-- The join screen renders before sign-in, so this one stays open to anon.
grant execute on function public.preview_invitation(text) to anon, authenticated;
