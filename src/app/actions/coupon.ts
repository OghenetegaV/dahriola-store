"use server";

import { COUNT, countRows, db, lc, unwrap } from "@/src/lib/supabase/admin";

type CouponRow = {
  discount_type: "percentage" | "fixed";
  discount_value: number;
  expiry_date: string | null;
  first_order_only: boolean;
  assigned_email: string | null;
  usage_limit: number | null;
  times_used: number | null;
};

export async function validateCoupon(inputCode: string, customerEmail?: string) {
  const code = String(inputCode || "").trim().toUpperCase();
  if (!code) return { success: false, message: "Invalid or inactive code" };

  const coupon = unwrap(
    await db()
      .from("coupons")
      .select("discount_type, discount_value, expiry_date, first_order_only, assigned_email, usage_limit, times_used")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle(),
    "Checking the code"
  ) as CouponRow | null;

  if (!coupon) return { success: false, message: "Invalid or inactive code" };

  // Check Expiry
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    return { success: false, message: "This coupon has expired" };
  }

  // Usage limit (personal codes are single-use)
  if (coupon.usage_limit && Number(coupon.times_used || 0) >= Number(coupon.usage_limit)) {
    return { success: false, message: "This code has already been used" };
  }

  const email = String(customerEmail || "").trim().toLowerCase();

  // Personal codes only work for the customer they were made for
  if (coupon.assigned_email) {
    if (!email) {
      return { success: false, message: "Enter your email above before applying this code" };
    }
    if (email !== String(coupon.assigned_email).trim().toLowerCase()) {
      return { success: false, message: "This code is linked to a different email address" };
    }
  }

  // First-order-only codes: reject if this email has ordered before
  if (coupon.first_order_only) {
    if (!email) {
      return { success: false, message: "Enter your email above before applying this code" };
    }
    const previousOrders = await countRows(
      db().from("orders").select("*", COUNT).eq("customer_email_lc", lc(email))
    );
    if (previousOrders > 0) {
      return { success: false, message: "This code is only valid on your first order" };
    }
  }

  return {
    success: true,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
  };
}
