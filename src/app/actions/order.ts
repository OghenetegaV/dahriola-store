// src/app/actions/order.ts
// ─────────────────────────────────────────────────────────────────────────────
// Creates the order document in Sanity FROM THE SERVER using a write token.
//
// Why this is needed: CheckoutClient runs in the browser, where the Sanity
// client (src/lib/sanity) has no write token — so client.create() is silently
// rejected and orders never appear in the Studio. This server action holds the
// token safely and performs the write. Fields match src/sanity/schemaTypes/order.ts
// exactly (name/price/quantity/size/selectedPrintName/notes + delivered + paymentVerified).
//
// SETUP (one-time):
//   1. sanity.io/manage → your project → API → Tokens → Add API token →
//      permission: Editor (or Write). Copy it.
//   2. Add SANITY_API_WRITE_TOKEN=<token> to .env.local AND Vercel (Production).
//   3. Confirm the projectId/dataset env names below match what src/lib/sanity uses.
//   4. Redeploy.
//
// If @sanity/client isn't found at build, change the import to:
//   import { createClient } from "next-sanity";
// ─────────────────────────────────────────────────────────────────────────────

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
  token: process.env.SANITY_API_WRITE_TOKEN, // server-only — never exposed to the browser
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
  notes?: string;
};

type CreateOrderInput = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  currency: string;
  totalAmount: number;
  paymentVerified: boolean;
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
      shippingAddress: input.shippingAddress,
      currency: input.currency,
      totalAmount: input.totalAmount,
      paymentVerified: input.paymentVerified,
      delivered: false,
      items: input.items.map((item) => ({
        _key: `${item._id}-${item.size ?? ""}-${item.selectedPrintId || "default"}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        selectedPrintName: item.selectedPrintName || "",
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
