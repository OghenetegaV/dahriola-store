import { requireAdmin } from "@/src/lib/admin/auth";
import { getNavCounts } from "@/src/lib/admin/data";
import { getActivity } from "@/src/lib/admin/activity";
import Shell from "@/src/components/admin/Shell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [counts, activity] = await Promise.all([getNavCounts(), getActivity()]);
  return (
    <Shell counts={counts} activity={activity} name={admin.name || ""} email={admin.email}>
      {children}
    </Shell>
  );
}
