"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/next-path";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  sentTo?: string;
};

/**
 * Magic link is the primary path (D6): invite redemption already arrives by
 * email, so signing in the same way costs the member nothing to remember.
 *
 * `shouldCreateUser` stays true — a first-time member following an invite has
 * no account yet, and the invite token in `next` is what admits them once they
 * land back.
 */
export async function sendMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeNextPath(formData.get("next"));

  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };

  return { sentTo: email };
}

/** The returning-user fallback. */
export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately not distinguishing "no such account" from "wrong password":
  // the difference tells an attacker which addresses are members.
  if (error) return { error: "That email and password did not match." };

  redirect(next);
}
