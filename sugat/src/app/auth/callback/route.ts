import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";

/**
 * Where every sign-in lands: email links, and the return trip from Google and
 * Facebook. `@supabase/ssr` signs in with the PKCE flow, so all of them arrive
 * carrying a one-time `code` that is exchanged here, server side, for the
 * session cookies.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (!code) {
    // A provider that refuses — a cancelled Google consent screen, a Facebook
    // app in development mode — comes back here with a description instead.
    const error =
      searchParams.get("error_description") ?? "That sign-in was not completed.";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "That sign-in has expired or was already used. Try again.",
      )}`,
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
