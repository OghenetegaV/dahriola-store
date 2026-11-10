// Server-only: works out what an order costs from Sanity prices, the coupon and
// a signed shipping quote. The browser's own numbers are only for display.
import { writeClient } from "@/src/lib/sanityWrite";
import { validateCoupon } from "@/src/app/actions/coupon";
import { addressKey, verifyRate } from "@/src/lib/signing";
import type { OrderLine } from "@/src/lib/orders";

export type CheckoutItemInput = {
  _id: string;
  name?: string; // display only, never trusted for price
  quantity: number;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
  giftListId?: string;
  giftItemKey?: string;
};

export type RateInput = {
  id: string;
  amount: number;
  exp: number;
  sig: string;
  service_name?: string;
  carrier_name?: string;
  delivery_time?: string;
};

export type DeliveryAddress = {
  line1: string;
  apartment?: string;
  city: string;
  state: string;
  country: string; // ISO-2
  postalCode?: string;
};

const clean = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);

export function formatAddress(a: Partial<DeliveryAddress> & { name?: string; phone?: string }) {
  return [a.name, a.line1, a.apartment, a.city, a.state, a.postalCode, a.country, a.phone && `Tel: ${a.phone}`]
    .map((v) => clean(v, 200))
    .filter(Boolean)
    .join(", ");
}

export function rateAddressKey(a: Pick<DeliveryAddress, "country" | "state" | "city">) {
  return addressKey(clean(a.country).toUpperCase(), a.state, a.city);
}

type ProductRow = { _id: string; name: string; priceNGN?: number; prints?: { _id: string; name: string }[] | null };

export async function priceItems(items: CheckoutItemInput[]) {
  if (!Array.isArray(items) || items.length === 0) return { error: "Your cart is empty." } as const;
  if (items.length > 60) return { error: "Too many items in one order." } as const;

  const ids = [...new Set(items.map((i) => clean(i._id, 100)))];
  const products = await writeClient.fetch<ProductRow[]>(
    `*[_type == "product" && _id in $ids]{ _id, name, priceNGN, "prints": prints[]->{ _id, name } }`,
    { ids }
  );
  const byId = new Map(products.map((p) => [p._id, p]));

  const lines: (OrderLine & { giftListId?: string })[] = [];
  for (const it of items) {
    const p = byId.get(clean(it._id, 100));
    if (!p || typeof p.priceNGN !== "number") {
      return { error: `"${clean(it.name, 80) || "An item"}" is no longer available. Please remove it from your cart.` } as const;
    }
    const print = it.selectedPrintId ? p.prints?.find((x) => x?._id === it.selectedPrintId) : undefined;
    lines.push({
      _id: p._id,
      name: p.name,
      price: p.priceNGN,
      quantity: Math.min(20, Math.max(1, Math.floor(Number(it.quantity) || 1))),
      size: clean(it.size, 20) || undefined,
      selectedPrintId: print?._id,
      selectedPrintName: print?.name || clean(it.selectedPrintName, 80) || undefined,
      heightLength: clean(it.heightLength, 80) || undefined,
      gender: clean(it.gender, 40) || undefined,
      notes: clean(it.notes, 500) || undefined,
      giftListId: clean(it.giftListId, 40) || undefined,
      giftItemKey: clean(it.giftItemKey, 40) || undefined,
    });
  }
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return { lines, subtotal } as const;
}

export async function couponDiscount(code: string | undefined, email: string | undefined, subtotal: number) {
  const normalized = clean(code, 40).toUpperCase();
  if (!normalized) return { discount: 0 };
  const result = await validateCoupon(normalized, email);
  if (!result.success) return { discount: 0, couponError: result.message || "Invalid code." };
  const value = Number(result.discountValue) || 0;
  const discount =
    result.discountType === "percentage"
      ? Math.round(subtotal * (Math.min(100, value) / 100) * 100) / 100
      : Math.min(value, subtotal);
  return { discount, couponCode: normalized };
}

/**
 * The single source of truth for an order's total.
 * `strictRate` rejects expired shipping quotes (used before payment); after
 * payment an expired-but-genuine quote is still accepted.
 */
export async function computeCheckout(
  input: { items: CheckoutItemInput[]; couponCode?: string; email?: string; rate: RateInput | null; shipTo: Pick<DeliveryAddress, "country" | "state" | "city"> },
  opts: { strictRate: boolean }
) {
  const priced = await priceItems(input.items);
  if ("error" in priced) return { error: priced.error } as const;

  const rate = input.rate;
  const check = verifyRate(rate, rateAddressKey(input.shipTo));
  if (!rate || !check.signatureOk) {
    return { error: "Please get shipping options again for this address." } as const;
  }
  if (opts.strictRate && check.expired) {
    return { error: "Your shipping quote has expired. Please get shipping options again." } as const;
  }

  const { discount, couponCode, couponError } = await couponDiscount(input.couponCode, input.email, priced.subtotal);
  const shipping = Number(rate.amount) || 0;
  const total = Math.max(0, Math.round((priced.subtotal - discount + shipping) * 100) / 100);

  return {
    lines: priced.lines,
    subtotal: priced.subtotal,
    discount,
    couponCode,
    couponError,
    shipping,
    shippingMethod: [rate.service_name || rate.carrier_name, rate.delivery_time].filter(Boolean).join(" — "),
    total,
    totalKobo: Math.round(total * 100),
  } as const;
}
