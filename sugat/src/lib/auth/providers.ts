/**
 * Third-party sign-in providers.
 *
 * Kept as data rather than hardcoded in the form so the server action can
 * validate what it was handed: the provider arrives as a string in a FormData
 * body, which is reachable by direct POST, and `signInWithOAuth` would happily
 * be asked for any provider Supabase knows about.
 */

export const OAUTH_PROVIDERS = ["google", "facebook"] as const;

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export const OAUTH_LABEL: Record<OAuthProvider, string> = {
  google: "Google",
  facebook: "Facebook",
};

export function isOAuthProvider(value: string): value is OAuthProvider {
  return (OAUTH_PROVIDERS as readonly string[]).includes(value);
}
