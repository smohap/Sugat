-- Sugather — core schema
-- Multi-tenant from the first migration: every domain row carries org_id.
-- Isolation is enforced by RLS (0002), not by application-layer filtering.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums

create type member_role         as enum ('admin', 'moderator', 'committee', 'member', 'guest');
create type member_status       as enum ('pending', 'active', 'suspended');
create type invitation_policy   as enum ('open_link', 'approval_required');
create type post_kind           as enum ('text', 'image', 'announcement');
create type registration_status as enum ('pending', 'confirmed', 'paid', 'cancelled');
create type ticket_status       as enum ('valid', 'checked_in', 'void');
create type thread_kind         as enum ('direct', 'group', 'broadcast');
create type poll_kind           as enum ('poll', 'election_preview');
create type report_target       as enum ('post', 'comment');
create type report_status       as enum ('open', 'dismissed', 'content_hidden', 'author_suspended');
create type plan_interval       as enum ('monthly', 'annual');

-- ---------------------------------------------------------------- identity

-- Cross-org identity. A person may belong to several organizations.
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  avatar_url text,
  email      text,
  phone      text,
  created_at timestamptz not null default now()
);

create table organizations (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  slug              text not null unique,
  category          text,
  logo_url          text,
  description       text,
  invitation_policy invitation_policy not null default 'approval_required',
  stripe_account_id text,
  settings          jsonb not null default '{}'::jsonb,
  created_by        uuid references profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);

-- profile x org. The join table every RLS policy resolves against.
create table memberships (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references organizations (id) on delete cascade,
  profile_id   uuid not null references profiles (id) on delete cascade,
  role         member_role   not null default 'member',
  status       member_status not null default 'pending',
  tier         text not null default 'Standard',
  member_no    text,
  joined_at    timestamptz not null default now(),
  suspended_at timestamptz,
  unique (org_id, profile_id)
);

create index on memberships (org_id, status);
create index on memberships (profile_id);

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  token       text not null unique default encode(gen_random_bytes(18), 'hex'),
  email       text,
  role        member_role not null default 'member',
  created_by  uuid references profiles (id) on delete set null,
  expires_at  timestamptz,
  revoked_at  timestamptz,
  redeemed_by uuid references profiles (id) on delete set null,
  redeemed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index on invitations (org_id, created_at desc);

-- ---------------------------------------------------------------- social

create table posts (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  kind       post_kind not null default 'text',
  body       text not null default '',
  media_url  text,
  hidden_at  timestamptz,
  hidden_by  uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on posts (org_id, created_at desc);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  post_id    uuid not null references posts (id) on delete cascade,
  parent_id  uuid references comments (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  body       text not null,
  hidden_at  timestamptz,
  hidden_by  uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index on comments (post_id, created_at);

-- Single-tap reactions. Exactly one reaction per member per target.
create table reactions (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  post_id    uuid references posts (id) on delete cascade,
  comment_id uuid references comments (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  kind       text not null default 'like',
  created_at timestamptz not null default now(),
  constraint reaction_target_exclusive check (num_nonnulls(post_id, comment_id) = 1)
);

create unique index on reactions (post_id, profile_id) where post_id is not null;
create unique index on reactions (comment_id, profile_id) where comment_id is not null;

create table follows (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  follower_id uuid not null references profiles (id) on delete cascade,
  target_id   uuid not null references profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (follower_id, target_id, org_id),
  constraint no_self_follow check (follower_id <> target_id)
);

-- ---------------------------------------------------------------- events

create table events (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations (id) on delete cascade,
  title             text not null,
  description       text,
  venue             text,
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  capacity          integer check (capacity is null or capacity > 0),
  cover_url         text,
  -- Rule 1: ticketing is configured per event, never globally.
  ticketing_enabled boolean not null default false,
  price_cents       integer not null default 0 check (price_cents >= 0),
  currency          text not null default 'usd',
  is_featured       boolean not null default false,
  created_by        uuid references profiles (id) on delete set null,
  created_at        timestamptz not null default now()
);

create index on events (org_id, starts_at desc);

create table registrations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  event_id    uuid not null references events (id) on delete cascade,
  profile_id  uuid not null references profiles (id) on delete cascade,
  status      registration_status not null default 'pending',
  -- Rule 2: a group registration issues one QR per attendee.
  guest_count integer not null default 1 check (guest_count >= 1),
  payment_ref text,
  created_at  timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index on registrations (event_id, status);

create table tickets (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations (id) on delete cascade,
  event_id            uuid not null references events (id) on delete cascade,
  registration_id     uuid not null references registrations (id) on delete cascade,
  profile_id          uuid not null references profiles (id) on delete cascade,
  attendee_name       text not null,
  -- Single-use credential. Hex keeps the QR payload alphanumeric.
  qr_token            text not null unique default encode(gen_random_bytes(24), 'hex'),
  status              ticket_status not null default 'valid',
  checked_in_at       timestamptz,
  checked_in_by       uuid references profiles (id) on delete set null,
  checked_in_manually boolean not null default false,
  voided_at           timestamptz,
  created_at          timestamptz not null default now()
);

create index on tickets (event_id, status);
create index on tickets (profile_id);

-- Rule 4: Checker is a scoped, per-event grant — never a broader role.
create table event_checkers (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  event_id   uuid not null references events (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  granted_by uuid references profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

-- ---------------------------------------------------------------- messaging

create table threads (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  kind       thread_kind not null default 'direct',
  title      text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table thread_members (
  thread_id    uuid not null references threads (id) on delete cascade,
  profile_id   uuid not null references profiles (id) on delete cascade,
  last_read_at timestamptz,
  primary key (thread_id, profile_id)
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  thread_id  uuid not null references threads (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index on messages (thread_id, created_at);

-- ---------------------------------------------------------------- polls

create table polls (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  kind       poll_kind not null default 'poll',
  question   text not null,
  subtitle   text,
  closes_at  timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table poll_options (
  id       uuid primary key default gen_random_uuid(),
  org_id   uuid not null references organizations (id) on delete cascade,
  poll_id  uuid not null references polls (id) on delete cascade,
  label    text not null,
  position integer not null default 0
);

create table votes (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  poll_id    uuid not null references polls (id) on delete cascade,
  option_id  uuid not null references poll_options (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- One vote per verified member.
  unique (poll_id, profile_id)
);

-- ---------------------------------------------------------------- money

create table plans (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references organizations (id) on delete cascade,
  name            text not null,
  price_cents     integer not null default 0 check (price_cents >= 0),
  currency        text not null default 'usd',
  interval        plan_interval not null default 'annual',
  stripe_price_id text,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now()
);

create table subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  org_id                 uuid not null references organizations (id) on delete cascade,
  profile_id             uuid not null references profiles (id) on delete cascade,
  plan_id                uuid references plans (id) on delete set null,
  status                 text not null default 'inactive',
  current_period_end     timestamptz,
  stripe_subscription_id text,
  created_at             timestamptz not null default now(),
  unique (org_id, profile_id)
);

create table payments (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations (id) on delete cascade,
  profile_id        uuid not null references profiles (id) on delete cascade,
  event_id          uuid references events (id) on delete set null,
  plan_id           uuid references plans (id) on delete set null,
  amount_cents      integer not null,
  currency          text not null default 'usd',
  status            text not null default 'pending',
  stripe_session_id text unique,
  created_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------- moderation

create table moderation_reports (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations (id) on delete cascade,
  target_type report_target not null,
  target_id   uuid not null,
  reporter_id uuid not null references profiles (id) on delete cascade,
  reason      text not null,
  status      report_status not null default 'open',
  resolved_by uuid references profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

create index on moderation_reports (org_id, status, created_at desc);

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  kind       text not null,
  payload    jsonb not null default '{}'::jsonb,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index on notifications (profile_id, read_at, created_at desc);

-- ---------------------------------------------------------------- auth bridge

-- Every auth user gets a profile row, so RLS can always resolve auth.uid().
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
