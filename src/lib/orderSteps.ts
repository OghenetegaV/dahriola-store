// Order status steps. Safe to import from server and client code.

export const ORDER_STEPS = [
  { value: "received", label: "Order received", blurb: "We've received your order and payment." },
  { value: "in_production", label: "In production", blurb: "Your pieces are being made by our team." },
  { value: "ready", label: "Ready to ship", blurb: "Finished, checked and carefully packed." },
  { value: "shipped", label: "Shipped", blurb: "On its way with the courier." },
  { value: "out_for_delivery", label: "Out for delivery", blurb: "Arriving soon." },
  { value: "delivered", label: "Delivered", blurb: "Enjoy your DAHRIOLA pieces!" },
] as const;

export type OrderStatus = (typeof ORDER_STEPS)[number]["value"] | "cancelled";

export const ORDER_STATUS_VALUES: OrderStatus[] = [...ORDER_STEPS.map((s) => s.value), "cancelled"];

export function statusLabel(status?: string | null) {
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
