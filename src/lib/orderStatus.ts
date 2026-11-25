// Server-only: order status steps, customer tracking links and the processor
// that emails customers when the owner changes an order's status in the dashboard.
import { db, lc, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
import type { StoredOrderItem } from "@/src/lib/orders";
import { hmac, safeEqual } from "@/src/lib/signing";
import { SITE_URL } from "@/src/lib/events";
import { sendOrderStatusEmail } from "@/src/lib/mailer";
import { getMarketingSettings } from "@/src/lib/marketing";
import { ORDER_STEPS, courierTrackingUrl, statusLabel } from "@/src/lib/orderSteps";

export { ORDER_STEPS, courierTrackingUrl, statusLabel, type OrderStatus } from "@/src/lib/orderSteps";

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

export type StatusHistoryEntry = { status: string; at: string; note?: string };

type TrackedRow = {
  orderNumber: string;
  createdAt?: string;
  status?: string | null;
  delivered?: boolean;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  history?: StatusHistoryEntry[] | null;
  items?: StoredOrderItem[] | null;
  isGift?: boolean;
  giftRecipient?: string | null;
  total?: number | null;
};

/** What the customer may see about their order. No address or contact details. */
export async function getTrackedOrder(orderNumber: string): Promise<TrackedOrder | null> {
  const o = unwrap(
    await db()
      .from("orders")
      .select(
        `orderNumber:order_number, createdAt:created_at, status, delivered, courier, trackingNumber:tracking_number,
         trackingUrl:tracking_url, history:status_history, items, isGift:is_gift, giftRecipient:gift_recipient, total:total_amount`
      )
      .eq("order_number_lc", lc(norm(orderNumber)))
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "Order lookup"
  ) as TrackedRow | null;
  if (!o) return null;

  const stored = Array.isArray(o.items) ? o.items : [];
  const products = await productsByIds(stored.map((i) => i.productId || "").filter(Boolean));
  const byId = new Map(products.map((p) => [p._id, p]));
  const status = o.status || (o.delivered ? "delivered" : "received");

  return {
    orderNumber: o.orderNumber,
    createdAt: o.createdAt,
    status,
    courier: o.courier || undefined,
    trackingNumber: o.trackingNumber || undefined,
    trackingUrl: o.trackingUrl || courierTrackingUrl(o.courier || undefined, o.trackingNumber || undefined),
    history: o.history?.length
      ? o.history.map((h) => ({ status: h.status, at: h.at }))
      : [{ status: "received", at: o.createdAt || new Date().toISOString() }],
    items: stored.map((i) => {
      const p = i.productId ? byId.get(i.productId) : undefined;
      return {
        name: i.name,
        size: i.size,
        selectedPrintName: i.selectedPrintName,
        quantity: i.quantity,
        image: p?.images[0],
        slug: p?.slug,
      };
    }),
    isGift: !!o.isGift,
    giftRecipient: o.giftRecipient || undefined,
    total: o.total === null || o.total === undefined ? undefined : Number(o.total),
  };
}

// ---- Status change processor ----
type PendingOrder = {
  _id: string;
  orderNumber: string;
  customerName?: string | null;
  customerEmail?: string | null;
  status: string;
  courier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  statusNote?: string | null;
  isGift?: boolean;
  giftRecipient?: string | null;
  items?: StoredOrderItem[] | null;
  statusHistory?: StatusHistoryEntry[] | null;
};

/**
 * Emails customers about status changes made in the dashboard. Called straight
 * after an order is saved there, and by the daily job as a safety net. Only
 * orders using the status field are touched, so older orders never get
 * surprise emails.
 */
export async function processOrderStatusUpdates(orderId?: string) {
  const stats = { synced: 0, emailed: 0, recorded: 0, failed: 0 };
  const now = () => new Date().toISOString();

  // Keep the "delivered" flag and the status in step
  let deliverQuery = db()
    .from("orders")
    .select("id")
    .not("status", "is", null)
    .eq("delivered", true)
    .not("status", "in", "(delivered,cancelled)");
  if (orderId) deliverQuery = deliverQuery.eq("id", orderId);
  const toDeliver = unwrap(await deliverQuery, "Order sync") as { id: string }[];
  for (const { id } of toDeliver) {
    unwrap(await db().from("orders").update({ status: "delivered" }).eq("id", id), "Order sync");
    stats.synced++;
  }

  let tickQuery = db().from("orders").select("id, delivered_at").eq("status", "delivered").eq("delivered", false);
  if (orderId) tickQuery = tickQuery.eq("id", orderId);
  const toTick = unwrap(await tickQuery, "Order sync") as { id: string; delivered_at: string | null }[];
  for (const row of toTick) {
    unwrap(
      await db().from("orders").update({ delivered: true, delivered_at: row.delivered_at || now() }).eq("id", row.id),
      "Order sync"
    );
    stats.synced++;
  }

  let pendingQuery = db()
    .from("orders")
    .select(
      `_id:id, orderNumber:order_number, customerName:customer_name, customerEmail:customer_email, status, courier,
       trackingNumber:tracking_number, trackingUrl:tracking_url, statusNote:status_note, isGift:is_gift,
       giftRecipient:gift_recipient, items, statusHistory:status_history`
    )
    .eq("status_email_pending", true);
  if (orderId) pendingQuery = pendingQuery.eq("id", orderId);
  const pending = unwrap(await pendingQuery.limit(50), "Pending status emails") as PendingOrder[];
  if (!pending.length) return stats;

  const settings = await getMarketingSettings();
  for (const order of pending) {
    if (settings.shippingEmailsEnabled && order.customerEmail && order.status !== "received") {
      const sent = await sendOrderStatusEmail({
        to: order.customerEmail,
        name: order.customerName || "",
        reference: order.orderNumber,
        status: order.status,
        statusLabel: statusLabel(order.status),
        steps: ORDER_STEPS.map((s) => ({ value: s.value, label: s.label })),
        courier: order.courier || undefined,
        trackingNumber: order.trackingNumber || undefined,
        trackingUrl: order.trackingUrl || courierTrackingUrl(order.courier || undefined, order.trackingNumber || undefined),
        note: order.statusNote || undefined,
        trackUrl: trackUrl(order.orderNumber),
        items: (order.items || []).map((i) => ({ name: i.name, size: i.size, quantity: i.quantity })),
        giftRecipient: order.isGift ? order.giftRecipient || undefined : undefined,
      });
      if (sent) stats.emailed++;
      else {
        stats.failed++;
        continue; // try again on the next run
      }
    }
    // Record the step either way, so it isn't retried forever and the
    // tracking page shows the right timeline
    await recordStatusStep(order._id, order.status, order.statusHistory, order.statusNote || undefined);
    stats.recorded++;
  }
  return stats;
}

/** Marks a status as dealt with and adds it to the order's timeline. */
export async function recordStatusStep(
  orderId: string,
  status: string,
  history: StatusHistoryEntry[] | null | undefined,
  note?: string
) {
  const entry: StatusHistoryEntry = { status, at: new Date().toISOString(), ...(note ? { note } : {}) };
  unwrap(
    await db()
      .from("orders")
      .update({
        status_emailed_for: status,
        status_note: null,
        status_history: [...(Array.isArray(history) ? history : []), entry],
      })
      .eq("id", orderId),
    "Recording the status"
  );
}
