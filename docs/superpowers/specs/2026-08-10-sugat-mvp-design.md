# Sugat MVP — Design Specification

**Date:** 2026-08-10
**Status:** Approved, ready for implementation planning
**Sources:** `sugat-opus5-build-prompt.md`, `community-super-app-prd.html`, `community-super-app-mockup.html`, `moton.txt`

---

## 1. What Sugat is

A mobile-first, multi-tenant Community Operating System. One application replacing the
WhatsApp groups, Eventbrite links, Google Forms, spreadsheets and standalone ballot tools
that volunteer-run associations, chapters and clubs stitch together today.

This is a working application, not a clickable prototype. The MVP proves the core loop:
**an org sets up, members join, and the community communicates and meets.**

### Definition of done

Two walkthroughs must succeed end to end.

**Member path.** An admin creates an org, invites members, approves them, and posts an
announcement. A member joins, RSVPs to the ticketed gala, pays, and sees a QR ticket in
their wallet. A volunteer granted Checker on that event scans the ticket, it flips to
checked-in, the attendance counter on the admin dashboard increments live, and a second
scan of the same code is rejected as a duplicate.

**Console path.** An admin clears a pending member from the approval queue, grants a
volunteer Checker on the gala without giving them any other admin access, watches the
attendance counter move while the door is running, manually checks in an attendee whose
phone has died, hides a flagged comment, and sees member growth for the last 90 days.

---

## 2. Constraints and decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Supabase-only data layer; no local mock backend | User directive. Migrations, RLS and RPCs are the source of truth. |
| D2 | Supabase credentials supplied by the operator, never by the agent | The Supabase connector cannot be authorized from a non-interactive session. `.env.local` is filled in by the operator; `.env.example` is committed. |
| D3 | Motion: landing hero is a structural port of `moton.txt`; the same easing runs through the app | User directive ("Both"). One easing token unifies marketing and product. |
| D4 | Landing carousel panels are in-app phone-frame screens, not the external figma.site figurines | Those assets are off-brand and externally hosted. Rendering real app screens keeps the hero on-brand, dependency-free, and doubles as the product shot. |
| D5 | Polls ship working; elections ship as a read-only preview card | Reconciles the PRD's Vote tab and `polls`/`votes` entities against `out_of_scope`, which defers elections. |
| D6 | Auth is magic link + password | Invite-link redemption is the primary join path; magic link matches it. Password is the returning-user fallback. |
| D7 | Ticketing invariants are enforced in Postgres, not in application code | Rules 2, 3, 5 and 6 are correctness-critical and race-prone. A conditional `UPDATE` and triggers make them true by construction. |
| D8 | No dark mode in v1 | Design system directive. |

### Known open item

The application cannot be run against a live database until the operator provides a
Supabase project. Everything up to that point — schema, policies, application code, seed
script — is written and reviewable. Integration and end-to-end tests are authored but
cannot be executed until credentials exist. This is stated rather than worked around.

---

## 3. Stack

- **Next.js 15**, App Router, TypeScript, as a mobile-first PWA
- **Tailwind CSS v4** — design tokens declared once in `@theme`, so `--brass` is authored
  in a single place and consumed as a utility
- **Supabase** — Postgres, Auth, Storage, Realtime
- **`@supabase/ssr`** — Server Components read through a request-scoped client so RLS is
  enforced by the caller's JWT; mutations run in Server Actions
- **Stripe** hosted Checkout + webhook endpoint
- **`lucide-react`** icons
- **`qrcode`** for ticket and membership-card QR rendering
- **`BarcodeDetector`** where available, `@zxing/browser` as fallback, for scanning
- **Vitest** for unit and RPC-contract tests, **Playwright** for the two walkthroughs
- No component library. Components are built to the design system below.

Every route renders correctly at 390px first. Desktop is a widened layout of the same
routes, except the admin console, which is desktop-primary.

---

## 4. Design system

### Tokens

Declared once as CSS variables and referenced everywhere.

```
--cream:   #F6F1E4   /* app background */
--cream-2: #EFE7D2
--ink:     #1C2B39   /* primary text, dark surfaces */
--ink-2:   #233748   /* body text */
--brass:   #C08A2E   /* brand accent, marks, active states */
--clay:    #B5493A   /* alerts, FAB, election/ballot accents */
--moss:    #56714F   /* confirmations, RSVP-going, valid scans */
--fog:     #8B93A0   /* meta text */
--line:    rgba(28,43,57,0.12)
```

### Typography

- **Fraunces** (serif) — all headings and the wordmark
- **IBM Plex Sans** — body
- **IBM Plex Mono** — metadata, labels, counts, IDs, timestamps, status pills; uppercase,
  0.06–0.14em letter-spacing

### Surfaces

Cream page background. White cards at 14–18px radius with
`box-shadow: 0 8px 18px -12px rgba(28,43,57,0.25)`. 18px horizontal page gutters. 1px
hairline borders using `--line`. Dark `--ink` surfaces are reserved for exactly four
places: the membership card, the event hero, checker mode, and the admin rail.

### Brand mark

A brass rounded square, 7–8px radius, containing a Fraunces "S" in ink.

---

## 5. Motion

### Motion tokens

```
--ease-sugat: cubic-bezier(0.4, 0, 0.2, 1);
--dur-stage:  650ms;   /* hero rotation, tab transitions, card flip */
--dur-fill:   800ms;   /* poll result bars */
--dur-control: 150ms;  /* buttons, hover, press */
```

One easing function across marketing and product, so the two feel like one system.
Every animation is wrapped in a `prefers-reduced-motion: no-preference` guard; under
reduced motion, state changes still occur, instantly.

### Landing hero — structural port of `moton.txt`

A single full-viewport section at `/`, carrying over the mechanics of the source spec:

- **State.** `activeIndex` (0–3), an `isAnimating` lock, `isMobile` at `innerWidth < 640`
  updated on resize. `navigate('next'|'prev')` is ignored while animating, advances
  `(i+1)%4` or `(i+3)%4`, and releases the lock after 650ms.
- **Roles.** `center = activeIndex`, `left = (i+3)%4`, `right = (i+1)%4`, `back = (i+2)%4`.
- **Simultaneous crossfade.** Background colour, `left`, scale, blur and opacity all
  transition together over `--dur-stage` with `--ease-sugat`.
- **Role geometry.** center: `translateX(-50%) scale(1.68)` desktop / `1.25` mobile, no
  blur, z-index 20. left/right: `scale(1)`, blur 2px, opacity 0.85, z-index 10, at 30%/70%
  desktop and 20%/80% mobile. back: `scale(1)`, blur 4px, z-index 5, centered.
- **Grain overlay.** SVG `fractalNoise`, `baseFrequency=0.9`, `numOctaves=4`, 0.08 internal
  opacity, container at 0.4, 200px tile, `pointer-events-none`, top layer.
- **Giant ghost word** behind the panels, `clamp(90px, 28vw, 380px)`, set in Fraunces
  rather than Anton, changing per slide.
- **Nav controls.** Two circular buttons, transparent with a 2px white border, `ArrowLeft`
  and `ArrowRight` at size 26 / strokeWidth 2.25, hover `scale(1.08)` plus
  `rgba(255,255,255,0.12)` over `--dur-control`.
- **Preload** all four panels on mount.

**Recolouring and content (D4).** The four rotating backgrounds cycle through Sugat's
`--ink`, `--brass`, `--clay`, `--moss` rather than the source's bright palette. The four
panels are phone frames rendering real app screens — Feed, Events, Ticket, Card — so the
hero is simultaneously the product shot. No external image dependency.

### In-app motion

Carried from the approved mockup, retimed to the shared tokens:

- Bottom-nav tab switches slide horizontally behind a moving 2.5px brass indicator
- The like control pops on tap (scale 1 → 1.4 → 1)
- Poll result bars fill over `--dur-fill`
- The membership card flips in on mount (`rotateY(90deg) → 0`)
- The checker's scan frame carries a sweeping brass laser line
- The compose FAB floats on a slow idle loop
- Story rings rotate on staggered durations

---

## 6. Data model

Multi-tenant from the first migration. Every domain row carries `org_id`. Isolation is
enforced by RLS policies, never by application-layer filtering.

### Entities

| Table | Purpose | Key columns |
|---|---|---|
| `organizations` | Tenant root | `id`, `name`, `slug`, `category`, `logo_url`, `settings jsonb`, `invitation_policy` |
| `profiles` | Cross-org user identity, keyed to `auth.users.id` | `id`, `full_name`, `avatar_url`, `email`, `phone` |
| `memberships` | profile × org | `org_id`, `profile_id`, `role`, `status`, `tier`, `joined_at` |
| `invitations` | Invite links and approval queue | `org_id`, `token`, `email`, `role`, `expires_at`, `redeemed_by`, `revoked_at` |
| `posts` | Org feed | `org_id`, `author_id`, `kind`, `body`, `media_url`, `hidden_at` |
| `comments` | Threaded replies | `org_id`, `post_id`, `parent_id`, `author_id`, `body`, `hidden_at` |
| `reactions` | Single-tap reactions | `org_id`, `post_id`/`comment_id`, `profile_id`, `kind` |
| `follows` | Member follows member/chapter | `org_id`, `follower_id`, `target_id` |
| `events` | Events | `org_id`, `title`, `starts_at`, `venue`, `capacity`, `cover_url`, `ticketing_enabled`, `price_cents`, `created_by` |
| `registrations` | member × event | `org_id`, `event_id`, `profile_id`, `status`, `guest_count`, `payment_ref` |
| `tickets` | One per attendee | `org_id`, `event_id`, `registration_id`, `qr_token`, `status`, `checked_in_at`, `checked_in_by`, `checked_in_manually` |
| `event_checkers` | Scoped per-event grant | `event_id`, `profile_id`, `granted_by`, `granted_at` |
| `threads`, `thread_members`, `messages` | DMs, group threads, broadcasts | `org_id`, `kind`, `title` |
| `polls`, `poll_options`, `votes` | Community polls | `org_id`, `question`, `closes_at`; unique `(poll_id, profile_id)` |
| `plans`, `subscriptions`, `payments` | Dues and paid events | `org_id`, `interval`, `price_cents`, `stripe_*` |
| `moderation_reports` | Flagged content queue | `org_id`, `target_type`, `target_id`, `reporter_id`, `reason`, `status`, `resolved_by`, `resolved_at` |
| `notifications` | Mentions, replies, announcements, reminders | `org_id`, `profile_id`, `kind`, `payload jsonb`, `read_at` |

### Enums

- `member_role`: `admin`, `moderator`, `committee`, `member`, `guest`
- `member_status`: `pending`, `active`, `suspended`
- `post_kind`: `text`, `image`, `announcement`
- `registration_status`: `pending`, `confirmed`, `paid`, `cancelled`
- `ticket_status`: `valid`, `checked_in`, `void`
- `thread_kind`: `direct`, `group`, `broadcast`
- `report_status`: `open`, `dismissed`, `content_hidden`, `author_suspended`

---

## 7. RLS model

Every table has RLS enabled with explicit per-operation policies. No table is left open.

### Breaking policy recursion

The primary hazard is a policy on `memberships` that itself queries `memberships`, which
the planner cannot resolve. All membership checks therefore route through
`SECURITY DEFINER STABLE` helper functions, which bypass RLS internally and are called by
every other policy:

```sql
create function public.is_org_member(org uuid) returns boolean
  language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.org_id = org and m.profile_id = auth.uid() and m.status = 'active'
  );
$$;

create function public.current_member_role(org uuid) returns member_role ...
create function public.is_org_admin(org uuid) returns boolean ...      -- role = 'admin'
create function public.is_event_checker(evt uuid) returns boolean ...  -- event_checkers grant
```

### Policy shape

- **Read** on any domain table: `is_org_member(org_id)`.
- **Write** on member-owned rows (`posts`, `comments`, `reactions`, `registrations`,
  `votes`, `messages`): `is_org_member(org_id) and author/profile = auth.uid()`.
- **Admin write** (`memberships`, `invitations`, `plans`, `organizations`,
  `moderation_reports` resolution): `is_org_admin(org_id)`.
- **Committee write** on `events`: role in (`admin`, `committee`), and for update, only
  events they created or were added to.
- **Moderator** reads `moderation_reports` and may hide content; gets a read-only
  `memberships` view and no other admin surface.
- **`tickets`** is readable by the owning member and by org admins, and by checkers for
  their event. It has **no direct client `UPDATE` policy at all** — the only write path is
  the `check_in_ticket` RPC. This is what makes rule 4 hold.

Access rules are enforced in RLS *and* in routing, so typing a console URL directly does
not bypass them.

---

## 8. Ticketing — rules mapped to enforcement

| Rule | Enforcement |
|---|---|
| 1. Ticketing configured per event, never globally | `events.ticketing_enabled boolean`. No org-level setting exists. |
| 2. One ticket per registration; multi-guest issues one QR per attendee | Issuance trigger loops `registrations.guest_count`. |
| 3. A QR scans successfully exactly once; a second scan surfaces as duplicate | Conditional `UPDATE … WHERE qr_token = $1 AND status = 'valid'`. Zero rows → classify. Atomic, so concurrent scans cannot both win. |
| 4. Checker is a scoped per-event permission, no broader access | `event_checkers` + `is_event_checker(evt)`; `tickets` has no client `UPDATE` policy, only the RPC. |
| 5. Payment required → ticket only after payment succeeds | Trigger fires on `status → 'paid'`, set by the Stripe webhook. Pending/failed leaves no ticket. |
| 6. Cancelling a registration voids its tickets immediately | Trigger on `status → 'cancelled'` sets `void`, regardless of `checked_in`. |
| 7. Scan results and counts sync live to the admin dashboard | Realtime publication on `tickets`, subscribed filtered by `event_id`. |
| 8. Tickets render without signal at the door | Service worker caches the member's ticket payload and the QR is rendered client-side from the cached token. |

### The check-in RPC

```sql
create function public.check_in_ticket(token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t tickets; updated tickets;
begin
  select * into t from tickets where qr_token = token;
  if not found then return jsonb_build_object('result','unknown'); end if;
  if not is_event_checker(t.event_id) and not is_org_admin(t.org_id) then
    raise exception 'not authorized to scan this event';
  end if;

  update tickets set status = 'checked_in', checked_in_at = now(), checked_in_by = auth.uid()
   where id = t.id and status = 'valid'
   returning * into updated;

  if found then
    return jsonb_build_object('result','valid', 'ticket', to_jsonb(updated));
  end if;
  return jsonb_build_object('result',
    case t.status when 'checked_in' then 'duplicate' else 'void' end,
    'ticket', to_jsonb(t));
end $$;
```

Returns one of `valid`, `duplicate`, `void`, `unknown`. The scanner UI renders `valid` in
moss and everything else in clay, with the attendee name and the original check-in time.

---

## 9. Routes

```
/                      marketing landing — hero carousel, pillars, CTA
/login                 magic link + password
/join/[token]          invite redemption
/onboarding            org creation (name, category, logo)

/app/feed              stories rail, feed cards, compose FAB
/app/events            featured hero + event rows
/app/events/[id]       detail, RSVP / register / pay
/app/vote              open poll + election preview card
/app/card              digital membership card, counters, badges
/app/scan              checker mode — event picker
/app/scan/[eventId]    scan frame, laser, result card
/app/messages          thread list
/app/messages/[id]     conversation
/app/directory         searchable member directory
/app/notifications     in-app notification list

/admin                 redirect to members
/admin/members         approval queue block + filterable table
/admin/invitations     generate, expire, revoke, redemption status
/admin/events          upcoming / past split
/admin/events/[id]     day-of dashboard, checker assignment, attendee list
/admin/moderation      open queue + resolved tab
/admin/analytics       four stat cards + three charts, 30/90/365 selector
/admin/settings        org profile, plans, Stripe status, invitation policy

/api/stripe/webhook    checkout completion → registrations.status = 'paid'
```

Bottom nav carries five tabs — Feed, Events, Vote, Card, Scan — with Scan visible only to
members holding a Checker grant on a live event.

---

## 10. Module specifications

### 10.1 Organization and identity

Org creation captures name, category and logo. Members join by invite link, landing in an
admin approval queue, with email verification. Roles are the fixed set — admin, moderator,
committee, member, guest; no custom roles. A searchable member directory renders profile
cards.

### 10.2 Social feed

Text, image and announcement posts to the org feed. Threaded comments and single-tap
reactions. Following chapters, clubs and members. In-app notifications for mentions,
replies and announcements; Web Push where the browser permits.

Feed screen: top bar with the brass "S" mark, wordmark, and a notification bell carrying
an unread dot. A horizontally scrolling story rail with conic-gradient rings. Feed cards
showing author, timestamp, body, optional media, and like / comment / share. A clay FAB
bottom-right for composing.

### 10.3 Events

Creation with date, venue, capacity, cover image. RSVP and registration, free or paid. The
ticketing toggle is set at creation. Digital tickets generate automatically. In-app QR
check-in. Pre-event reminders that include the ticket.

Events screen: a featured event hero with a brass "Featured" pill and the title overlaid;
below it, rows carrying a mono date chip (day over month), title, venue, time, and a
right-aligned RSVP pill that turns solid moss on Going.

### 10.4 Messaging

1:1 direct messages, group threads for committees and clubs, and one-way admin
announcement broadcasts.

### 10.5 Payments and membership

Free and paid plans, monthly or annual dues, through Stripe Checkout. Paid event
registration through the same path. A digital membership card carrying a QR code as proof
of active membership.

Card screen: an `--ink` gradient with a diagonal brass weave, brand mark, "Active" status
pill, member name, "member since" line, member ID, animated counters for events, badges
and connections, and badge chips.

### 10.6 Vote

An open poll card — clay eyebrow with the vote count, question, closing time, tappable
options that fill with a moss progress bar and reveal percentages after voting, and a
lock-icon footnote reading one vote per verified member. One vote per active member,
enforced by a unique constraint. Below it, an upcoming board election card in a read-only
preview state (D5).

### 10.7 Checker mode

Visible only to members holding a Checker grant on a live event. Dark surface, event name,
"checking in as {name}", a live attendance counter reading `36 / 120`, a scan frame with a
sweeping laser, and a result card resolving valid in moss or duplicate in clay with the
attendee name and check-in time.

### 10.8 Admin console

Desktop-primary, but every destructive or approval action also works at 390px, because
volunteer admins approve members and check headcount from their pockets.

**Shell.** A fixed 260px `--ink` sidebar rail against a cream content area — the inverse of
the member app, so an admin always knows which surface they are on. The rail carries the
brass "S" mark, the org name in Fraunces, the admin's own name and role beneath it, then
nav items in IBM Plex Sans at 13.5px with a 2px brass left border and a faint brass wash on
the active item. Content pages open with a header block: mono uppercase eyebrow, Fraunces
page title, right-aligned primary action. Tables are white cards on cream with hairline row
separators; mono for IDs, dates, counts and statuses.

**Members.** Searchable, filterable table — name, role, status, tier, joined date, dues
state. Filters by role and status. Row actions to approve, suspend, reassign role, resend
invitation, with bulk selection for approve and role change. A pending-approval count
badges the nav item, and the queue sits at the top of the page as a distinct block rather
than a filtered view, because it is the one thing an admin opens the console to clear.
Suspension and role demotion ask for confirmation; approval does not. Invitations are
managed here too: generate a link, set an expiry, revoke, see who has redeemed.

**Events.** Upcoming / past split. Create and edit covers date, venue, capacity, cover
image, description, ticketing toggle and price. A ticketed event opens onto the day-of
dashboard: a large registered-versus-capacity figure, a live checked-in counter driven by
Realtime, a check-in rate over time, and the attendee list with per-row status —
registered, checked in with timestamp, or voided. Checker assignment lives on this page:
search members, grant Checker for this event only, revoke, and see who is currently
scanning. An admin can void an individual ticket and manually check in someone whose phone
has died; both actions are attributed in the attendee row.

**Moderation.** A queue of flagged posts and comments showing the reported content in
context, who reported it and why, and the author's history in one line. Three actions —
dismiss, hide content, suspend author — each recorded with the acting moderator and a
timestamp. Cleared items move to a resolved tab rather than disappearing.

**Analytics.** Four cards across the top: total active members, new members this period,
average event attendance, posts per week. Below them, member growth over time, event
attendance by event, and feed activity. A period selector for 30 / 90 / 365 days. Charts
use the token palette — brass for the primary series, moss for comparison, fog for
gridlines — and no chart library defaults.

**Settings.** Org name, category, logo, description, membership plans and pricing, Stripe
connection status, and the invitation policy for open link versus approval required.

**Access.** Admins see everything. Moderators see only Moderation and a read-only Members
list. Committee members see only Events, and only events they created or were added to.

---

## 11. Build order

Each stage runs before the next begins.

1. Schema, migrations, RLS policies, helper functions, ticketing triggers, seed script
2. Auth, org creation, invitations, approval queue, role system
3. App shell — bottom nav, tab transitions, top bar, design tokens, shared components
4. Feed, comments, reactions, notifications
5. Events, RSVP, full ticketing and checker flow including realtime attendance
6. Messaging
7. Stripe plans, dues, paid event registration, membership card
8. Admin console shell, members and approvals, invitations, moderation
9. Admin events, day-of dashboard, checker assignment, analytics, settings

The marketing landing hero is built alongside stage 3, once the app screens it renders
inside its phone frames exist.

---

## 12. Seed data

A demo org, **Riverdale Alumni**, carrying:

- ~40 members across all roles
- **Founders' Day Gala** — ticketed featured event, capacity 120, 36 already checked in
- Four further upcoming events
- A dozen feed posts with comments and reactions
- An open venue poll with 214 votes split 62 / 23 / 15
- One pending board election

The app must look alive on first run.

---

## 13. Testing

- **Vitest** — ticketing rule contracts (single-use scan, issuance on payment, void on
  cancel, checker authorization), permission helpers, analytics aggregation
- **Playwright** — the two walkthroughs in §1
- Integration tests require a live Supabase project and cannot execute until credentials
  exist (§2, open item)

---

## 14. Out of scope for v1

Elections and secure ballots beyond the read-only preview card, marketplace and deals, AI
assistant or moderator, gamification and leaderboards, advanced finance and accounting,
multi-organization switching UI, white-label branding, crypto payments, native video
conferencing. Each is specified elsewhere and sequenced into later phases.
