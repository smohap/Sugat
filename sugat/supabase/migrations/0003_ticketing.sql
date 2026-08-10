-- Sugat — ticketing lifecycle
--
-- The eight business rules are enforced here rather than in application code.
-- Issuance and voiding are triggers, so no code path can register someone
-- without producing the right tickets. Check-in is a conditional UPDATE, so
-- two checkers scanning the same code at the same instant cannot both succeed.

-- ---------------------------------------------------------------- issuance
--
-- Rule 2: one ticket per attendee, so guest_count controls the loop.
-- Rule 5: on a paid event the ticket appears only once status reaches 'paid'.
-- Rule 6: cancelling voids every ticket, checked in or not.

create function public.issue_tickets_for_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev           events;
  holder       text;
  should_issue boolean;
  live_tickets integer;
  i            integer;
begin
  select * into ev from events where id = new.event_id;

  if new.status = 'cancelled' then
    update tickets
       set status = 'void', voided_at = now()
     where registration_id = new.id
       and status <> 'void';
    return new;
  end if;

  if not ev.ticketing_enabled then
    return new;
  end if;

  should_issue := case
    when ev.price_cents > 0 then new.status = 'paid'
    else new.status in ('confirmed', 'paid')
  end;

  if not should_issue then
    return new;
  end if;

  -- Re-entrant: a second UPDATE to an already-ticketed registration is a no-op
  -- rather than a duplicate issue.
  select count(*) into live_tickets
    from tickets where registration_id = new.id and status <> 'void';

  if live_tickets > 0 then
    return new;
  end if;

  select coalesce(nullif(full_name, ''), 'Member')
    into holder
    from profiles where id = new.profile_id;

  for i in 1..new.guest_count loop
    insert into tickets (org_id, event_id, registration_id, profile_id, attendee_name)
    values (
      new.org_id,
      new.event_id,
      new.id,
      new.profile_id,
      case when i = 1 then holder else holder || ' — guest ' || (i - 1)::text end
    );
  end loop;

  return new;
end;
$$;

create trigger registration_tickets
  after insert or update of status on registrations
  for each row execute function public.issue_tickets_for_registration();

-- ---------------------------------------------------------------- check-in
--
-- Rule 3: a code scans in successfully exactly once. The UPDATE is guarded on
-- status = 'valid', so the transition is atomic — the loser of a race gets zero
-- rows back and is reported as a duplicate, never as a silent success.
-- Rule 4: authorization is the per-event grant, checked before any write.

create function public.check_in_ticket(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t       tickets;
  updated tickets;
  ev      events;
begin
  select * into t from tickets where qr_token = p_token;

  if not found then
    return jsonb_build_object('result', 'unknown');
  end if;

  if not (public.is_event_checker(t.event_id) or public.is_org_admin(t.org_id)) then
    raise exception 'not authorized to scan tickets for this event'
      using errcode = '42501';
  end if;

  select * into ev from events where id = t.event_id;

  update tickets
     set status        = 'checked_in',
         checked_in_at = now(),
         checked_in_by = auth.uid()
   where id = t.id
     and status = 'valid'
  returning * into updated;

  if updated.id is not null then
    return jsonb_build_object(
      'result',        'valid',
      'ticket_id',     updated.id,
      'attendee_name', updated.attendee_name,
      'event_title',   ev.title,
      'checked_in_at', updated.checked_in_at
    );
  end if;

  -- Nothing updated: the row exists but was not 'valid'.
  return jsonb_build_object(
    'result',        case t.status when 'checked_in' then 'duplicate' else 'void' end,
    'ticket_id',     t.id,
    'attendee_name', t.attendee_name,
    'event_title',   ev.title,
    'checked_in_at', t.checked_in_at
  );
end;
$$;

-- Admin override for an attendee whose phone has died. Attributed separately so
-- the attendee row can show it was a manual admission.
create function public.admin_check_in_ticket(p_ticket uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  t       tickets;
  updated tickets;
begin
  select * into t from tickets where id = p_ticket;
  if not found then
    return jsonb_build_object('result', 'unknown');
  end if;

  if not (public.is_org_admin(t.org_id) or public.can_manage_events(t.org_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update tickets
     set status              = 'checked_in',
         checked_in_at       = now(),
         checked_in_by       = auth.uid(),
         checked_in_manually = true
   where id = t.id
     and status = 'valid'
  returning * into updated;

  if updated.id is not null then
    return jsonb_build_object('result', 'valid', 'ticket_id', updated.id);
  end if;

  return jsonb_build_object(
    'result', case t.status when 'checked_in' then 'duplicate' else 'void' end,
    'ticket_id', t.id
  );
end;
$$;

create function public.void_ticket(p_ticket uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare t tickets;
begin
  select * into t from tickets where id = p_ticket;
  if not found then
    return jsonb_build_object('result', 'unknown');
  end if;

  if not (public.is_org_admin(t.org_id) or public.can_manage_events(t.org_id)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update tickets set status = 'void', voided_at = now() where id = t.id;
  return jsonb_build_object('result', 'void', 'ticket_id', t.id);
end;
$$;

-- ---------------------------------------------------------------- grants
--
-- These are the only write paths into `tickets`. Anonymous callers get none of
-- them; `tickets` itself has no client insert or update policy at all.

revoke execute on function public.check_in_ticket(text)       from public;
revoke execute on function public.admin_check_in_ticket(uuid) from public;
revoke execute on function public.void_ticket(uuid)           from public;

grant execute on function public.check_in_ticket(text)       to authenticated;
grant execute on function public.admin_check_in_ticket(uuid) to authenticated;
grant execute on function public.void_ticket(uuid)           to authenticated;

-- Rule 7: attendance syncs live to the admin dashboard.
alter publication supabase_realtime add table tickets;
