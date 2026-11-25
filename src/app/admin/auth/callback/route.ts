// Landing point for the "reset your password" email link: swaps the one-time
// code for a signed-in session, then sends them on to choose a new password.
import { NextResponse } from "next/server";
import { createAuthClient } from "@/src/lib/supabase/server";
import { dashboardReady } from "@/src/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/admin";
  // Only ever redirect inside the dashboard
  const target = next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  if (code && dashboardReady()) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(target, url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?expired=1", url.origin));
}
