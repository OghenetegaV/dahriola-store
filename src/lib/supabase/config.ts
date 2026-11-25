// Supabase connection settings. Safe to import anywhere (no secrets here).
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim().replace(/\/+$/, "");
// Supabase calls this the "publishable" key on newer projects and the "anon" key on older ones
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
export const MEDIA_BUCKET = "media";

/** True once the public URL and anon key have been added to the environment. */
export const supabasePublicConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
