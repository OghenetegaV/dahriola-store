// Server-only: order status steps, customer tracking links and the processor
// that emails customers when the owner changes an order's status in Studio.
import { writeClient } from "@/src/lib/sanityWrite";
import { hmac, randomId, safeEqual } from "@/src/lib/signing";
import { SITE_URL } from "@/src/lib/events";
import { sendOrderStatusEmail } from "@/src/lib/mailer";
import { getMarketingSettings } from "@/src/lib/marketing";

export const ORDER_STEPS = [
  { value: "received", label: "Order received", blurb: "We've received your order and payment." },
  { value: "in_production", label: "In production", blurb: "Your pieces are being made by our team." },
  { value: "ready", label: "Ready to ship", blurb: "Finished, checked and carefully packed." },
  { value: "shipped", label: "Shipped", blurb: "On its way with the courier." },
  { value: "out_for_delivery", label: "Out for delivery", blurb: "Arriving soon." },
  { value: "delivered", label: "Delivered", blurb: "Enjoy your DAHRIOLA pieces!" },
] as const;

export type OrderStatus = (typeof ORDER_STEPS)[number]["value"] | "cancelled";

export function statusLabel(status?: string) {
  if (status === "cancelled") return "Cancelled";
  return ORDER_STEPS.find((s) => s.value === status)?.label || "Order received";
}

/** Tracking link for well-known couriers when the owner doesn't paste one. */
export function courierTrackingUrl(courier?: string, trackingNumber?: string) {
  const n = encodeURIComponent(String(trackingNumber || "").trim());
  if (!n) return undefined;
  const c = String(courier || "").toLowerCase();
  if (c.includes("dhl")) return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${n}`;
  if (c.includes("ups")) return `https://www.ups.com/track?tracknum=${n}`;
  if (c.includes("fedex")) return `https://www.fedex.com/fedextrack/?trknbr=${n}`;
  return undefined;
}

// ---- Customer tracking links (no login needed, can't be guessed) ----
const norm = (ref: string) => String(ref || "").trim().toLowerCase();
export function trackToken(orderNumber: string) {
  return hmac(`track|${norm(orderNumber)}`).slice(0, 24);
}
export function trackUrl(orderNumber: string) {
  return `${SITE_URL}/track?o=${encodeURIComponent(norm(orderNumber))}&t=${trackToken(orderNumber)}`;
}
export function verifyTrackToken(orderNumber: string, token: string) {
  return safeEqual(trackToken(orderNumber), String(token || ""));
}

export type TrackedOrder = {
  orderNumber: string;
  createdAt?: string;
  status: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  history: { status: string; at: string }[];
  items: { name: string; size?: string; selectedPrintName?: string; quantity?: number; image?: string; slug?: string }[];
  isGift?: boolean;
  giftRecipient?: string;
  total?: number;
};

/** What the customer may see about their order. No address or contact details. */
export async function getTrackedOrder(orderNumber: string): Promise<TrackedOrder | null> {
  const o = await writeClient.fetch<(Omit<TrackedOrder, "history" | "status"> & { status?: string; delivered?: boolean; history?: TrackedOrder["history"] }) | null>(
    `*[_type == "order" && lower(orderNumber) == $ref][0]{
      orderNumber, createdAt, status, delivered, courier, trackingNumber, trackingUrl,
      "history": statusHistory[]{ status, at },
      "items": items[]{ name, size, selectedPrintName, quantity, "image": product->images[0].asset->url, "slug": product->slug.current },
      isGift, giftRecipient, "total": totalAmount
    }`,
    { ref: norm(orderNumber) }
  );
  if (!o) return null;
  const status = o.status || (o.delivered ? "delivered" : "received");
  return {
    ...o,
    status,
    trackingUrl: o.trackingUrl || courierTrackingUrl(o.courier, o.trackingNumber),
    history: o.history?.length ? o.history : [{ status: "received", at: o.createdAt || new Date().toISOString() }],
    items: o.items || [],
  };
}

// ---- Status change processor ----
type PendingOrder = {
  _id: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  status: string;
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  statusNote?: string;
  isGift?: boolean;
  giftRecipient?: string;
  items?: { name: string; size?: string; quantity?: number }[];
};

/**
 * Emails customers about status changes the owner has published in Studio.
 * Called by the Sanity webhook straight away, and by the daily job as a
 * safety net. Only orders using the new status field are touched, so past
 * orders never get surprise emails.
 */
export async function processOrderStatusUpdates(orderId?: string) {
  const idFilter = orderId ? "&& _id == $id" : "";
  const params = { id: String(orderId || "").replace(/^drafts\./, "") };
  const stats = { synced: 0, emailed: 0, recorded: 0, failed: 0 };

  // Keep the "Delivered" tick and the status in step
  const toDeliver = await writeClient.fetch<string[]>(
    `*[_type == "order" && defined(status) && delivered == true && !(status in ["delivered", "cancelled"]) ${idFilter}]._id`,
    params
  );
  for (const id of toDeliver) {
    await writeClient.patch(id).set({ status: "delivered" }).commit();
    stats.synced++;
  }
  const toTick = await writeClient.fetch<string[]>(
    `*[_type == "order" && status == "delivered" && delivered != true ${idFilter}]._id`,
    params
  );
  for (const id of toTick) {
    await writeClient.patch(id).set({ delivered: true }).commit();
    stats.synced++;
  }

  const pending = await writeClient.fetch<PendingOrder[]>(
    `*[_type == "order" && defined(status) && status != coalesce(statusEmailedFor, "") ${idFilter}][0...50]{
      _id, orderNumber, customerName, customerEmail, status, courier, trackingNumber, trackingUrl, statusNote,
      isGift, giftRecipient, "items": items[]{ name, size, quantity }
    }`,
    params
  );
  if (!pending.length) return stats;

  const settings = await getMarketingSettings();
  for (const order of pending) {
    let sent = false;
    if (settings.shippingEmailsEnabled && order.customerEmail && order.status !== "received") {
      sent = await sendOrderStatusEmail({
        to: order.customerEmail,
        name: order.customerName || "",
        reference: order.orderNumber,
        status: order.status,
        statusLabel: statusLabel(order.status),
        steps: ORDER_STEPS.map((s) => ({ value: s.value, label: s.label })),
        courier: order.courier,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl || courierTrackingUrl(order.courier, order.trackingNumber),
        note: order.statusNote,
        trackUrl: trackUrl(order.orderNumber),
        items: order.items || [],
        giftRecipient: order.isGift ? order.giftRecipient : undefined,
      });
      if (sent) stats.emailed++;
      else {
        stats.failed++;
        continue; // try again on the next run
      }
    }
    // Record the step either way, so it isn't retried forever and the
    // tracking page shows the right timeline
    await writeClient
      .patch(order._id)
      .set({ statusEmailedFor: order.status })
      .unset(["statusNote"])
      .setIfMissing({ statusHistory: [] })
      .append("statusHistory", [{ _key: randomId(8), status: order.status, at: new Date().toISOString(), ...(order.statusNote ? { note: order.statusNote } : {}) }])
      .commit();
    stats.recorded++;
  }
  return stats;
}
