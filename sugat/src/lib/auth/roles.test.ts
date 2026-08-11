import { describe, expect, it } from "vitest";

import {
  MEMBER_ROLES,
  canManageEvents,
  canManageMembers,
  canModerate,
  canViewMembers,
  consoleHomeFor,
  consoleSectionsFor,
  isMemberRole,
  roleRank,
  type MemberRole,
} from "./roles";

/**
 * These mirror the RLS helpers in 0002_rls.sql. If a policy there changes, one
 * of these should fail — that is the point of testing them separately from the
 * database rather than trusting the two to stay in step by inspection.
 */
describe("role capabilities", () => {
  it("gives only admins the members, invitations, analytics and settings surfaces", () => {
    const admins = MEMBER_ROLES.filter(canManageMembers);
    expect(admins).toEqual(["admin"]);
  });

  it("shares the moderation queue between admins and moderators", () => {
    expect(MEMBER_ROLES.filter(canModerate)).toEqual(["admin", "moderator"]);
  });

  it("lets moderators read the members list but not act on it", () => {
    expect(canViewMembers("moderator")).toBe(true);
    expect(canManageMembers("moderator")).toBe(false);
  });

  it("lets committee members manage events and nothing else", () => {
    expect(canManageEvents("committee")).toBe(true);
    expect(consoleSectionsFor("committee").map((s) => s.href)).toEqual([
      "/admin/events",
    ]);
  });

  it("gives plain members and guests no console at all", () => {
    for (const role of ["member", "guest"] as MemberRole[]) {
      expect(consoleSectionsFor(role)).toEqual([]);
      expect(consoleHomeFor(role)).toBeNull();
    }
  });

  it("lands each console role on the section it opened the console for", () => {
    expect(consoleHomeFor("admin")).toBe("/admin/members");
    expect(consoleHomeFor("moderator")).toBe("/admin/moderation");
    expect(consoleHomeFor("committee")).toBe("/admin/events");
  });

  it("ranks roles most privileged first", () => {
    expect(roleRank("admin")).toBeLessThan(roleRank("member"));
    expect(roleRank("member")).toBeLessThan(roleRank("guest"));
  });

  it("rejects role values that did not come from the enum", () => {
    expect(isMemberRole("admin")).toBe(true);
    expect(isMemberRole("owner")).toBe(false);
    expect(isMemberRole("")).toBe(false);
  });
});
