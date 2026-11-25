// Server-only reads for the dashboard. Rows come back with the database's own
// column names (snake_case).
import "server-only";
import { COUNT, countRows, db, unwrap } from "@/src/lib/supabase/admin";
import type { StoredOrderItem } from "@/src/lib/orders";
import type { StatusHistoryEntry } from "@/src/lib/orderStatus";

export const PAGE_SIZE = 25;

/** Orders that still need the team to do something. */
export const OPEN_STATUSES = ["received", "in_production", "ready"];

export type OrderRow = {
  id: string;
  order_number: string;
  status: string | null;
  courier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status_note: string | null;
  status_emailed_for: string | null;
  status_history: StatusHistoryEntry[] | null;
  delivered: boolean;
  delivered_at: string | null;
  review_request_sent_at: string | null;
  receipt_sent_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
  shipping_method: string | null;
  items: StoredOrderItem[] | null;
  currency: string | null;
  subtotal: number | null;
  shipping_fee: number | null;
  discount_code: string | null;
  discount_amount: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  display_currency: string | null;
  display_total: number | null;
  payment_reference: string | null;
  payment_verified: boolean;
  verification_note: string | null;
  is_gift: boolean;
  gift_recipient: string | null;
  gift_deliver_to_owner: boolean | null;
  gift_message: string | null;
  gift_list_id: string | null;
  email_opt_in: boolean;
  text_opt_in: boolean;
  internal_note: string | null;
  created_at: string;
};

/** The status to show for an order, including ones from before status tracking. */
export function effectiveStatus(o: Pick<OrderRow, "status" | "delivered">) {
  return o.status || (o.delivered ? "delivered" : "received");
}

export type PrintRow = {
  id: string;
  name: string;
  image_url: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};

export async function listPrints(): Promise<PrintRow[]> {
  return unwrap(
    await db().from("prints").select("id, name, image_url, stock_quantity, low_stock_threshold, is_active").order("name"),
    "Loading prints"
  ) as PrintRow[];
}

export const isLowStock = (p: PrintRow) => p.is_active && p.stock_quantity <= p.low_stock_threshold;

/** Little numbers shown next to the menu items. */
export async function getNavCounts() {
  try {
    const [orders, reviews, prints] = await Promise.all([
      countRows(db().from("orders").select("*", COUNT).in("status", OPEN_STATUSES)),
      countRows(db().from("reviews").select("*", COUNT).eq("approved", false)),
      listPrints(),
    ]);
    return { orders, reviews, lowStock: prints.filter(isLowStock).length };
  } catch (err) {
    console.error("Dashboard counts failed:", err);
    return {};
  }
}

/** Removes characters that have a special meaning in a PostgREST or() filter. */
export function searchTerm(q?: string) {
  return String(q || "")
    .replace(/[,()%*\\"]/g, " ")
    .trim()
    .slice(0, 80);
}

export function pageNumber(value?: string) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 1;
}
