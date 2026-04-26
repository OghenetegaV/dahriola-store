"use client"; 
import { client } from "@/src/lib/sanity";

export async function validateCoupon(inputCode: string) {
  const query = `*[_type == "coupon" && code == $code && isActive == true][0]{
    discountType,
    discountValue,
    expiryDate
  }`;
  
  const coupon = await client.fetch(query, { code: inputCode.toUpperCase() });

  if (!coupon) return { success: false, message: "Invalid or inactive code" };

  // Check Expiry
  if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
    return { success: false, message: "This coupon has expired" };
  }

  return { success: true, ...coupon };
}