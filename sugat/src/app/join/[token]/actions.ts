"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type JoinState = { error?: string };

export async function redeemInvitation(
  _prev: JoinState,
  formData: FormData,
): Promise<JoinState> {
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!token) return { error: "That invitation link is incomplete." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session has expired. Sign in again." };

  // An admin approving from the queue sees a name, not an email address.
  if (fullName) {
    await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
  }

  // redeem_invitation() is SECURITY DEFINER and idempotent: it validates the
  // token, then admits the caller straight away or drops them into the approval
  // queue depending on the org's invitation policy (0004_onboarding.sql).
  const { error } = await supabase.rpc("redeem_invitation", {
    p_token: token,
  });

  if (error) return { error: error.message };

  // /app resolves the landing: the feed if they were admitted, the waiting
  // screen if the org requires approval.
  redirect("/app");
}
