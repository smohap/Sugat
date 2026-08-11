import { redirect } from "next/navigation";

import { consoleSectionsFor } from "@/lib/auth/roles";
import { requireActiveMember } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { ConsoleRail } from "./console-rail";

/**
 * Console shell (§10.8): a fixed ink rail against a cream content area — the
 * inverse of the member app, so an admin always knows which surface they are
 * on. The rail is built here in stage 2 because the role system needs a visible
 * surface to gate; stage 8 fills out the sections behind it.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { profile, membership } = await requireActiveMember("/admin");
  const sections = consoleSectionsFor(membership.role);

  // A role with no console section has no console at all.
  if (sections.length === 0) redirect("/app");

  // The one number that badges the rail: what an admin opens the console to
  // clear. RLS scopes this to their own org without a filter here.
  const supabase = await createClient();
  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("org_id", membership.org_id)
    .eq("status", "pending");

  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <ConsoleRail
        orgName={membership.org.name}
        adminName={profile.full_name || profile.email || "Admin"}
        role={membership.role}
        sections={sections.map(({ href, label }) => ({ href, label }))}
        pendingCount={count ?? 0}
      />
      <div className="flex-1 bg-cream px-[var(--gutter)] py-8 md:px-8 md:py-10">
        {children}
      </div>
    </div>
  );
}
