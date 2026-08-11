"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { canManageMembers, isMemberRole } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/**
 * These are reachable by direct POST, not only through the console, so each one
 * re-establishes who is asking. RLS would refuse the write anyway — this is the
 * half that produces a sentence instead of a silent no-op.
 */
async function adminContext() {
  const viewer = await requireRole(canManageMembers, "/admin/members");
  const supabase = await createClient();
  return { supabase, orgId: viewer.membership.org_id };
}

function back(error?: string): never {
  revalidatePath("/admin/members");
  redirect(error ? `/admin/members?error=${encodeURIComponent(error)}` : "/admin/members");
}

export async function approveMember(formData: FormData) {
  const id = String(formData.get("membership_id") ?? "");
  const { supabase, orgId } = await adminContext();

  // The status flip is what assigns the member number (0004_onboarding.sql).
  const { error } = await supabase
    .from("memberships")
    .update({ status: "active" })
    .eq("id", id)
    .eq("org_id", orgId);

  back(error ? "Could not approve that member." : undefined);
}

export async function setMemberStatus(formData: FormData) {
  const id = String(formData.get("membership_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const { supabase, orgId } = await adminContext();

  if (status !== "active" && status !== "suspended" && status !== "pending") {
    back("Unknown member status.");
  }

  const { error } = await supabase
    .from("memberships")
    .update({ status })
    .eq("id", id)
    .eq("org_id", orgId);

  // The last-admin guard in 0005 raises here rather than letting an org lock
  // itself out of its own console.
  back(error ? errorMessage(error.message) : undefined);
}

export async function setMemberRole(formData: FormData) {
  const id = String(formData.get("membership_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const { supabase, orgId } = await adminContext();

  if (!isMemberRole(role)) back("Unknown role.");

  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("id", id)
    .eq("org_id", orgId);

  back(error ? errorMessage(error.message) : undefined);
}

function errorMessage(raw: string): string {
  if (raw.includes("at least one active admin")) {
    return "An organization must keep at least one active admin. Promote someone else first.";
  }
  return "That change could not be saved.";
}
