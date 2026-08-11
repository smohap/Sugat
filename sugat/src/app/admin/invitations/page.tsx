import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { RolePill } from "@/components/ui/pill";
import {
  MEMBER_ROLES,
  ROLE_LABEL,
  canManageInvitations,
  isMemberRole,
  type MemberRole,
} from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

import { PageHeader } from "../page-header";
import { createInvitation, revokeInvitation } from "./actions";
import { CopyLink } from "./copy-link";

export const metadata = { title: "Invitations — Sugat" };

type Row = {
  id: string;
  token: string;
  email: string | null;
  role: MemberRole;
  expires_at: string | null;
  revoked_at: string | null;
  redeemed_at: string | null;
  created_at: string;
  profiles: { full_name: string } | { full_name: string }[] | null;
};

type State = { label: string; tone: string };

function stateOf(row: Row): State {
  if (row.redeemed_at) return { label: "Redeemed", tone: "text-moss" };
  if (row.revoked_at) return { label: "Revoked", tone: "text-clay" };
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return { label: "Expired", tone: "text-fog" };
  }
  return { label: "Open", tone: "text-brass" };
}

export default async function InvitationsPage({
  searchParams,
}: PageProps<"/admin/invitations">) {
  const viewer = await requireRole(canManageInvitations, "/admin/invitations");
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("invitations")
    .select(
      "id, token, email, role, expires_at, revoked_at, redeemed_at, created_at, profiles!invitations_redeemed_by_fkey ( full_name )",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as Row[];
  const origin = siteUrl();

  return (
    <>
      <PageHeader eyebrow={viewer.membership.org.name} title="Invitations" />

      {error ? (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      <form
        action={createInvitation}
        className="card mb-8 flex flex-wrap items-end gap-3 p-4"
      >
        <div className="min-w-[180px] flex-1">
          <Field label="For (optional)" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="member@example.com"
            />
          </Field>
        </div>
        <div className="w-[150px]">
          <Field label="Role" htmlFor="role">
            <Select id="role" name="role" defaultValue="member">
              {MEMBER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="w-[150px]">
          <Field label="Expires" htmlFor="expires_in">
            <Select id="expires_in" name="expires_in" defaultValue="30">
              <option value="7">In 7 days</option>
              <option value="30">In 30 days</option>
              <option value="90">In 90 days</option>
              <option value="never">Never</option>
            </Select>
          </Field>
        </div>
        <Button className="h-11">Generate link</Button>
      </form>

      <section className="card divide-y divide-[color:var(--color-line)]">
        {rows.map((row) => {
          const state = stateOf(row);
          const url = `${origin}/join/${row.token}`;
          const redeemer = Array.isArray(row.profiles)
            ? row.profiles[0]
            : row.profiles;
          const open = state.label === "Open";

          return (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-ink-2">
                  {url}
                </p>
                <p className="mono-label mt-1">
                  <span className={state.tone}>{state.label}</span>
                  {" · "}
                  {row.email ?? "anyone with the link"}
                  {redeemer ? ` · by ${redeemer.full_name}` : ""}
                  {row.expires_at && !row.redeemed_at
                    ? ` · until ${formatDate(row.expires_at)}`
                    : ""}
                </p>
              </div>

              {isMemberRole(row.role) ? <RolePill role={row.role} /> : null}

              {open ? (
                <div className="flex items-center gap-2">
                  <CopyLink url={url} />
                  <form action={revokeInvitation}>
                    <input type="hidden" name="invitation_id" value={row.id} />
                    <Button
                      variant="ghost"
                      className="h-8 px-3 text-[13px] text-fog hover:text-clay"
                    >
                      Revoke
                    </Button>
                  </form>
                </div>
              ) : null}
            </div>
          );
        })}

        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-fog">
            No invitations yet. Generate one above and send it to a member.
          </p>
        ) : null}
      </section>
    </>
  );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
