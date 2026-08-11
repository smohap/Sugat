import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Refreshes the session on every matched request and writes any rotated tokens
 * back onto the response. Server Components cannot set cookies, so if this does
 * not run the refresh is silently lost and members get logged out at random.
 *
 * Returns both the response carrying the cookies and the user, so the caller
 * can make its redirect decision without a second round trip.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // A response that sets auth cookies must never be cached by a CDN, or
        // one member's session token is served to the next visitor.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Must be getUser(), not getSession(): only getUser() revalidates the JWT
  // against the auth server, and this is the call that triggers the refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
