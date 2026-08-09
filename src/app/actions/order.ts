// src/app/actions/order.ts
// Creates the order document in Sanity FROM THE SERVER using a write token.
// Now also records marketing consent (emailOptIn / textOptIn) so the client can
// see who agreed to receive news and offers.

"use server";

import { createClient } from "@sanity/client";

const writeClient = createClient({
  projectId:
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
    process.env.SANITY_PROJECT_ID!,
  dataset:
    process.env.NEXT_PUBLIC_SANITY_DATASET ??
    process.env.SANITY_DATASET ??
    "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN, // server-only
  useCdn: false,
});

type OrderItemInput = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
};

type CreateOrderInput = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingMethod?: string;
  currency: string;
  subtotal?: number;
  shippingFee?: number;
  discountCode?: string;
  discountAmount?: number;
  totalAmount: number;
  paymentReference?: string;
  paymentVerified: boolean;
  emailOptIn?: boolean;   // marketing consent — email
  textOptIn?: boolean;    // marketing consent — SMS/text
  items: OrderItemInput[];
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ success: boolean; id?: string; message?: string }> {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error("createOrder: SANITY_API_WRITE_TOKEN is not set");
    return { success: false, message: "Server missing Sanity write token" };
  }

  try {
    const doc = await writeClient.create({
      _type: "order",
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone || "",
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod || "",
      currency: input.currency,
      subtotal: typeof input.subtotal === "number" ? input.subtotal : undefined,
      shippingFee: typeof input.shippingFee === "number" ? input.shippingFee : undefined,
      discountCode: input.discountCode || "",
      discountAmount:
        typeof input.discountAmount === "number" && input.discountAmount > 0
          ? input.discountAmount
          : undefined,
      totalAmount: input.totalAmount,
      paymentReference: input.paymentReference || input.orderNumber,
      paymentVerified: input.paymentVerified,
      emailOptIn: !!input.emailOptIn,
      textOptIn: !!input.textOptIn,
      delivered: false,
      items: input.items.map((item) => ({
        _key: `${item._id}-${item.size ?? ""}-${item.selectedPrintId || "default"}`,
        name: item.name,
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

    return { success: true, id: doc._id };
  } catch (err) {
    console.error("createOrder: Sanity write failed:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Sanity write failed",
    };
  }
}
