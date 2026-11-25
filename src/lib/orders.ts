// Server-only order helpers. These used to be public server actions, which let
// anyone create orders or change stock directly. They are now only reachable
// through completeCheckout (src/app/actions/checkout.ts), after the payment has
// been checked with Paystack.
import "server-only";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { sendLowStockNotification } from "@/src/app/actions/email";

export type OrderLine = {
  _id: string;
  name: string;
  price: number; // NGN unit price from the database
  quantity: number;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  giftItemKey?: string;
};

/** One line of an order as stored in orders.items */
export type StoredOrderItem = {
  productId?: string;
  name: string;
  price?: number;
  quantity?: number;
  size?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
};

export type OrderDocInput = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingMethod?: string;
  subtotal: number;
  shippingFee: number;
  discountCode?: string;
  discountAmount?: number;
  totalAmount: number;
  amountPaid?: number;
  paymentReference: string;
  paymentVerified: boolean;
  verificationNote?: string;
  displayCurrency?: string;
  displayTotal?: number;
  emailOptIn?: boolean;
  textOptIn?: boolean;
  items: OrderLine[];
  gift?: {
    listId: string;
    ownerName: string;
    deliverToOwner: boolean;
    message?: string;
  };
};

export async function findOrderByReference(reference: string) {
  return unwrap(
    await db()
      .from("orders")
      .select("_id:id, paymentVerified:payment_verified")
      .eq("payment_reference", reference)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "Order lookup"
  ) as { _id: string; paymentVerified?: boolean } | null;
}

export async function createOrderDoc(input: OrderDocInput) {
  const now = new Date().toISOString();
  const foreign = !!input.displayCurrency && input.displayCurrency !== "NGN";
  const items: StoredOrderItem[] = input.items.map((item) => ({
    productId: item._id || undefined,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size,
    selectedPrintName: item.selectedPrintName || "",
    heightLength: item.heightLength || "",
    gender: item.gender || "",
    notes: item.notes || "",
  }));

  return unwrap(
    await db()
      .from("orders")
      .insert({
        order_number: input.orderNumber,
        customer_name: input.customerName,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone || "",
        shipping_address: input.shippingAddress,
        shipping_method: input.shippingMethod || "",
        currency: "NGN",
        subtotal: input.subtotal,
        shipping_fee: input.shippingFee,
        discount_code: input.discountCode || "",
        discount_amount: input.discountAmount && input.discountAmount > 0 ? input.discountAmount : null,
        total_amount: input.totalAmount,
        amount_paid: input.amountPaid ?? null,
        display_currency: foreign ? input.displayCurrency : null,
        display_total: foreign ? input.displayTotal ?? null : null,
        payment_reference: input.paymentReference,
        payment_verified: input.paymentVerified,
        verification_note: input.verificationNote || null,
        email_opt_in: !!input.emailOptIn,
        text_opt_in: !!input.textOptIn,
        delivered: false,
        status: "received",
        status_emailed_for: "received",
        status_history: [{ status: "received", at: now }],
        is_gift: !!input.gift,
        gift_list_id: input.gift?.listId ?? null,
        gift_recipient: input.gift?.ownerName ?? null,
        gift_deliver_to_owner: input.gift ? input.gift.deliverToOwner : null,
        gift_message: input.gift?.message || null,
        items,
        created_at: now,
      })
      .select("_id:id")
      .single(),
    "Saving the order"
  ) as { _id: string };
}

/** Counts a coupon use once a paid order has been recorded. */
export async function recordCouponUse(code?: string) {
  if (!code) return;
  try {
    unwrap(await db().rpc("record_coupon_use", { p_code: code }), "Coupon usage count");
  } catch (err) {
    console.error("Coupon usage count failed:", err);
  }
}

type PrintStock = { name: string; stock_quantity: number; low_stock_threshold: number };

export async function reducePrintStock(lines: OrderLine[]) {
  for (const item of lines) {
    if (!item.selectedPrintId) continue;
    try {
      // Done inside the database, so two orders at once can't overwrite each other
      const rows = unwrap(
        await db().rpc("decrement_print_stock", {
          p_print_id: item.selectedPrintId,
          p_quantity: Math.max(1, Number(item.quantity || 1)),
        }),
        "Stock update"
      ) as PrintStock[] | null;
      const print = rows?.[0];
      if (!print) continue;

      const threshold = Number(print.low_stock_threshold ?? 2);
      const remaining = Number(print.stock_quantity ?? 0);
      if (remaining <= threshold) {
        await sendLowStockNotification({
          printName: print.name || item.selectedPrintName || "Unknown print",
          remainingStock: remaining,
          threshold,
        });
      }
    } catch (err) {
      console.error("Stock reduction failed for", item.selectedPrintId, err);
    }
  }
}
