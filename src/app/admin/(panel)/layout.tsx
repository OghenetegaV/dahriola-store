import { requireAdmin } from "@/src/lib/admin/auth";
import { getNavCounts } from "@/src/lib/admin/data";
import Shell from "@/src/components/admin/Shell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const counts = await getNavCounts();
  return (
    <Shell counts={counts} name={admin.name || ""} email={admin.email}>
      {children}
    </Shell>
  );
}
