# Sugather

A venture of **AIDO Technologies Ltd**.

A mobile-first, multi-tenant Community Operating System. Design specification:
[`docs/superpowers/specs/2026-08-10-sugat-mvp-design.md`](../docs/superpowers/specs/2026-08-10-sugat-mvp-design.md).

Next.js 16 (App Router) · Tailwind CSS v4 · Supabase (Postgres, Auth, Storage,
Realtime) · Stripe.

## Build progress

| Stage | Scope | State |
|---|---|---|
| 1 | Schema, RLS, helpers, ticketing triggers, seed | Done |
| 2 | Auth, org creation, invitations, approval queue, role system | Done |
| 3 | App shell, design tokens, landing hero | Next |
| 4–9 | Feed, events and ticketing, messaging, payments, admin console | Not started |

Sections marked "Stage n" inside the admin console are placeholders naming the
stage that delivers them.

## Setup

The application is Supabase-only (D1) and cannot run until you supply a project.

1. **Environment.** `cp .env.example .env.local` and fill it in from
   Supabase → Project Settings → API.

2. **Database.** Link and push. This applies migrations `0001`–`0006`.

   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

3. **Expose the schema.** Every table and RPC lives in `sugat`, not `public`.
   Supabase → Settings → API → **Exposed schemas**: add `sugat` to the list
   already there. Add, never replace — on a shared project, removing a schema
   another application is served from takes that application offline.

   Skip this and the SQL is perfectly correct while every request fails with
   `PGRST106: schema must be one of the following`. It is the single most
   likely reason a fresh deploy looks broken.

4. **Demo data** (optional, but the app is designed to look alive on first run):

   ```bash
   npx supabase db push --include-seed
   ```

   If your CLI does not carry that flag, paste `supabase/seed.sql` into the
   Supabase SQL editor instead — it is idempotent and replaces the demo org
   wholesale each run. Seeds the Riverdale Alumni org. Every seeded account signs in with the
   password `sugather-demo` at its `@riverdale.demo` address — throwaway data, never
   run it against a database holding real members.

5. **Auth redirect URLs.** Supabase → Authentication → URL Configuration: add
   `http://localhost:3000/auth/callback` and, after the first deploy, the same
   path on the Vercel domain.

6. **Email templates** (recommended). Supabase's stock magic-link template sends
   members through the project's verify endpoint. Rewriting it to

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
   ```

   routes them to `/auth/confirm` instead, which works when the link is opened
   in a different browser from the one that requested it. The stock template
   works too — it lands on `/auth/callback`, and both handlers exist.

7. **Run.**

   ```bash
   npm run dev
   ```

## Commands

```bash
npm run dev     # dev server
npm run build   # production build
npm test        # vitest — permission helpers, ticketing rule contracts
npm run lint    # eslint
```

## Shape of the code

```
src/proxy.ts              session refresh + signed-out redirects (Next 16 renamed Middleware to Proxy)
src/lib/supabase/         request-scoped server client, browser client, proxy client
src/lib/auth/roles.ts     the five fixed roles and who may open which console section
src/lib/auth/session.ts   getViewer() and the route guards every surface sits behind
src/app/login             magic link (primary) and password (fallback) — D6
src/app/join/[token]      invitation redemption
src/app/onboarding        org creation
src/app/admin             console: rail, members and approvals, invitations
supabase/migrations       the source of truth for schema, RLS and invariants
```

Authorization is enforced twice, deliberately: in RLS, so a forged request
fails at the database, and in routing, so typing a console URL directly does not
render a page you cannot use.

## Sharing the database

This project's Postgres instance is shared — **Wishmart** owns the `public`
schema on the same database. Nothing here reads, alters or drops anything in
`public`; the migrations are purely additive everywhere they leave their own
schema. Four places touch shared ground, and each one is fenced:

| Shared object | How it stays additive |
|---|---|
| `auth.users` | The signup trigger is `sugat_on_auth_user_created`, not the tutorial-standard `on_auth_user_created`. Postgres fires every AFTER INSERT trigger, so ours runs beside whatever else is hooked there. |
| `storage.objects` | Four policies, all named `sugat_org_logos_*`, all fenced to `bucket_id = 'org-logos'`. Policies combine with OR, so one that can only be true for our bucket cannot widen access to another's. |
| `supabase_realtime` | `sugat.tickets` is added to the publication, never redefining it — guarded against a missing publication, a `FOR ALL TABLES` one, and a repeat run. |
| `extensions` | `pgcrypto` is pinned to the `extensions` schema, and `if not exists` makes it a no-op wherever it is already installed. |

Everything else — 23 tables, 11 enums, 22 functions, every policy and trigger —
is inside `sugat`. `sugat.profiles` and `public.profiles` are different tables
that share nothing but a name, so the names overlapping with Wishmart's is not a
collision.

There is no teardown or reset script in this repository, deliberately. On a
shared database the only safe migration is one that adds.

One consequence worth knowing: both applications hook `auth.users`, so a
Wishmart signup also creates a row in `sugat.profiles`, and a Sugather signup
creates one in Wishmart's. They are inert — a profile with no membership has no
organization, sees no data under RLS, and is routed to onboarding.
