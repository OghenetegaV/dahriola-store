// Server-only Supabase client using the service-role key, which bypasses Row
// Level Security. Import it only from server components, server actions and
// API routes — never from a client component.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/src/lib/supabase/config";

// Supabase calls this the "secret" key on newer projects and the "service_role" key on older ones
const serviceKey = () => (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

/** False until NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) are set. */
export function isSupabaseConfigured() {
  return !!SUPABASE_URL && !!serviceKey();
}

let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to the environment."
    );
  }
  if (!cached) {
    cached = createClient(SUPABASE_URL, serviceKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return cached;
}

/** Unwraps a Supabase result, throwing on error so callers can use try/catch. */
export function unwrap<T>(res: { data: T | null; error: { message: string } | null }, what = "Database request"): T {
  if (res.error) throw new Error(`${what} failed: ${res.error.message}`);
  return res.data as T;
}

/**
 * Lowercased, trimmed text for matching against the generated `*_lc` columns
 * (emails and order numbers). Always use `.eq()` with these: `.ilike()` treats
 * `*`, `%` and `_` typed by a visitor as wildcards.
 */
export function lc(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

/** Quotes text values for a PostgREST in.(...) / not.in.(...) filter. */
export function inList(values: string[]) {
  return `(${values.map((v) => `"${String(v).replace(/["\\]/g, "")}"`).join(",")})`;
}

/** Row count for a query built with `.select("*", COUNT)`. */
export async function countRows(query: PromiseLike<{ count: number | null; error: { message: string } | null }>) {
  const { count, error } = await query;
  if (error) throw new Error(`Count failed: ${error.message}`);
  return count || 0;
}

export const COUNT = { count: "exact", head: true } as const;

/**
 * Supabase returns at most 1,000 rows per request. This reads a whole result
 * in pages. `build` must apply a stable `.order(...)` and end with
 * `.range(from, to)`.
 */
export async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>,
  what = "Database request",
  max = 50_000
): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; from < max; from += size) {
    const rows = unwrap(await build(from, from + size - 1), what) as T[] | null;
    out.push(...(rows || []));
    if (!rows || rows.length < size) break;
  }
  return out;
}
