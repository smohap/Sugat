/**
 * The role system.
 *
 * Five fixed roles, no custom roles (§10.1). Everything the UI needs to decide
 * — labels, ordering, and who may open which console section — is derived here
 * so no route invents its own rule. These predicates mirror the RLS helpers in
 * `0002_rls.sql`; the database is the enforcement, this is the routing half of
 * the same decision.
 */

export const MEMBER_ROLES = [
  "admin",
  "moderator",
  "committee",
  "member",
  "guest",
] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];
export type MemberStatus = "pending" | "active" | "suspended";

export const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
  committee: "Committee",
  member: "Member",
  guest: "Guest",
};

export const STATUS_LABEL: Record<MemberStatus, string> = {
  pending: "Pending",
  active: "Active",
  suspended: "Suspended",
};

/** Sort order for tables and pickers — most privileged first. */
export function roleRank(role: MemberRole): number {
  return MEMBER_ROLES.indexOf(role);
}

export function isMemberRole(value: string): value is MemberRole {
  return (MEMBER_ROLES as readonly string[]).includes(value);
}

// ------------------------------------------------------------- capabilities

export const isAdmin = (role: MemberRole) => role === "admin";

/** Moderation queue. Shared by admins and moderators. */
export const canModerate = (role: MemberRole) =>
  role === "admin" || role === "moderator";

/** Create events; committee members may only edit the ones they created. */
export const canManageEvents = (role: MemberRole) =>
  role === "admin" || role === "committee";

/**
 * Moderators get the members list, but read-only — they need to see who they
 * are moderating. Only an admin may approve, suspend, or change a role.
 */
export const canViewMembers = canModerate;
export const canManageMembers = isAdmin;

export const canManageInvitations = isAdmin;
export const canViewAnalytics = isAdmin;
export const canManageSettings = isAdmin;

/**
 * Console sections in rail order, each with the predicate that admits a role.
 * A role matching nothing has no console at all and is redirected out of it.
 */
export const CONSOLE_SECTIONS = [
  { href: "/admin/members", label: "Members", allows: canViewMembers },
  {
    href: "/admin/invitations",
    label: "Invitations",
    allows: canManageInvitations,
  },
  { href: "/admin/events", label: "Events", allows: canManageEvents },
  { href: "/admin/moderation", label: "Moderation", allows: canModerate },
  { href: "/admin/analytics", label: "Analytics", allows: canViewAnalytics },
  { href: "/admin/settings", label: "Settings", allows: canManageSettings },
] as const;

export type ConsoleSection = (typeof CONSOLE_SECTIONS)[number];

export function consoleSectionsFor(role: MemberRole): ConsoleSection[] {
  return CONSOLE_SECTIONS.filter((section) => section.allows(role));
}

/**
 * Where a role lands when it opens `/admin` with no section named. Not simply
 * the first permitted section: a moderator may read the members list, but
 * moderation is what they opened the console for.
 */
const CONSOLE_HOME: Partial<Record<MemberRole, string>> = {
  admin: "/admin/members",
  moderator: "/admin/moderation",
  committee: "/admin/events",
};

export function consoleHomeFor(role: MemberRole): string | null {
  return CONSOLE_HOME[role] ?? null;
}
