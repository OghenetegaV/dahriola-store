import { requireAdmin } from "@/src/lib/admin/auth";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { PageHeader } from "@/src/components/admin/blocks";
import PasswordForm from "@/src/components/admin/PasswordForm";
import { Card } from "@/src/components/admin/ui";
import TeamManager, { type TeamMember } from "./TeamManager";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const team = unwrap(
    await db().from("admin_users").select("email, name, role, created_at").order("created_at", { ascending: true }),
    "Loading the team"
  ) as TeamMember[];

  return (
    <>
      <PageHeader title="Settings" description="Who can sign in to this dashboard, and your own password." />
      <div className="space-y-6">
        <TeamManager team={team} me={admin.email} isOwner={admin.role === "owner"} />
        <Card title="Your password" description={`Signed in as ${admin.email}`}>
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
