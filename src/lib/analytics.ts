// Google Analytics 4 helpers. Every call is a no-op until NEXT_PUBLIC_GA_ID is set
// and the gtag script has loaded, so tracking can never break the site.
// Event names/params follow GA4's recommended e-commerce schema.

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

type GtagParams = Record<string, unknown>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(name: string, params: GtagParams = {}) {
  if (!GA_ID || typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {}
}

export type AnalyticsItem = {
  _id: string;
  name: string;
  price?: number;
  quantity?: number;
  size?: string;
  selectedPrintName?: string;
  category?: string;
};

export function toGaItem(item: AnalyticsItem, index?: number) {
  return {
    item_id: item._id,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity ?? 1,
    item_variant: [item.size, item.selectedPrintName].filter(Boolean).join(" / ") || undefined,
    item_category: item.category,
    index,
  };
}

function itemsValue(items: AnalyticsItem[]) {
  return items.reduce((sum, i) => sum + (i.price || 0) * (i.quantity ?? 1), 0);
}

// ── Shopping ──

export function trackViewItem(item: AnalyticsItem, currency = "NGN") {
  trackEvent("view_item", { currency, value: item.price, items: [toGaItem(item)] });
}

export function trackAddToCart(item: AnalyticsItem, currency = "NGN") {
  trackEvent("add_to_cart", { currency, value: itemsValue([item]), items: [toGaItem(item)] });
}

export function trackRemoveFromCart(item: AnalyticsItem, currency = "NGN") {
  trackEvent("remove_from_cart", { currency, value: itemsValue([item]), items: [toGaItem(item)] });
}

export function trackViewCart(items: AnalyticsItem[], currency = "NGN") {
  trackEvent("view_cart", { currency, value: itemsValue(items), items: items.map(toGaItem) });
}

export function trackAddToWishlist(item: AnalyticsItem, currency = "NGN") {
  trackEvent("add_to_wishlist", { currency, value: item.price, items: [toGaItem(item)] });
}

type CheckoutParams = {
  items: AnalyticsItem[];
  currency: string;
  value: number;
  coupon?: string;
};

export function trackBeginCheckout(p: CheckoutParams) {
  trackEvent("begin_checkout", { currency: p.currency, value: p.value, coupon: p.coupon, items: p.items.map(toGaItem) });
}

export function trackAddShippingInfo(p: CheckoutParams & { shippingTier?: string }) {
  trackEvent("add_shipping_info", {
    currency: p.currency, value: p.value, coupon: p.coupon, shipping_tier: p.shippingTier, items: p.items.map(toGaItem),
  });
}

export function trackAddPaymentInfo(p: CheckoutParams) {
  trackEvent("add_payment_info", {
    currency: p.currency, value: p.value, coupon: p.coupon, payment_type: "Paystack", items: p.items.map(toGaItem),
  });
}

export function trackPurchase(p: CheckoutParams & { transactionId: string; shipping?: number; discount?: number }) {
  trackEvent("purchase", {
    transaction_id: p.transactionId,
    currency: p.currency,
    value: p.value,
    shipping: p.shipping,
    discount: p.discount,
    coupon: p.coupon,
    items: p.items.map(toGaItem),
  });
}

export function trackSearch(term: string) {
  if (term.trim()) trackEvent("search", { search_term: term.trim() });
}

// ── Leads & marketing ──

export function trackNewsletterSignUp(source?: string) {
  trackEvent("sign_up", { method: "newsletter_popup", source });
}

export function trackRsvp(eventTitle: string, guests: number) {
  trackEvent("generate_lead", { lead_source: "event_rsvp", event_title: eventTitle, guests });
}

export function trackBespokeEnquiry() {
  trackEvent("generate_lead", { lead_source: "bespoke_enquiry" });
}

export function trackViewPromotion(id: string, name: string) {
  trackEvent("view_promotion", { promotion_id: id, promotion_name: name, creative_slot: "event_popup" });
}

export function trackSelectPromotion(id: string, name: string) {
  trackEvent("select_promotion", { promotion_id: id, promotion_name: name, creative_slot: "event_popup" });
}
