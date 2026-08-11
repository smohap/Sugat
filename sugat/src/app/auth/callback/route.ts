import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";

/**
 * Where every email link lands. `@supabase/ssr` signs in with the PKCE flow, so
 * the redirect carries a one-time `code` that is exchanged here, server side,
 * for the session cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    const error =
      searchParams.get("error_description") ?? "That sign-in link is not valid.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That sign-in link has expired or was already used.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
