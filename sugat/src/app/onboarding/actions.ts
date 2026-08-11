"use server";

import { redirect } from "next/navigation";

import { uploadOrgLogo } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

export async function createOrganization(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Server Functions are reachable by direct POST, not only through the form.
  if (!user) return { error: "Your session has expired. Sign in again." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const logo = formData.get("logo");

  if (!fullName) return { error: "Enter your name." };
  if (!name) return { error: "Enter a name for your organization." };

  let logoUrl: string | null = null;
  if (logo instanceof File && logo.size > 0) {
    const upload = await uploadOrgLogo(supabase, logo);
    if (!upload.url) return { error: upload.error };
    logoUrl = upload.url;
  }

  // The admin's own name is what every member sees against announcements and
  // approvals, so it is captured here rather than left to a settings page.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (profileError) return { error: "Could not save your name. Try again." };

  // create_organization() is SECURITY DEFINER: it inserts the org, the
  // creator's admin membership, and a default plan in one transaction. A bare
  // insert could not grant the membership, because the admin-write policy
  // requires an admin membership that does not exist yet (0004_onboarding.sql).
  const { error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_category: category || null,
    p_logo_url: logoUrl,
  });

  if (error) return { error: error.message };

  redirect("/app");
}
