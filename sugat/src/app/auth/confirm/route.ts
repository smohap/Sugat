import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { safeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";

/**
 * The token-hash variant of the same landing.
 *
 * Supabase's stock email templates send members through the project's own
 * verify endpoint. Templates rewritten to
 * `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` — which
 * is what Supabase recommends for server-rendered apps, because the link then
 * works when opened in a different browser — arrive here instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That sign-in link is not valid.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That sign-in link has expired or was already used.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
