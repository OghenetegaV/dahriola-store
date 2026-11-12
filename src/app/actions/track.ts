"use server";

import { writeClient } from "@/src/lib/sanityWrite";
import { trackUrl } from "@/src/lib/orderStatus";

/** Order number + the email used at checkout → the private tracking link. */
export async function findOrderForTracking(orderNumber: string, email: string) {
  const ref = String(orderNumber || "").trim().toLowerCase().replace(/^#/, "");
  const mail = String(email || "").trim().toLowerCase();
  if (!ref || !mail) return { success: false, message: "Please enter your order number and email." };

  const match = await writeClient.fetch<string | null>(
    `*[_type == "order" && lower(orderNumber) == $ref && lower(customerEmail) == $mail][0].orderNumber`,
    { ref, mail }
  );
  if (!match) {
    return {
      success: false,
      message: "We couldn't find an order with those details. Check the order number in your receipt email, and use the email you checked out with.",
    };
  }
  return { success: true, url: trackUrl(match).replace(/^https?:\/\/[^/]+/, "") };
}
