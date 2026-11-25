"use server";

import { db, unwrap } from "@/src/lib/supabase/admin";
import { UserError, adminAction, text, textOrNull } from "@/src/lib/admin/action";
import { ORDER_STATUS_VALUES, type OrderStatus } from "@/src/lib/orderSteps";
import { processOrderStatusUpdates, recordStatusStep, type StatusHistoryEntry } from "@/src/lib/orderStatus";
import { recordCouponUse } from "@/src/lib/orders";
import { syncCustomerToBrevo } from "@/src/lib/marketing";

export type OrderStatusInput = {
  status: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
  /** Email the customer about this update */
  notify: boolean;
};

type Current = {
  status: string | null;
  status_history: StatusHistoryEntry[] | null;
  delivered_at: string | null;
  customer_email: string | null;
};

/** Changes where an order is up to, and (optionally) emails the customer. */
export async function updateOrderStatus(id: string, input: OrderStatusInput) {
  return adminAction<{ emailed: boolean; emailFailed: boolean }>(async () => {
    const status = text(input.status, 40) as OrderStatus;
    if (!ORDER_STATUS_VALUES.includes(status)) throw new UserError("Please choose a status.");
    const trackingUrl = text(input.trackingUrl, 500);
    if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
      throw new UserError("The tracking link should start with https://");
    }

    const current = unwrap(
      await db().from("orders").select("status, status_history, delivered_at, customer_email").eq("id", id).maybeSingle(),
      "Loading the order"
    ) as Current | null;
    if (!current) throw new UserError("This order could not be found.");

    const changed = current.status !== status;
    const delivered = status === "delivered";
    const note = text(input.note, 600);

    unwrap(
      await db()
        .from("orders")
        .update({
          status,
          courier: textOrNull(input.courier, 80),
          tracking_number: textOrNull(input.trackingNumber, 120),
          tracking_url: trackingUrl || null,
          status_note: input.notify ? note || null : null,
          delivered,
          delivered_at: delivered ? current.delivered_at || new Date().toISOString() : null,
          // Asking to email again about the same status clears the "already told them" marker
          ...(input.notify && !changed ? { status_emailed_for: null } : {}),
        })
        .eq("id", id),
      "Saving the order"
    );

    if (!input.notify) {
      // Quietly record the new step so the tracking page stays right
      if (changed) await recordStatusStep(id, status, current.status_history, undefined);
      return { emailed: false, emailFailed: false };
    }

    const stats = await processOrderStatusUpdates(id);
    return { emailed: stats.emailed > 0, emailFailed: stats.failed > 0 };
  });
}

export async function saveOrderNote(id: string, note: string) {
  return adminAction(async () => {
    unwrap(await db().from("orders").update({ internal_note: textOrNull(note, 2000) }).eq("id", id), "Saving the note");
  });
}

export async function updateOrderCustomer(
  id: string,
  input: { name: string; email: string; phone: string; address: string }
) {
  return adminAction(async () => {
    const email = text(input.email, 160).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UserError("That email address doesn't look right.");
    unwrap(
      await db()
        .from("orders")
        .update({
          customer_name: text(input.name, 120),
          customer_email: email,
          customer_phone: text(input.phone, 40),
          shipping_address: text(input.address, 600),
        })
        .eq("id", id),
      "Saving the customer details"
    );
  });
}

/** For payments Paystack couldn't confirm automatically, after checking them by hand. */
export async function confirmPayment(id: string) {
  return adminAction(async (admin) => {
    const order = unwrap(
      await db().from("orders").select("payment_verified, discount_code, customer_email").eq("id", id).maybeSingle(),
      "Loading the order"
    ) as { payment_verified: boolean; discount_code: string | null; customer_email: string | null } | null;
    if (!order) throw new UserError("This order could not be found.");
    if (order.payment_verified) return;

    const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" });
    unwrap(
      await db()
        .from("orders")
        .update({ payment_verified: true, verification_note: `Confirmed by hand by ${admin.email} on ${today}.` })
        .eq("id", id),
      "Confirming the payment"
    );
    await recordCouponUse(order.discount_code || undefined);
    if (order.customer_email) {
      try {
        await syncCustomerToBrevo(order.customer_email);
      } catch (err) {
        console.error("Brevo sync after manual confirmation failed:", err);
      }
    }
  });
}
