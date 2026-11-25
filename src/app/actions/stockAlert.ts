"use server";

import { COUNT, countRows, db, unwrap } from "@/src/lib/supabase/admin";
import { getMarketingSettings, normEmail } from "@/src/lib/marketing";
import { trackBrevoEvent } from "@/src/lib/brevo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Notify me when this print is back" on a sold-out print. */
export async function requestStockAlert(input: { email: string; productId: string; printId: string }) {
  try {
    const email = normEmail(input.email);
    if (!EMAIL_RE.test(email)) return { success: false, message: "Please enter a valid email address." };
    const productId = String(input.productId || "");
    const printId = String(input.printId || "");

    const settings = await getMarketingSettings();
    if (!settings.backInStockEnabled) return { success: false, message: "Alerts aren't available right now." };

    // The print must belong to this product and actually be sold out
    const link = unwrap(
      await db()
        .from("product_prints")
        .select("print:prints(stock_quantity)")
        .eq("product_id", productId)
        .eq("print_id", printId)
        .maybeSingle(),
      "Checking the print"
    ) as unknown as { print: { stock_quantity: number } | null } | null;
    if (!link?.print) return { success: false, message: "That print isn't available for this piece." };
    if (Number(link.print.stock_quantity || 0) > 0) return { success: false, message: "Good news, this print is back in stock!" };

    const existing = await countRows(
      db()
        .from("stock_alerts")
        .select("*", COUNT)
        .eq("email", email)
        .eq("print_id", printId)
        .eq("product_id", productId)
        .is("notified_at", null)
    );
    if (existing > 0) return { success: true, message: "You're already on the list for this one." };

    const open = await countRows(db().from("stock_alerts").select("*", COUNT).eq("email", email).is("notified_at", null));
    if (open >= 15) return { success: false, message: "You've asked for a lot of alerts already. We'll be in touch!" };

    unwrap(
      await db().from("stock_alerts").insert({ email, product_id: productId, print_id: printId }),
      "Saving the alert"
    );
    await trackBrevoEvent(email, "back_in_stock_requested", { product_id: productId, print_id: printId });
    return { success: true, message: "We'll email you as soon as it's back." };
  } catch (err) {
    console.error("requestStockAlert failed:", err);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
