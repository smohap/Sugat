-- Sugat — demo seed: "Riverdale Alumni"
--
-- Every account here uses the password `sugat-demo` and an @riverdale.demo
-- address. This is throwaway demonstration data; never run it against a
-- database holding real members.
--
-- On member count: the brief asks for ~40 members and a poll carrying 214
-- votes. `votes` is uniquely constrained on (poll_id, profile_id) — one vote per
-- verified member — so 214 votes require 214 members. Rather than fake the
-- tally, the org is seeded with 214 members: 9 named people holding the
-- interesting roles, and 205 further active members behind them. The 62/23/15
-- split is then real data the UI aggregates, not a hardcoded number.
--
-- Local variables are v_-prefixed because bare names like `org_id` would be
-- ambiguous against the columns of the same name inside these queries.

-- Idempotent: re-running replaces the demo org wholesale.
delete from organizations where slug = 'riverdale-alumni';
delete from auth.users     where email like '%@riverdale.demo';

do $$
declare
  v_org       uuid;
  v_pw        text := crypt('sugat-demo', gen_salt('bf'));
  v_gala      uuid;
  v_poll      uuid;
  v_opt_a     uuid;
  v_opt_b     uuid;
  v_opt_c     uuid;
  v_thread    uuid;
  v_post      uuid;
  v_broadcast uuid;

  v_admin     uuid;
  v_priya     uuid;   -- committee; door checker for the gala
  v_marcus    uuid;   -- moderator
  v_elena     uuid;   -- moderator
  v_jordan    uuid;   -- committee
  v_amara     uuid;   -- member; the ticket the demo walkthrough scans
  v_priti     uuid;
  v_desmond   uuid;
  v_hannah    uuid;

  first_names text[] := array[
    'Ada','Bilal','Cara','Dmitri','Esi','Farid','Greta','Hugo','Imani','Jonas',
    'Kaya','Lars','Mira','Nikhil','Omar','Petra','Quinn','Rosa','Samir','Tara',
    'Uma','Viktor','Wren','Yara'];
  last_names  text[] := array[
    'Adeyemi','Blackwood','Castellan','Duarte','Eriksen','Fontaine','Gallagher','Haddad',
    'Ibrahim','Jansen','Kowalski','Lindqvist','Moreau','Nakamura','Oyelaran','Petrov',
    'Quintero','Rasmussen','Silva','Tanaka','Ueda','Vasquez','Whitlock','Zeleny'];

  v_name  text;
  v_email text;
  v_uid   uuid;
  i       integer;
begin

  -- ------------------------------------------------------------ accounts
  --
  -- Inserting into auth.users fires handle_new_user(), which creates the
  -- matching profiles row; the name is then written from the metadata.

  create temporary table seeded (id uuid, full_name text, ord integer) on commit drop;

  for i in 1..214 loop
    v_uid := gen_random_uuid();

    v_name := case i
      when 1 then 'Rosalind Achebe'
      when 2 then 'Priya Shah'
      when 3 then 'Marcus Boone'
      when 4 then 'Elena Cruz'
      when 5 then 'Jordan Lee'
      when 6 then 'Amara Whitfield'
      when 7 then 'Priti Nair'
      when 8 then 'Desmond Clarke'
      when 9 then 'Hannah Osei'
      else first_names[((i - 10) % 24) + 1] || ' ' || last_names[(((i - 10) / 24) % 24) + 1]
    end;

    v_email := 'member' || i::text || '@riverdale.demo';

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      v_email, v_pw,
      now(), now() - (i || ' days')::interval, now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_name),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', v_email),
      'email', v_uid::text, now(), now(), now()
    );

    update profiles set full_name = v_name where profiles.id = v_uid;
    insert into seeded values (v_uid, v_name, i);
  end loop;

  select id into v_admin   from seeded where ord = 1;
  select id into v_priya   from seeded where ord = 2;
  select id into v_marcus  from seeded where ord = 3;
  select id into v_elena   from seeded where ord = 4;
  select id into v_jordan  from seeded where ord = 5;
  select id into v_amara   from seeded where ord = 6;
  select id into v_priti   from seeded where ord = 7;
  select id into v_desmond from seeded where ord = 8;
  select id into v_hannah  from seeded where ord = 9;

  -- ------------------------------------------------------------ org

  insert into organizations (name, slug, category, description, invitation_policy, created_by)
  values (
    'Riverdale Alumni', 'riverdale-alumni', 'Alumni Network',
    'The alumni association of Riverdale — chapters, mentoring, and the Founders'' Day tradition since 1974.',
    'approval_required', v_admin
  )
  returning id into v_org;

  insert into plans (org_id, name, price_cents, interval, is_default) values
    (v_org, 'Standard',   0,    'annual',  true),
    (v_org, 'Supporting', 6000, 'annual',  false),
    (v_org, 'Patron',     1500, 'monthly', false);

  -- ------------------------------------------------------------ memberships
  --
  -- Two members sit pending in the approval queue and one is suspended, so the
  -- console has real work waiting on first run.

  insert into memberships (org_id, profile_id, role, status, tier, joined_at)
  select
    v_org,
    s.id,
    case
      when s.ord = 1 then 'admin'::member_role
      when s.ord in (3, 4) then 'moderator'::member_role
      when s.ord in (2, 5, 8, 9) then 'committee'::member_role
      else 'member'::member_role
    end,
    case
      when s.ord in (213, 214) then 'pending'::member_status
      when s.ord = 212 then 'suspended'::member_status
      else 'active'::member_status
    end,
    case
      when s.ord = 1 then 'Founding'
      when s.ord = 6 then 'Gold'
      when s.ord % 7 = 0 then 'Supporting'
      else 'Standard'
    end,
    now() - (s.ord || ' days')::interval
  from seeded s;

  -- ------------------------------------------------------------ events

  insert into events (org_id, title, description, venue, starts_at, capacity,
                      ticketing_enabled, price_cents, is_featured, created_by)
  values (
    v_org, 'Founders'' Day Gala',
    'Our flagship evening — dinner, the scholarship announcement, and the Founders'' toast.',
    'The Grand Hall', date_trunc('day', now()) + interval '9 days' + interval '18 hours',
    120, true, 7500, true, v_priya
  )
  returning id into v_gala;

  insert into events (org_id, title, venue, starts_at, capacity, ticketing_enabled, price_cents, created_by) values
    (v_org, 'Volunteer Setup Day',    'Community Hall', date_trunc('day', now()) + interval '12 days' + interval '9 hours',    40,  false, 0, v_jordan),
    (v_org, 'New Member Orientation', 'Zoom',           date_trunc('day', now()) + interval '19 days' + interval '18 hours 30 minutes', 100, false, 0, v_hannah),
    (v_org, 'Chapter Picnic',         'Riverside Park', date_trunc('day', now()) + interval '25 days' + interval '12 hours',   150, false, 0, v_desmond),
    (v_org, 'Board Meeting',          'HQ Room 2',      date_trunc('day', now()) + interval '32 days' + interval '19 hours',   20,  false, 0, v_admin);

  -- Rule 4: Priya works the door for this event only, and holds no admin role.
  insert into event_checkers (org_id, event_id, profile_id, granted_by)
  values (v_org, v_gala, v_priya, v_admin);

  -- 92 paid registrations. The issuance trigger turns each into a ticket, so
  -- the seed exercises exactly the path the live app uses.
  insert into registrations (org_id, event_id, profile_id, status, guest_count, payment_ref)
  select v_org, v_gala, s.id, 'paid', 1, 'seed_pi_' || s.ord::text
  from seeded s
  where s.ord <= 92;

  -- Amara brings a guest: one registration, two QR codes (rule 2).
  update registrations
     set guest_count = 2
   where event_id = v_gala and profile_id = v_amara;

  delete from tickets where event_id = v_gala and profile_id = v_amara;

  insert into tickets (org_id, event_id, registration_id, profile_id, attendee_name)
  select v_org, v_gala, r.id, v_amara, 'Amara Whitfield'
    from registrations r where r.event_id = v_gala and r.profile_id = v_amara;

  insert into tickets (org_id, event_id, registration_id, profile_id, attendee_name)
  select v_org, v_gala, r.id, v_amara, 'Amara Whitfield — guest 1'
    from registrations r where r.event_id = v_gala and r.profile_id = v_amara;

  -- 36 already through the door, scanned by Priya. Amara's two tickets stay
  -- 'valid' deliberately — they are what the end-to-end demo scans.
  update tickets
     set status = 'checked_in',
         checked_in_at = now() - (random() * interval '90 minutes'),
         checked_in_by = v_priya
   where tickets.id in (
     select t.id from tickets t
      where t.event_id = v_gala and t.profile_id <> v_amara
      order by t.created_at
      limit 36
   );

  insert into registrations (org_id, event_id, profile_id, status)
  select v_org, e.id, s.id, 'confirmed'
  from events e
  cross join seeded s
  where e.org_id = v_org and e.ticketing_enabled = false and s.ord <= 24;

  -- ------------------------------------------------------------ feed

  insert into posts (org_id, author_id, kind, body, created_at) values
    (v_org, v_admin,   'announcement', 'This year''s scholarship drive hit 140% of target — thank you to every chapter that pitched in.', now() - interval '2 hours'),
    (v_org, v_priya,   'text', 'Looking for two volunteers to help set up chairs before Saturday''s meetup. Comment if you''re free!', now() - interval '5 hours'),
    (v_org, v_jordan,  'text', 'Mentoring pairs for the autumn cycle go out Friday. 38 pairs this round — our biggest yet.', now() - interval '1 day'),
    (v_org, v_hannah,  'announcement', 'Gala seating chart is finalised. Check your ticket in the app for your table number.', now() - interval '1 day 4 hours'),
    (v_org, v_desmond, 'text', 'The Riverside Park permit came through for the picnic. Rain date is the following Sunday.', now() - interval '2 days'),
    (v_org, v_marcus,  'text', 'Reminder: chapter treasurers, Q3 numbers are due at the end of the month.', now() - interval '3 days'),
    (v_org, v_elena,   'text', 'Photos from the spring reunion are finally up. Apologies for the delay — there were 1,400 of them.', now() - interval '4 days'),
    (v_org, v_priti,   'text', 'Does anyone still have the 1998 yearbook PDF? The archive link is broken.', now() - interval '5 days'),
    (v_org, v_amara,   'text', 'First gala in three years for me. Genuinely looking forward to seeing everyone.', now() - interval '6 days'),
    (v_org, v_admin,   'announcement', 'Board nominations open on the 1st. Any member in good standing may nominate.', now() - interval '7 days'),
    (v_org, v_jordan,  'text', 'Huge thanks to the 22 volunteers who turned out for the food bank drive on Saturday.', now() - interval '9 days'),
    (v_org, v_priya,   'text', 'The committee is trialling a new check-in system at the gala. Have your QR ready at the door.', now() - interval '11 days');

  select p.id into v_post
    from posts p
   where p.org_id = v_org
   order by p.created_at desc
   limit 1;

  insert into comments (org_id, post_id, author_id, body, created_at)
  select v_org, v_post, s.id,
         (array['Congratulations to everyone involved.',
                'This is wonderful news.',
                'Proud to be part of this chapter.',
                'How do we contribute next year?'])[((s.ord % 4) + 1)],
         now() - (s.ord || ' minutes')::interval
  from seeded s where s.ord between 10 and 17;

  insert into reactions (org_id, post_id, profile_id)
  select v_org, p.id, s.id
  from posts p
  cross join seeded s
  where p.org_id = v_org
    and s.ord <= (20 + (abs(hashtext(p.id::text)) % 100));

  -- One flagged comment waiting in the moderation queue.
  insert into comments (org_id, post_id, author_id, body, created_at)
  values (v_org, v_post, (select s.id from seeded s where s.ord = 150),
          'This whole thing is a waste of money and everyone involved should be ashamed.',
          now() - interval '40 minutes');

  insert into moderation_reports (org_id, target_type, target_id, reporter_id, reason)
  select v_org, 'comment', c.id, v_priti, 'Hostile toward volunteers'
  from comments c
  where c.org_id = v_org and c.body like 'This whole thing is a waste%';

  -- ------------------------------------------------------------ poll

  insert into polls (org_id, kind, question, subtitle, closes_at, created_by)
  values (v_org, 'poll', 'Where should we hold next year''s annual meetup?',
          'Results visible after you vote', now() + interval '3 days', v_admin)
  returning id into v_poll;

  insert into poll_options (org_id, poll_id, label, position)
  values (v_org, v_poll, 'Riverside Park', 0) returning id into v_opt_a;
  insert into poll_options (org_id, poll_id, label, position)
  values (v_org, v_poll, 'Downtown Hall', 1) returning id into v_opt_b;
  insert into poll_options (org_id, poll_id, label, position)
  values (v_org, v_poll, 'Lakeview Terrace', 2) returning id into v_opt_c;

  -- 133 / 49 / 32 of 214 — the 62 / 23 / 15 split the design calls for.
  insert into votes (org_id, poll_id, option_id, profile_id)
  select v_org, v_poll,
         case when s.ord <= 133 then v_opt_a
              when s.ord <= 182 then v_opt_b
              else v_opt_c end,
         s.id
  from seeded s;

  insert into polls (org_id, kind, question, subtitle, closes_at, created_by)
  values (v_org, 'election_preview', '2026 Board Nominations open Aug 1',
          'Secure ballot opens to all active members in good standing.',
          now() + interval '21 days', v_admin);

  -- ------------------------------------------------------------ messaging

  insert into threads (org_id, kind, title, created_by)
  values (v_org, 'group', 'Gala Committee', v_priya)
  returning id into v_thread;

  insert into thread_members (thread_id, profile_id)
  values (v_thread, v_priya), (v_thread, v_jordan),
         (v_thread, v_hannah), (v_thread, v_admin);

  insert into messages (org_id, thread_id, author_id, body, created_at) values
    (v_org, v_thread, v_priya,  'Door team — we are 36 through as of now. Steady flow, no queue.', now() - interval '20 minutes'),
    (v_org, v_thread, v_hannah, 'Table 12 is short two chairs, can someone grab them from the store room?', now() - interval '14 minutes'),
    (v_org, v_thread, v_jordan, 'On it.', now() - interval '12 minutes'),
    (v_org, v_thread, v_admin,  'Excellent. Scholarship announcement at 8 sharp please.', now() - interval '6 minutes');

  insert into threads (org_id, kind, title, created_by)
  values (v_org, 'broadcast', 'Announcements', v_admin)
  returning id into v_broadcast;

  insert into thread_members (thread_id, profile_id)
  select v_broadcast, s.id from seeded s;

  insert into messages (org_id, thread_id, author_id, body, created_at)
  values (v_org, v_broadcast, v_admin,
          'Gala doors open at 6pm. Bring your QR ticket — it works offline.',
          now() - interval '3 hours');

  insert into threads (org_id, kind, created_by)
  values (v_org, 'direct', v_amara)
  returning id into v_thread;

  insert into thread_members (thread_id, profile_id)
  values (v_thread, v_amara), (v_thread, v_priya);

  insert into messages (org_id, thread_id, author_id, body, created_at) values
    (v_org, v_thread, v_amara, 'Is the guest ticket transferable if my sister can''t make it?', now() - interval '2 hours'),
    (v_org, v_thread, v_priya, 'It is — just let me know the name before Friday and I''ll update it.', now() - interval '100 minutes');

  -- ------------------------------------------------------------ notifications

  insert into notifications (org_id, profile_id, kind, payload, created_at)
  select v_org, s.id, 'announcement',
         jsonb_build_object('title', 'Founders'' Day Gala',
                            'body',  'Your ticket is ready in your wallet.'),
         now() - interval '3 hours'
  from seeded s where s.ord <= 92;

end $$;
