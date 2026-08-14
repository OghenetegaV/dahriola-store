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

async function tGet(path: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${TERMINAL.BASE}${path}?${qs}`, {
    method: "GET",
    headers: authHeaders(),
    cache: "no-store",
  });
  return res.json();
}

// Normalise a phone number to international format for Terminal.
// Nigerian numbers: 0803... → +234803..., 803... → +234803...
// Anything already starting with + is left as-is.
function toInternationalPhone(phone: string, countryCode: string): string {
  const raw = (phone || "").replace(/[\s()-]/g, "");
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  if (raw.startsWith("00")) return "+" + raw.slice(2);

  // Country dialing codes for the ones most relevant here.
  const dial: Record<string, string> = {
    NG: "234", US: "1", CA: "1", GB: "44", NO: "47",
    GH: "233", KE: "254", ZA: "27", FR: "33", DE: "49",
    IE: "353", NL: "31", AE: "971",
  };
  const code = dial[countryCode] || "234"; // default NG

  let local = raw;
  if (local.startsWith("0")) local = local.slice(1); // strip trunk 0
  // If it already begins with the country code digits, don't double it.
  if (local.startsWith(code)) return "+" + local;
  return "+" + code + local;
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
      phone: toInternationalPhone(input.phone, input.countryCode) || "",
      line1: (input.line1 || "").slice(0, 45),
      line2: (input.line1 || "").length > 45 ? (input.line1 || "").slice(45, 90) : "",
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
      name: it.name || "Clothing item",
      description: it.name || "Fashion / clothing item",
      quantity: it.quantity,
      value: Math.round(it.price),
      weight: TERMINAL.DEFAULT_ITEM_WEIGHT_KG,
      currency: "NGN",
    }));

    // A readable parcel-level description (Terminal requires this on the parcel).
    const parcelDescription =
      items.length === 1
        ? items[0].name || "Fashion / clothing order"
        : `Dahriola order — ${items.length} items`;

    const body: Record<string, unknown> = {
      description: parcelDescription,   // REQUIRED by Terminal
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
    const data = await tGet("/rates/shipment", {
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
