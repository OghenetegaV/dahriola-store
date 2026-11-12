"use server";

import { writeClient as serverClient } from "@/src/lib/sanityWrite";

export async function validateCoupon(inputCode: string, customerEmail?: string) {
  const query = `*[_type == "coupon" && code == $code && isActive == true][0]{
    discountType,
    discountValue,
    expiryDate,
    firstOrderOnly,
    assignedEmail,
    usageLimit,
    timesUsed
  }`;

  const coupon = await serverClient.fetch(query, {
    code: String(inputCode || "").trim().toUpperCase(),
  });

  if (!coupon) return { success: false, message: "Invalid or inactive code" };

  // Check Expiry
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return { success: false, message: "This coupon has expired" };
  }

  // Usage limit (personal codes are single-use)
  if (coupon.usageLimit && Number(coupon.timesUsed || 0) >= Number(coupon.usageLimit)) {
    return { success: false, message: "This code has already been used" };
  }

  // Personal codes only work for the customer they were made for
  if (coupon.assignedEmail) {
    const email = String(customerEmail || "").trim().toLowerCase();
    if (!email) {
      return { success: false, message: "Enter your email above before applying this code" };
    }
    if (email !== String(coupon.assignedEmail).trim().toLowerCase()) {
      return { success: false, message: "This code is linked to a different email address" };
    }
  }

  // First-order-only codes: reject if this email has ordered before
  if (coupon.firstOrderOnly) {
    const email = String(customerEmail || "").trim().toLowerCase();
    if (!email) {
      return {
        success: false,
        message: "Enter your email above before applying this code",
      };
    }

    const previousOrders = await serverClient.fetch(
      `count(*[_type == "order" && lower(customerEmail) == $email])`,
      { email }
    );

    if (previousOrders > 0) {
      return {
        success: false,
        message: "This code is only valid on your first order",
      };
    }
  }

  return {
    success: true,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}
