// src/app/actions/terminal.ts
// ─────────────────────────────────────────────────────────────────────────────
// Live multi-courier shipping rates via Terminal Africa (TShip).
//
// Flow (per Terminal docs — the "get rates for shipment" path):
//   1. Create a DELIVERY address from the customer's country/state/city → AD-xxxx
//   2. Create a PARCEL from the cart items                              → parcel_id
//   3. POST /rates/shipment with pickup_address + delivery_address + parcel_id
//      → returns an array of carriers (DHL, UPS, etc.) each with amount +
//        carrier_name + delivery_time.
//   4. Normalise to the shape the checkout already renders.
//
// The pickup (sender) address is created ONCE and its AD-code stored in
// src/config/terminal.ts. Returns { rates: [] } on any failure so the caller
// falls back to the DHL data.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { TERMINAL, terminalConfigured } from "@/src/config/terminal";

export type ComputedRate = {
  id: string;
  service_name: string;
  carrier_name: string;
  delivery_time: string;
  amount: number;         // NGN (or requested currency)
  carrier_logo?: string;
  rate_id?: string;       // Terminal rate_id (for booking later)
};

export type TerminalRatesResult = {
  rates: ComputedRate[];
  requestToken?: string;  // we reuse this slot for a shipment/rate reference
};

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.TERMINAL_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

async function tPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${TERMINAL.BASE}${path}`, {
    method: "POST",
    headers: authHeaders(),
    cache: "no-store",
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Create a delivery address → returns AD-xxxx id, or null. */
async function createDeliveryAddress(input: {
  name: string;
  email: string;
  phone: string;
  line1: string;
  city: string;
  state: string;      // full state name
  countryCode: string; // ISO-2
  postalCode?: string;
}): Promise<string | null> {
  try {
    const data = await tPost("/addresses", {
      first_name: input.name?.split(" ")[0] || "Customer",
      last_name: input.name?.split(" ").slice(1).join(" ") || ".",
      email: input.email || TERMINAL.SENDER_EMAIL,
      phone: input.phone || "",
      line1: input.line1,
      city: input.city,
      state: input.state,
      country: input.countryCode,
      zip: input.postalCode || "",
    });
    if (data?.status && data?.data?.address_id) return data.data.address_id;
    console.error("Terminal createDeliveryAddress failed:", data?.message);
    return null;
  } catch (err) {
    console.error("Terminal createDeliveryAddress error:", err);
    return null;
  }
}

/** Create a parcel from the cart items → returns parcel_id, or null. */
async function createParcel(
  items: { name: string; price: number; quantity: number }[],
): Promise<string | null> {
  try {
    const parcelItems = items.map((it) => ({
      name: it.name,
      description: it.name,
      quantity: it.quantity,
      value: Math.round(it.price),
      weight: TERMINAL.DEFAULT_ITEM_WEIGHT_KG,
      currency: "NGN",
    }));

    const body: Record<string, unknown> = {
      items: parcelItems,
      weight_unit: "kg",
      // total weight (Terminal can also derive from items)
      weight: items.reduce(
        (w, it) => w + it.quantity * TERMINAL.DEFAULT_ITEM_WEIGHT_KG,
        0,
      ),
    };
    if (TERMINAL.PACKAGING_ID) body.packaging = TERMINAL.PACKAGING_ID;

    const data = await tPost("/parcels", body);
    if (data?.status && data?.data?.parcel_id) return data.data.parcel_id;
    console.error("Terminal createParcel failed:", data?.message);
    return null;
  } catch (err) {
    console.error("Terminal createParcel error:", err);
    return null;
  }
}

export async function getTerminalRates(input: {
  receiverName: string;
  receiverEmail: string;
  receiverPhone: string;
  line1: string;
  city: string;
  state: string;
  countryCode: string;
  postalCode?: string;
  items: { name: string; price: number; quantity: number }[];
  currency?: string;
}): Promise<TerminalRatesResult> {
  if (!terminalConfigured() || !input.items?.length) {
    return { rates: [] };
  }

  // 1. delivery address
  const deliveryId = await createDeliveryAddress({
    name: input.receiverName,
    email: input.receiverEmail,
    phone: input.receiverPhone,
    line1: input.line1,
    city: input.city,
    state: input.state,
    countryCode: input.countryCode,
    postalCode: input.postalCode,
  });
  if (!deliveryId) return { rates: [] };

  // 2. parcel
  const parcelId = await createParcel(input.items);
  if (!parcelId) return { rates: [] };

  // 3. rates
  try {
    const data = await tPost("/rates/shipment", {
      pickup_address: TERMINAL.PICKUP_ADDRESS_ID,
      delivery_address: deliveryId,
      parcel_id: parcelId,
      currency: (input.currency || "NGN").toUpperCase(),
    });

    const list = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.data?.rates)
      ? data.data.rates
      : [];

    if (!data?.status || !list.length) {
      console.error("Terminal getRates failed:", data?.message);
      return { rates: [] };
    }

    const rates: ComputedRate[] = list.map((r: any, i: number) => ({
      id: `tm-${r.rate_id || r.id || i}`,
      service_name: r.carrier_name || "Courier",
      carrier_name: r.carrier_name || "",
      delivery_time: r.delivery_time || "",
      amount: Number(r.amount || 0),
      carrier_logo: r.carrier_logo,
      rate_id: r.rate_id || r.id,
    }));

    rates.sort((a, b) => a.amount - b.amount); // cheapest first

    return { rates, requestToken: parcelId };
  } catch (err) {
    console.error("Terminal getTerminalRates error:", err);
    return { rates: [] };
  }
}
