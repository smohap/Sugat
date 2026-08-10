# Sugat — Opus 5 Build Prompt (v1)

Paste everything below the line into Claude Code as the opening message.

---

<role>
You are building **Sugat**, a mobile-first Community Operating System — one app that replaces the WhatsApp groups, Eventbrite links, Google Forms, spreadsheets and standalone ballot tools that volunteer-run associations, chapters and clubs stitch together today. Build the MVP: a real, working, multi-tenant application, not a clickable prototype.
</role>

<stack>
Next.js (App Router, TypeScript) as a mobile-first PWA, Supabase for Postgres + Auth + Storage + Realtime, Tailwind for styling, Stripe Checkout for payments. No component library — build the components, styled to the design system below.

Everything renders correctly at 390px width first; desktop is a widened layout of the same routes, plus the admin console which is desktop-primary.
</stack>

<design_system>
Sugat has an established visual identity. Use it exactly — do not substitute your own palette or fonts.

Tokens (define once as CSS variables, reference everywhere):

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

Typography: **Fraunces** (serif) for all headings and the wordmark; **IBM Plex Sans** for body; **IBM Plex Mono** for metadata, labels, counts, IDs, timestamps, status pills — uppercase with 0.06–0.14em letter-spacing.

Surface rules: cream page background, white cards at 14–18px radius with soft low-opacity shadows (`0 8px 18px -12px rgba(28,43,57,0.25)`), 18px horizontal page gutters, 1px hairline borders using `--line`. Dark surfaces (`--ink`) are reserved for the membership card, event hero, checker mode and the admin rail.

Brand mark: a brass rounded square, 7–8px radius, containing a Fraunces "S" in ink.

Motion: CSS-only micro-interactions. Tab switches slide horizontally with a moving indicator; the like control pops on tap; poll result bars fill on a 0.8s ease; the membership card flips in on mount; the checker's scan frame has a sweeping laser line. Respect `prefers-reduced-motion`.

No dark mode in v1.
</design_system>

<data_model>
Multi-tenant from the first migration. Every domain row carries `org_id`; enforce isolation with Postgres RLS policies, not application-layer filtering.

Core entities:

- `organizations` — name, slug, category, logo, settings
- `profiles` — cross-org user identity (a person may belong to several orgs)
- `memberships` — profile × org, with `role` in (`admin`, `moderator`, `committee`, `member`, `guest`), status in (`pending`, `active`, `suspended`), joined date, tier
- `invitations` — invite links and the approval queue
- `posts`, `comments`, `reactions` — org feed; post kinds: text, image, announcement
- `follows` — a member follows a chapter, club or member
- `events` — date, location, capacity, cover image, `ticketing_enabled`, `price`
- `registrations` — member × event, status, payment reference
- `tickets` — one per attendee, unique single-use QR token, status in (`valid`, `checked_in`, `void`)
- `event_checkers` — scoped per-event permission grant
- `threads`, `thread_members`, `messages` — 1:1 DMs, group threads, admin broadcasts
- `polls`, `poll_options`, `votes` — one vote per active member, enforced by a unique constraint
- `plans`, `subscriptions`, `payments` — free and paid tiers, monthly/annual dues via Stripe
- `moderation_reports` — flagged posts and comments queue
- `notifications` — mentions, replies, announcements, event reminders
</data_model>

<mvp_scope>
Six modules ship in v1. Build all six.

**1. Organization & identity.** Org creation and onboarding (name, category, logo). Member sign-up by invite link, with an admin approval queue and email verification. Fixed role set — admin, moderator, committee, member, guest; no custom roles. Searchable member directory with profile cards.

**2. Social feed.** Text, image and announcement posts to the org feed. Threaded comments and single-tap reactions. Following chapters, clubs and members. Push and in-app notifications for mentions, replies and announcements.

**3. Events.** Creation with date, location, capacity and cover image. RSVP and registration, free or paid. Per-event ticketing toggle set at creation time. Automatic digital ticket generation. In-app QR check-in. Automated pre-event reminders that include the ticket.

**4. Messaging.** 1:1 direct messages, group threads for committees and clubs, and one-way admin announcement broadcasts.

**5. Payments & membership.** Free and paid plans with annual or monthly dues. Stripe Checkout for dues and paid events. A digital membership card carrying a QR code as proof of active membership.

**6. Admin console.** Member and role management — approve, suspend, reassign. Content moderation queue for flagged posts and comments. Analytics on member growth, event attendance and post activity.
</mvp_scope>

<ticketing_rules>
This is the module most likely to be built wrong, so the rules are stated exhaustively. Implement all of them.

Lifecycle: ticketing is enabled on an event → each member who registers, or whose payment clears for a paid event, automatically receives one ticket record tied to their account → the ticket carries a unique QR code, the member's name, the event and a status, viewable in the app's wallet → at the venue a member holding the Checker permission for that event scans the code and the ticket flips to `checked_in` for every checker in real time.

Business rules:

1. Ticketing is configured per event, never globally. An org runs ticketed and non-ticketed events side by side.
2. One ticket per registration; a group or multi-guest registration issues one QR per attendee.
3. A QR code scans in successfully exactly once. A second scan is surfaced as a duplicate / already-used attempt, not a silent success.
4. Checker is a scoped, per-event permission. An org admin or committee member grants it to specific members — door volunteers — without granting any broader admin access.
5. When registration requires payment, the ticket is issued only after payment succeeds. A pending or failed payment leaves no valid ticket.
6. Cancelling a registration voids the associated ticket immediately, whether or not it has been checked in.
7. Scan results and attendance counts sync live to the org admin's event dashboard via Supabase Realtime for day-of headcount.
8. Tickets render from locally cached data so they display without signal at the door.
</ticketing_rules>

<screens>
Member app — five bottom-nav tabs, matching the approved mockup:

- **Feed** — top bar with brass "S" mark, wordmark and a notification bell carrying an unread dot. A horizontally scrolling story rail with conic-gradient rings. Feed cards showing author, timestamp, body, optional media, and like / comment / share actions. A clay FAB, bottom right, for composing.
- **Events** — a featured event hero with a brass "Featured" pill and the title overlaid. Below it, a list of event rows, each with a mono date chip (day over month), title, venue and time, and a right-aligned RSVP pill that turns solid moss when the state is Going.
- **Vote** — an open poll card: clay eyebrow with the vote count, question, closing time, tappable options that fill with a moss progress bar and reveal percentages after voting, and a lock-icon footnote reading one vote per verified member. Below it, an upcoming board election card in a preview state.
- **Card** — the digital membership card on an `--ink` gradient with a diagonal brass weave, brand mark, an "Active" status pill, member name, "member since" line, member ID, and a row of animated counters for events, badges and connections, plus badge chips.
- **Scan** — checker mode, visible only to members holding the Checker permission for a live event. Dark surface, event name, "checking in as {name}", a live attendance counter reading `36 / 120`, a scan frame with a sweeping laser, and a result card that resolves valid in moss or duplicate in clay with the attendee name and check-in time.

Admin console — desktop-primary, specified in full below.
</screens>

<admin_console>
The console is where an org admin runs the community. It is desktop-primary and does not have to be a phone experience, but every destructive or approval action must also work on a phone at 390px, because volunteer admins approve members and check headcount from their pockets.

**Shell.** A fixed 260px `--ink` sidebar rail against a cream content area — the inverse of the member app, so an admin always knows which surface they are on. The rail carries the brass "S" mark, the org name in Fraunces, the admin's own name and role beneath it, then nav items in IBM Plex Sans at 13.5px with a 2px brass left border and a faint brass wash on the active item. Content pages open with a header block: mono uppercase eyebrow, Fraunces page title, and a right-aligned primary action. Tables are white cards on cream with hairline row separators, mono for IDs, dates, counts and statuses.

**Members.** A searchable, filterable table — name, role, status, tier, joined date, dues state. Filters by role and status. Row actions to approve, suspend, reassign role and resend invitation, with bulk selection for approve and role change. A pending-approval count badges the nav item and the queue sits at the top of the page as a distinct block rather than a filtered view, because it is the one thing an admin opens the console to clear. Suspension and role demotion ask for confirmation; approval does not. Invitations are managed here too: generate a link, set an expiry, revoke, and see who has redeemed.

**Events.** A list split into upcoming and past. Creating or editing an event covers date, venue, capacity, cover image, description, the ticketing toggle and price. Opening a ticketed event gives the day-of dashboard: a large registered-versus-capacity figure, a live checked-in counter driven by Supabase Realtime, a check-in rate over time, and the attendee list with per-row status — registered, checked in with timestamp, or voided. Checker assignment lives on this page: search members, grant Checker for this event only, revoke it, and see who is currently scanning. An admin can void an individual ticket and manually check someone in whose phone has died, and both actions are attributed in the attendee row.

**Moderation.** A queue of flagged posts and comments showing the reported content in context, who reported it and why, and the author's history in one line. Three actions — dismiss, hide content, suspend author — each recorded with the acting moderator and a timestamp. Cleared items move to a resolved tab rather than disappearing.

**Analytics.** Four cards across the top: total active members, new members this period, average event attendance, and posts per week. Below them, member growth over time, event attendance by event, and feed activity. A period selector for 30 / 90 / 365 days. Charts use the token palette — brass for the primary series, moss for comparison, fog for gridlines — and no chart library defaults.

**Settings.** Org name, category, logo, description, membership plans and pricing, Stripe connection status, and the invitation policy for open link versus approval required.

**Access.** Admins see everything. Moderators see only Moderation and a read-only Members list. Committee members see only Events, and only events they created or were added to. Enforce this in RLS policies as well as in the routing, so the rules hold if someone types a URL directly.
</admin_console>

<build_order>
Work in this sequence and get each stage running before starting the next.

1. Schema, migrations and RLS policies for all entities above, with a seed script.
2. Auth, org creation, invitations, the approval queue and the role system.
3. The app shell — bottom nav, tab transitions, top bar, design tokens and the shared component set.
4. Feed, comments, reactions, notifications.
5. Events, RSVP, then the full ticketing and checker flow including realtime attendance.
6. Messaging.
7. Stripe plans, dues, paid event registration, membership card.
8. Admin console shell, members and approvals, invitations, moderation.
9. Admin events, the live day-of dashboard, checker assignment, analytics and settings.
</build_order>

<seed_data>
Seed a demo org, "Riverdale Alumni", with roughly 40 members across all roles, a Founders' Day Gala as a ticketed featured event with about 120 capacity and 36 already checked in, four further upcoming events, a dozen feed posts with comments and reactions, an open venue poll with 214 votes split 62 / 23 / 15, and one pending board election. The app should look alive on first run.
</seed_data>

<out_of_scope>
Do not build: elections and secure ballots beyond the read-only preview card, marketplace and deals, AI assistant or moderator, gamification and leaderboards, advanced finance and accounting, multi-organization switching UI, white-label branding, crypto payments, or native video conferencing. These are later phases and are already specified elsewhere.
</out_of_scope>

<working_agreement>
Deliver what is asked, at the scope intended. Make routine judgment calls yourself and check in only where different readings of the spec would lead to materially different work. If a decision here looks mistaken or a better approach exists, say so in a sentence and continue as specified rather than quietly widening or narrowing the job.

Keep solutions minimal. No speculative abstractions, no helpers for one-time operations, no error handling for scenarios that cannot happen, no configuration for hypothetical future requirements. Validate at the boundaries — user input and external APIs — and trust internal code. Comment only where the logic is not self-evident.

Before your first tool call, say in one sentence what you are about to do. While working, give a brief update only when you find something important or change direction. At the end of each build stage, lead with what now works.

Keep chat responses short; put the effort into the code. Remove any temporary or scratch files at the end of a stage.
</working_agreement>

<done_when>
An admin creates an org, invites members, approves them, and posts an announcement. A member joins, RSVPs to the ticketed gala, pays, and sees a QR ticket in their wallet. A volunteer granted Checker on that event scans the ticket, it flips to checked-in, the attendance counter on the admin dashboard increments live, and a second scan of the same code is rejected as a duplicate.

On the console side: an admin clears a pending member from the approval queue, grants a volunteer Checker on the gala without giving them any other admin access, watches the attendance counter move while the door is running, manually checks in an attendee whose phone has died, hides a flagged comment, and sees member growth for the last 90 days.
</done_when>
