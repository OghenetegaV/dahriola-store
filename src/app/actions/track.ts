"use server";

import { db, lc, unwrap } from "@/src/lib/supabase/admin";
import { trackUrl } from "@/src/lib/orderStatus";

/** Order number + the email used at checkout → the private tracking link. */
export async function findOrderForTracking(orderNumber: string, email: string) {
  const ref = String(orderNumber || "").trim().toLowerCase().replace(/^#/, "");
  const mail = String(email || "").trim().toLowerCase();
  if (!ref || !mail) return { success: false, message: "Please enter your order number and email." };

  const match = unwrap(
    await db()
      .from("orders")
      .select("order_number")
      .eq("order_number_lc", lc(ref))
      .eq("customer_email_lc", lc(mail))
      .limit(1)
      .maybeSingle(),
    "Order lookup"
  ) as { order_number: string } | null;
  if (!match) {
    return {
      success: false,
      message: "We couldn't find an order with those details. Check the order number in your receipt email, and use the email you checked out with.",
    };
  }
  return { success: true, url: trackUrl(match.order_number).replace(/^https?:\/\/[^/]+/, "") };
}
