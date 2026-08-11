import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  consoleHomeFor,
  isMemberRole,
  type MemberRole,
  type MemberStatus,
} from "./roles";

export type ViewerProfile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email: string | null;
};

export type ViewerOrg = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  logo_url: string | null;
  invitation_policy: "open_link" | "approval_required";
};

export type ViewerMembership = {
  id: string;
  org_id: string;
  role: MemberRole;
  status: MemberStatus;
  tier: string;
  member_no: string | null;
  joined_at: string;
  org: ViewerOrg;
};

export type Viewer = {
  userId: string;
  email: string | null;
  profile: ViewerProfile;
  /**
   * The organization this request acts in. Multi-org switching is out of scope
   * for v1 (§14), so it is the caller's single membership — active preferred
   * over pending, oldest first — and null while they have none at all.
   */
  membership: ViewerMembership | null;
};

const ORG_FIELDS = "id, name, slug, category, logo_url, invitation_policy";

/**
 * Everything a route needs about who is asking, in one round trip pair.
 * Returns null when there is no session; guards below turn that into a
 * redirect. Never trust `getSession()` here — only `getUser()` revalidates the
 * token against the auth server.
 */
export async function getViewer(): Promise<Viewer | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select(
        `id, org_id, role, status, tier, member_no, joined_at,
         organizations ( ${ORG_FIELDS} )`,
      )
      .eq("profile_id", user.id)
      .order("joined_at", { ascending: true }),
  ]);

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: (profile as ViewerProfile | null) ?? {
      id: user.id,
      full_name: "",
      avatar_url: null,
      email: user.email ?? null,
    },
    membership: pickMembership(memberships ?? []),
  };
}

type MembershipRow = Omit<ViewerMembership, "org"> & {
  // supabase-js returns the embedded parent as an object, but types it loosely
  // enough that an array is worth tolerating.
  organizations: ViewerOrg | ViewerOrg[] | null;
};

function pickMembership(rows: unknown[]): ViewerMembership | null {
  const parsed: ViewerMembership[] = [];

  for (const row of rows as MembershipRow[]) {
    const org = Array.isArray(row.organizations)
      ? row.organizations[0]
      : row.organizations;
    if (!org || !isMemberRole(row.role)) continue;

    parsed.push({
      id: row.id,
      org_id: row.org_id,
      role: row.role,
      status: row.status,
      tier: row.tier,
      member_no: row.member_no,
      joined_at: row.joined_at,
      org,
    });
  }

  return (
    parsed.find((row) => row.status === "active") ??
    parsed.find((row) => row.status === "pending") ??
    parsed[0] ??
    null
  );
}

// ------------------------------------------------------------------ guards

export async function requireViewer(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) {
    redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  }
  return viewer;
}

export type ActiveViewer = Viewer & { membership: ViewerMembership };

/**
 * The gate every member surface sits behind. A caller with no membership is
 * sent to onboarding, one still in the approval queue to the waiting screen,
 * and a suspended one to their own notice — the three states an admin's
 * decisions can put someone in.
 */
export async function requireActiveMember(next?: string): Promise<ActiveViewer> {
  const viewer = await requireViewer(next);
  const membership = viewer.membership;

  if (!membership) redirect("/onboarding");
  if (membership.status === "pending") redirect("/pending");
  if (membership.status === "suspended") redirect("/suspended");

  return viewer as ActiveViewer;
}

/**
 * Console guard. Access rules are enforced in RLS *and* in routing (§7), so
 * typing a console URL directly does not get you a page you cannot use.
 */
export async function requireRole(
  allows: (role: MemberRole) => boolean,
  next?: string,
): Promise<ActiveViewer> {
  const viewer = await requireActiveMember(next);

  if (!allows(viewer.membership.role)) {
    redirect(consoleHomeFor(viewer.membership.role) ?? "/app");
  }

  return viewer;
}
