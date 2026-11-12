// Server-only order helpers. These used to be public server actions, which let
// anyone create orders or change stock directly. They are now only reachable
// through completeCheckout (src/app/actions/checkout.ts), after the payment has
// been checked with Paystack.
import { writeClient } from "@/src/lib/sanityWrite";
import { sendLowStockNotification } from "@/src/app/actions/email";

export type OrderLine = {
  _id: string;
  name: string;
  price: number; // NGN unit price from Sanity
  quantity: number;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  giftItemKey?: string;
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
  return writeClient.fetch<{ _id: string; paymentVerified?: boolean } | null>(
    `*[_type == "order" && paymentReference == $reference][0]{ _id, paymentVerified }`,
    { reference }
  );
}

export async function createOrderDoc(input: OrderDocInput) {
  return writeClient.create({
    _type: "order",
    orderNumber: input.orderNumber,
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone || "",
    shippingAddress: input.shippingAddress,
    shippingMethod: input.shippingMethod || "",
    currency: "NGN",
    subtotal: input.subtotal,
    shippingFee: input.shippingFee,
    discountCode: input.discountCode || "",
    discountAmount: input.discountAmount && input.discountAmount > 0 ? input.discountAmount : undefined,
    totalAmount: input.totalAmount,
    amountPaid: input.amountPaid,
    displayCurrency: input.displayCurrency && input.displayCurrency !== "NGN" ? input.displayCurrency : undefined,
    displayTotal: input.displayCurrency && input.displayCurrency !== "NGN" ? input.displayTotal : undefined,
    paymentReference: input.paymentReference,
    paymentVerified: input.paymentVerified,
    verificationNote: input.verificationNote || undefined,
    emailOptIn: !!input.emailOptIn,
    textOptIn: !!input.textOptIn,
    delivered: false,
    status: "received",
    statusEmailedFor: "received",
    statusHistory: [{ _key: "received", status: "received", at: new Date().toISOString() }],
    isGift: !!input.gift,
    giftListId: input.gift?.listId,
    giftRecipient: input.gift?.ownerName,
    giftDeliverToOwner: input.gift ? input.gift.deliverToOwner : undefined,
    giftMessage: input.gift?.message || undefined,
    items: input.items.map((item, i) => ({
      _key: `${i}-${item._id}`.slice(0, 60),
      name: item.name,
      product: item._id ? { _type: "reference", _ref: item._id, _weak: true } : undefined,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      selectedPrintName: item.selectedPrintName || "",
      heightLength: item.heightLength || "",
      gender: item.gender || "",
      notes: item.notes || "",
    })),
    createdAt: new Date().toISOString(),
  });
}

/** Counts a coupon use once a paid order has been recorded. */
export async function recordCouponUse(code?: string) {
  if (!code) return;
  try {
    const id = await writeClient.fetch<string | null>(`*[_type == "coupon" && code == $code][0]._id`, { code });
    if (id) await writeClient.patch(id).setIfMissing({ timesUsed: 0 }).inc({ timesUsed: 1 }).commit();
  } catch (err) {
    console.error("Coupon usage count failed:", err);
  }
}

type PrintStock = { _id: string; name: string; stockQuantity?: number; lowStockThreshold?: number };

export async function reducePrintStock(lines: OrderLine[]) {
  for (const item of lines) {
    if (!item.selectedPrintId) continue;
    try {
      const print = await writeClient.fetch<PrintStock | null>(
        `*[_type == "print" && _id == $id][0]{ _id, name, stockQuantity, lowStockThreshold }`,
        { id: item.selectedPrintId }
      );
      if (!print) continue;

      const threshold = Number(print.lowStockThreshold ?? 2);
      // dec() is atomic, so two orders at once can't overwrite each other
      const updated = await writeClient
        .patch(print._id)
        .setIfMissing({ stockQuantity: 0 })
        .dec({ stockQuantity: Math.max(1, Number(item.quantity || 1)) })
        .commit<{ stockQuantity?: number }>();

      let remaining = Number(updated.stockQuantity ?? 0);
      if (remaining < 0) {
        await writeClient.patch(print._id).set({ stockQuantity: 0 }).commit();
        remaining = 0;
      }
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
