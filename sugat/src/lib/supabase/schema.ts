/**
 * The Postgres schema every application table, view and RPC lives in.
 *
 * Declared once because it has to agree in three places that fail differently:
 * the migrations that create the objects, the clients that query them, and the
 * "Exposed schemas" list in Supabase's API settings. If PostgREST has not been
 * told about this schema, every request 404s with `PGRST106` no matter how
 * correct the SQL is.
 */
export const DB_SCHEMA = "sugat";
