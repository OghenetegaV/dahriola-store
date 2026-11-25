"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db, lc } from "@/src/lib/supabase/admin";
import { createAuthClient } from "@/src/lib/supabase/server";
import { dashboardReady, requireAdmin } from "@/src/lib/admin/auth";

export type FormState = { error?: string; message?: string } | null;

const clean = (v: FormDataEntryValue | null) => String(v ?? "").trim();

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  if (!dashboardReady()) return { error: "The dashboard isn't connected to Supabase yet." };
  const email = clean(form.get("email")).toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "That email and password don't match. Please try again." };

  const { data: allowed } = await db().from("admin_users").select("email").eq("email", lc(email)).maybeSingle();
  if (!allowed) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have access to the dashboard." };
  }
  redirect("/admin");
}

export async function signOut() {
  if (dashboardReady()) {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  if (!dashboardReady()) return { error: "The dashboard isn't connected to Supabase yet." };
  const email = clean(form.get("email")).toLowerCase();
  if (!email) return { error: "Enter your email address." };

  const h = await headers();
  const origin = h.get("origin") || `https://${h.get("host")}`;
  const supabase = await createAuthClient();
  // Same message whether or not the account exists, so emails can't be guessed
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/admin/auth/callback?next=/admin/new-password` });
  return { message: "If that email has dashboard access, a reset link is on its way. Open it on this device." };
}

export async function setNewPassword(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Your password has been changed." };
}
