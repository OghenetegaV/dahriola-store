"use server";

import { optOut, verifyUnsubscribeToken } from "@/src/lib/marketing";

export async function confirmUnsubscribe(email: string, token: string) {
  if (!email || !verifyUnsubscribeToken(email, token)) {
    return { success: false, message: "This unsubscribe link isn't valid. Please use the link from your latest email." };
  }
  try {
    await optOut(email);
    return { success: true };
  } catch (err) {
    console.error("Unsubscribe failed:", err);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
