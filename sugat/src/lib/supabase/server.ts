import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Request-scoped client for Server Components, Server Actions and Route
 * Handlers. Every query runs under the caller's JWT, so RLS — not application
 * filtering — decides what comes back. Never cache or share the instance
 * across requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Refreshed tokens are
          // persisted by the proxy instead, which runs before this render.
        }
      },
    },
  });
}
