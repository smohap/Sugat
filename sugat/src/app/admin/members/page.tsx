import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { RolePill, StatusPill } from "@/components/ui/pill";
import {
  canManageMembers,
  canViewMembers,
  isMemberRole,
  roleRank,
  type MemberRole,
  type MemberStatus,
} from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { PageHeader } from "../page-header";
import { approveMember, setMemberRole, setMemberStatus } from "./actions";
import { ConfirmForm, RoleSelect } from "./member-controls";

export const metadata = { title: "Members — Sugather" };

type Row = {
  id: string;
  role: MemberRole;
  status: MemberStatus;
  tier: string;
  member_no: string | null;
  joined_at: string;
  profiles: { id: string; full_name: string; email: string | null } | null;
};

export default async function MembersPage({
  searchParams,
}: PageProps<"/admin/members">) {
  const viewer = await requireRole(canViewMembers, "/admin/members");
  const params = await searchParams;

  const error = typeof params.error === "string" ? params.error : null;
  const roleFilter =
    typeof params.role === "string" && isMemberRole(params.role)
      ? params.role
      : null;
  const statusFilter =
    params.status === "active" ||
    params.status === "pending" ||
    params.status === "suspended"
      ? params.status
      : null;

  const supabase = await createClient();

  // No org filter: `memberships_read` already scopes this to orgs the caller
  // belongs to, and adding one here would imply the isolation lives in the app.
  let query = supabase
    .from("memberships")
    .select(
      "id, role, status, tier, member_no, joined_at, profiles ( id, full_name, email )",
    );

  if (roleFilter) query = query.eq("role", roleFilter);
  if (statusFilter) query = query.eq("status", statusFilter);

  const { data } = await query.order("joined_at", { ascending: false });

  const rows = normalize(data ?? []);
  const pending = rows.filter((row) => row.status === "pending");
  const listed = statusFilter === "pending" ? pending : rows;
  const editable = canManageMembers(viewer.membership.role);

  return (
    <>
      <PageHeader
        eyebrow={viewer.membership.org.name}
        title="Members"
        action={
          editable ? (
            <a
              href="/admin/invitations"
              className="mono-label transition-colors duration-[var(--dur-control)] ease-sugather hover:text-ink"
            >
              Invite members →
            </a>
          ) : null
        }
      />

      {error ? (
        <div className="mb-6">
          <Notice tone="error">{error}</Notice>
        </div>
      ) : null}

      {/*
        The queue sits at the top as its own block rather than a filtered view,
        because it is the one thing an admin opens the console to clear (§10.8).
      */}
      {editable && pending.length > 0 ? (
        <section className="card mb-8 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="mono-label text-brass">Awaiting approval</span>
            <span className="mono-label">{pending.length}</span>
          </div>
          <ul>
            {pending.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] text-ink">
                    {row.profiles?.full_name || "Unnamed member"}
                  </p>
                  <p className="mono-label mt-0.5 truncate normal-case tracking-normal">
                    {row.profiles?.email ?? "—"}
                  </p>
                </div>
                <RolePill role={row.role} />
                <div className="flex items-center gap-2">
                  <form action={approveMember}>
                    <input type="hidden" name="membership_id" value={row.id} />
                    <Button className="h-9 px-4 text-[13.5px]">Approve</Button>
                  </form>
                  <ConfirmForm
                    action={setMemberStatus}
                    message="Decline this request? They will not be able to get in without a new invitation."
                  >
                    <input type="hidden" name="membership_id" value={row.id} />
                    <input type="hidden" name="status" value="suspended" />
                    <Button
                      variant="ghost"
                      className="h-9 px-4 text-[13.5px] text-fog hover:text-clay"
                    >
                      Decline
                    </Button>
                  </ConfirmForm>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Filters role={roleFilter} status={statusFilter} />

      <section className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-line">
              {["Member", "Role", "Status", "Tier", "Joined", ""].map(
                (heading) => (
                  <th key={heading} className="mono-label px-4 py-3 font-normal">
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {listed.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-b-0">
                <td className="px-4 py-3">
                  <p className="text-[14.5px] text-ink">
                    {row.profiles?.full_name || "Unnamed member"}
                  </p>
                  <p className="font-mono text-[11.5px] text-fog">
                    {row.member_no ?? row.profiles?.email ?? "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {editable ? (
                    <RoleSelect
                      action={setMemberRole}
                      membershipId={row.id}
                      role={row.role}
                      disabled={row.status !== "active"}
                    />
                  ) : (
                    <RolePill role={row.role} />
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3 font-mono text-[11.5px] text-fog">
                  {row.tier}
                </td>
                <td className="px-4 py-3 font-mono text-[11.5px] text-fog">
                  {formatDate(row.joined_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  {editable ? <StatusAction row={row} /> : null}
                </td>
              </tr>
            ))}
            {listed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-fog">
                  No members match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

function StatusAction({ row }: { row: Row }) {
  if (row.status === "active") {
    return (
      <ConfirmForm
        action={setMemberStatus}
        message="Suspend this member? They lose access until you restore them."
      >
        <input type="hidden" name="membership_id" value={row.id} />
        <input type="hidden" name="status" value="suspended" />
        <Button
          variant="ghost"
          className="h-8 px-3 text-[13px] text-fog hover:text-clay"
        >
          Suspend
        </Button>
      </ConfirmForm>
    );
  }

  return (
    <form action={row.status === "pending" ? approveMember : setMemberStatus}>
      <input type="hidden" name="membership_id" value={row.id} />
      <input type="hidden" name="status" value="active" />
      <Button variant="secondary" className="h-8 px-3 text-[13px]">
        {row.status === "pending" ? "Approve" : "Restore"}
      </Button>
    </form>
  );
}

function Filters({
  role,
  status,
}: {
  role: MemberRole | null;
  status: MemberStatus | null;
}) {
  const chips: { label: string; href: string; on: boolean }[] = [
    { label: "All", href: "/admin/members", on: !role && !status },
    ...(["pending", "active", "suspended"] as const).map((value) => ({
      label: value[0].toUpperCase() + value.slice(1),
      href: `/admin/members?status=${value}`,
      on: status === value,
    })),
    ...(["admin", "moderator", "committee"] as const).map((value) => ({
      label: value[0].toUpperCase() + value.slice(1) + "s",
      href: `/admin/members?role=${value}`,
      on: role === value,
    })),
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <a
          key={chip.href}
          href={chip.href}
          className={[
            "rounded-full border px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.12em]",
            "transition-colors duration-[var(--dur-control)] ease-sugather",
            chip.on
              ? "border-ink bg-ink text-cream"
              : "border-line bg-white text-fog hover:text-ink",
          ].join(" ")}
        >
          {chip.label}
        </a>
      ))}
    </div>
  );
}

function normalize(rows: unknown[]): Row[] {
  return (rows as (Omit<Row, "profiles"> & {
    profiles: Row["profiles"] | Row["profiles"][];
  })[])
    .map((row) => ({
      ...row,
      profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
    }))
    .sort(
      (a, b) =>
        roleRank(a.role) - roleRank(b.role) ||
        a.joined_at.localeCompare(b.joined_at),
    );
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
