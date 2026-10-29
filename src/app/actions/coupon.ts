"use server";

import { createClient } from "@sanity/client";

// Server-side client so order history can be checked without exposing it to the browser
const serverClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-03",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

export async function validateCoupon(inputCode: string, customerEmail?: string) {
  const query = `*[_type == "coupon" && code == $code && isActive == true][0]{
    discountType,
    discountValue,
    expiryDate,
    firstOrderOnly
  }`;

  const coupon = await serverClient.fetch(query, {
    code: String(inputCode || "").trim().toUpperCase(),
  });

  if (!coupon) return { success: false, message: "Invalid or inactive code" };

  // Check Expiry
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return { success: false, message: "This coupon has expired" };
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
