"use server";

import { redirect } from "next/navigation";

import { safeNextPath } from "@/lib/auth/next-path";
import { isOAuthProvider } from "@/lib/auth/providers";
import { siteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  /** Set when a link has been sent and the screen should say so. */
  sentTo?: string;
  /** Set when a new account needs its email confirmed before it can be used. */
  confirmSent?: string;
};

/**
 * Supabase's own floor is 6. Eight is not a meaningful security improvement on
 * its own, but the members using this are volunteers picking a password for a
 * community app, and the nudge is free.
 */
const MIN_PASSWORD = 8;

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

/**
 * Create an account with a password.
 *
 * `full_name` rides along in the user metadata because the `handle_new_user`
 * trigger reads `raw_user_meta_data ->> 'full_name'` when it creates the
 * profile row — so the name is there before the member reaches any screen that
 * could ask for it, and an admin sees a person in the approval queue rather
 * than an email address.
 */
export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const next = safeNextPath(formData.get("next"));

  if (!fullName) return { error: "Enter your name." };
  if (!email) return { error: "Enter your email address." };
  if (password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters for a password.` };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) return { error: error.message };

  // With email confirmation on — the Supabase default — there is no session
  // yet and the member has to open the link first.
  //
  // Supabase deliberately returns a decoy user with an empty `identities` array
  // when the address is already registered, so that this endpoint cannot be
  // used to enumerate members. Saying "check your email" to both cases is the
  // point of that design, not an oversight: someone who really owns the address
  // gets a sign-in link either way.
  if (!data.session) return { confirmSent: email };

  redirect(next);
}

/**
 * Google and Facebook.
 *
 * `signInWithOAuth` on the server does not redirect by itself — it returns the
 * provider's authorization URL and, importantly, writes the PKCE verifier
 * cookie through this request. That cookie is what makes the code exchange in
 * /auth/callback succeed, which is why this runs as a Server Action rather than
 * from the browser client.
 */
export async function signInWithProvider(formData: FormData) {
  const provider = String(formData.get("provider") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!isOAuthProvider(provider)) {
    redirect(`/login?error=${encodeURIComponent("Unknown sign-in provider.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(
        "That sign-in method is not available right now.",
      )}`,
    );
  }

  redirect(data.url);
}
