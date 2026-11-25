import { db, unwrap } from "@/src/lib/supabase/admin";
import { PageHeader } from "@/src/components/admin/blocks";
import CouponsManager, { type CouponRow } from "./CouponsManager";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Discount codes" };

export default async function CouponsPage() {
  await requireAdmin();
  const coupons = unwrap(
    await db()
      .from("coupons")
      .select("id, code, discount_type, discount_value, is_active, first_order_only, expiry_date, assigned_email, usage_limit, times_used, purpose, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    "Loading discount codes"
  ) as CouponRow[];

  return (
    <>
      <PageHeader
        title="Discount codes"
        description="Codes customers type at checkout. Personal codes (birthdays, anniversaries, reminders) are made automatically and listed separately."
      />
      <CouponsManager coupons={coupons} />
    </>
  );
}
