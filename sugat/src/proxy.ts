import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 renamed Middleware to Proxy; the mechanics are unchanged.
 *
 * Two jobs, and only two. It refreshes the Supabase session so rotated tokens
 * survive, and it bounces signed-out visitors off the authenticated surfaces.
 * It deliberately does not check roles or membership status — that needs the
 * database, and the authorization decision belongs where it can be enforced:
 * in the route's own guard (`src/lib/auth/session.ts`) and in RLS.
 */
const PROTECTED = [
  "/app",
  "/admin",
  "/onboarding",
  "/pending",
  "/suspended",
];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const needsAuth = PROTECTED.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (needsAuth && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  // A signed-in member has no use for the login screen; send them to the
  // router, which knows whether they land in the app, the queue, or onboarding.
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Everything except Next's own assets and image files. The session refresh
     * has to run broadly — a member who only ever loads the landing page still
     * needs their token rotated before it expires.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
