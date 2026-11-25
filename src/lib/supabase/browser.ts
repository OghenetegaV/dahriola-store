"use client";

// Browser Supabase client. The dashboard only uses it to send files straight
// to storage with a one-time upload link created by the server.
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/src/lib/supabase/config";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function browserSupabase() {
  if (!cached) cached = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return cached;
}
