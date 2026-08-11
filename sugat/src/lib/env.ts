/**
 * Environment access.
 *
 * Read lazily through these helpers rather than at module scope: a missing
 * variable should surface as a clear error on the request that needed it, not
 * as a build-time crash in a route that never touches Supabase.
 *
 * Each helper accepts the canonical name first, then the names Vercel's
 * Supabase integration writes when the project carries a `sugat_` prefix. Every
 * lookup is a literal `process.env.X`, never a computed key — Next.js inlines
 * `NEXT_PUBLIC_*` into the client bundle by static substitution, and a dynamic
 * lookup would come back undefined in the browser.
 */

function required(name: string, ...candidates: (string | undefined)[]): string {
  const value = candidates.find(Boolean);
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill it in, or set it in the Vercel project.`,
    );
  }
  return value;
}

export function supabaseUrl(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_sugat_SUPABASE_URL,
    // Server-only fallback: this one is not exposed to the browser, so the
    // browser client still needs one of the two public names above.
    process.env.sugat_SUPABASE_URL,
  );
}

export function supabaseAnonKey(): string {
  return required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_sugat_SUPABASE_ANON_KEY,
    // Supabase's newer key system calls this the publishable key. Either works
    // in this slot; both are safe to ship to the browser, and both are subject
    // to RLS.
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_sugat_SUPABASE_PUBLISHABLE_KEY,
  );
}

/** Server-only. Bypasses every RLS policy — never import from a client file. */
export function supabaseServiceRoleKey(): string {
  return required(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.sugat_SUPABASE_SERVICE_ROLE_KEY,
    process.env.sugat_SUPABASE_SECRET_KEY,
  );
}

/**
 * The origin invitation links and auth redirects are built against.
 *
 * Falls back to the Vercel production domain so a deploy works without the
 * variable being set by hand. Preview deployments still resolve to production
 * unless NEXT_PUBLIC_SITE_URL is set for the preview environment — which is the
 * right default: a magic link should land on the real site, not on whichever
 * preview happened to send it.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
