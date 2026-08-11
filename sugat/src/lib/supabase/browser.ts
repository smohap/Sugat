import { createBrowserClient } from "@supabase/ssr";

import { supabaseAnonKey, supabaseUrl } from "@/lib/env";

/**
 * Browser client. Used for the handful of things that genuinely belong on the
 * client — OTP sign-in, Realtime subscriptions, camera-side scanning — not as a
 * general data layer. Reads and mutations go through Server Components and
 * Server Actions.
 */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
