// Creates (or repairs) a dashboard login.
//
//   npx tsx scripts/create-admin.ts <email> <password> "<name>" [owner|staff]
//
// e.g. npx tsx scripts/create-admin.ts owner@example.com "a-long-password" "Dahriola" owner
//
// Run it once for the store owner. After that, owners can add the rest of the
// team from Settings inside the dashboard. Running it again for the same email
// resets that person's password.
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i < 0 || line.trim().startsWith("#")) continue;
  process.env[line.slice(0, i).trim()] ??= line.slice(i + 1).trim().replace(/^"|"$/g, "");
}

async function main() {
  const [emailArg, password, name, roleArg] = process.argv.slice(2);
  const email = String(emailArg || "").trim().toLowerCase();
  const role = roleArg === "staff" ? "staff" : "owner";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password (8+ characters)> "<name>" [owner|staff]');
    process.exit(1);
  }
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !key) {
    console.error("Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY to .env.local first.");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const created = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) {
    if (!/already (been )?registered|already exists/i.test(created.error.message)) throw new Error(created.error.message);
    // The sign-in exists already: set the new password on it
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) throw new Error(error.message);
    const user = data.users.find((u) => u.email?.toLowerCase() === email);
    if (!user) throw new Error("That email is registered but could not be found. Reset the password in Supabase → Authentication → Users.");
    const updated = await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (updated.error) throw new Error(updated.error.message);
    console.log("Existing sign-in found: password updated.");
  }

  const { error } = await supabase.from("admin_users").upsert({ email, name: name || null, role }, { onConflict: "email" });
  if (error) throw new Error(`${error.message}. Have you run supabase/schema.sql yet?`);

  console.log(`Done. ${email} can now sign in at /admin as ${role === "owner" ? "an owner" : "staff"}.`);
}

main().catch((err) => {
  console.error("Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
