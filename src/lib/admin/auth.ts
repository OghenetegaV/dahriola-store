// Who is using the dashboard. Every admin page and every admin server action
// starts with requireAdmin(); nothing in /admin trusts the browser.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db, lc, isSupabaseConfigured } from "@/src/lib/supabase/admin";
import { createAuthClient } from "@/src/lib/supabase/server";
import { supabasePublicConfigured } from "@/src/lib/supabase/config";

export type AdminUser = { email: string; name: string | null; role: "owner" | "staff" };

/** True once all three Supabase keys are in the environment. */
export function dashboardReady() {
  return isSupabaseConfigured() && supabasePublicConfigured;
}

/** The signed-in person, if they are on the dashboard's access list. */
export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  if (!dashboardReady()) return null;
  try {
    const supabase = await createAuthClient();
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email?.trim().toLowerCase();
    if (!email) return null;

    const { data: row, error } = await db()
      .from("admin_users")
      .select("email, name, role")
      .eq("email", lc(email))
      .maybeSingle();
    if (error || !row) return null;
    return row as AdminUser;
  } catch {
    return null;
  }
});

/** Sends anyone who isn't a signed-in admin to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") redirect("/admin");
  return admin;
}
