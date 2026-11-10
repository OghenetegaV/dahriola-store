"use server";

// Secure checkout. The browser shows prices, but what is charged and recorded
// is worked out here from Sanity prices, the coupon and a signed shipping quote,
// and every payment is confirmed with Paystack before an order is marked paid.
import { verifyPayment, type PaystackVerification } from "@/src/app/actions/payment";
import { getShippingRates } from "@/src/app/actions/shipping";
import { sendOrderNotification } from "@/src/app/actions/email";
import {
  computeCheckout,
  formatAddress,
  priceItems,
  type CheckoutItemInput,
  type DeliveryAddress,
  type RateInput,
} from "@/src/lib/checkoutPricing";
import { createOrderDoc, findOrderByReference, reducePrintStock } from "@/src/lib/orders";
import { hasUsableAddress, loadListDoc, markItemsPurchased, type ListDoc } from "@/src/lib/sharedLists";
import { sendGiftReceivedEmail } from "@/src/lib/mailer";
import { randomId } from "@/src/lib/signing";

const clean = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

function giftListIdOf(items: CheckoutItemInput[]) {
  return items.map((i) => clean(i.giftListId, 40)).find(Boolean);
}

async function giftDestination(listId: string | undefined, deliverToOwner: boolean | undefined) {
  if (!listId || !deliverToOwner) return null;
  const doc = await loadListDoc(listId);
  if (!doc || doc.active === false || !hasUsableAddress(doc.deliveryAddress)) return null;
  return doc;
}

// ---------------------------------------------------------------------------

/** Summary a gift-buyer needs at checkout. Never includes the address. */
export async function getGiftListSummary(publicId: string) {
  const doc = await loadListDoc(clean(publicId, 20));
  if (!doc || doc.active === false) return null;
  return {
    publicId: doc.publicId,
    ownerFirstName: (doc.ownerName || "Someone").trim().split(/\s+/)[0],
    hasAddress: hasUsableAddress(doc.deliveryAddress),
  };
}

/** Shipping options to the list owner's saved address, quoted without revealing it. */
export async function getGiftShippingRates(publicId: string, items: CheckoutItemInput[]) {
  const doc = await loadListDoc(clean(publicId, 20));
  if (!doc || doc.active === false || !hasUsableAddress(doc.deliveryAddress)) {
    return { rates: [], message: "This list doesn't have a saved delivery address." };
  }
  const priced = await priceItems(items);
  if ("error" in priced) return { rates: [], message: priced.error };

  const a = doc.deliveryAddress!;
  const res = await getShippingRates({
    line1: a.line1,
    city: a.city,
    state: a.state,
    country: a.country,
    postalCode: a.postalCode,
    itemCount: priced.lines.reduce((n, l) => n + l.quantity, 0),
    receiverName: a.name || doc.ownerName,
    receiverEmail: doc.ownerEmail,
    receiverPhone: a.phone,
    items: priced.lines.map((l) => ({ name: l.name, price: l.price, quantity: l.quantity })),
  });
  return { rates: res.rates };
}

type QuoteInput = {
  items: CheckoutItemInput[];
  couponCode?: string;
  email?: string;
  rate: RateInput | null;
  address?: DeliveryAddress | null;
  gift?: { deliverToOwner?: boolean } | null;
};

async function shipToFor(input: QuoteInput) {
  const listId = giftListIdOf(input.items || []);
  const owner = await giftDestination(listId, input.gift?.deliverToOwner);
  if (owner) {
    const a = owner.deliveryAddress!;
    return { shipTo: { country: a.country!, state: a.state!, city: a.city! }, owner };
  }
  const a = input.address;
  return { shipTo: { country: clean(a?.country, 2), state: clean(a?.state, 80), city: clean(a?.city, 80) }, owner: null };
}

/** Called just before payment: the amount Paystack will charge. */
export async function quoteCheckout(input: QuoteInput) {
  try {
    const { shipTo } = await shipToFor(input);
    const c = await computeCheckout({ ...input, shipTo }, { strictRate: true });
    if ("error" in c) return { success: false as const, message: c.error };
    return {
      success: true as const,
      subtotal: c.subtotal,
      discount: c.discount,
      couponError: c.couponError,
      shipping: c.shipping,
      total: c.total,
      totalKobo: c.totalKobo,
      reference: `dahriola-${Date.now()}-${randomId(5)}`,
    };
  } catch (err) {
    console.error("quoteCheckout failed:", err);
    return { success: false as const, message: "We couldn't prepare your payment. Please try again." };
  }
}

type CompleteInput = QuoteInput & {
  reference: string;
  customer: { name: string; email: string; phone: string };
  giftMessage?: string;
  emailOptIn?: boolean;
  textOptIn?: boolean;
  displayCurrency?: string;
  displayTotal?: number;
};

async function verifyWithRetry(reference: string): Promise<PaystackVerification> {
  let last: PaystackVerification = { success: false, reachable: false };
  for (let i = 0; i < 3; i++) {
    last = await verifyPayment(reference);
    // Definite answers: paid, failed/abandoned, or "reference not found"
    if (last.success || (last.reachable && last.status !== "pending" && last.status !== "ongoing")) return last;
    await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
  }
  return last;
}

const naira = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

/** Called after Paystack reports success: confirm, record, notify. */
export async function completeCheckout(input: CompleteInput) {
  const reference = clean(input.reference, 100);
  if (!/^dahriola-[\w-]+$/.test(reference)) return { success: false as const, message: "Invalid payment reference." };

  try {
    // Already recorded (e.g. the page was refreshed)? Don't create it twice.
    const existing = await findOrderByReference(reference);
    if (existing) return { success: true as const, orderNumber: reference, verified: !!existing.paymentVerified };

    const pay = await verifyWithRetry(reference);
    const paystackUnreachable = !pay.success && !pay.reachable;
    // A reference Paystack has never seen means nothing was paid — don't record it.
    if (!pay.success && !paystackUnreachable) {
      return {
        success: false as const,
        message: `Paystack hasn't confirmed this payment (${pay.status || pay.message || "unknown"}). If you were charged, contact us with reference ${reference}.`,
      };
    }

    const { shipTo, owner } = await shipToFor(input);
    const c = await computeCheckout({ ...input, shipTo }, { strictRate: false });

    const customer = {
      name: clean(input.customer?.name, 100),
      email: clean(input.customer?.email, 120).toLowerCase(),
      phone: clean(input.customer?.phone, 40),
    };

    const listId = giftListIdOf(input.items || []);
    const listDoc: ListDoc | null = owner || (listId ? await loadListDoc(listId) : null);
    const deliverToOwner = !!owner;
    const ownerAddr = owner?.deliveryAddress;
    const shippingAddress = deliverToOwner
      ? formatAddress({ ...ownerAddr, name: ownerAddr?.name || owner?.ownerName } as never)
      : formatAddress({ ...(input.address || {}), name: customer.name, phone: customer.phone } as never);

    if ("error" in c) {
      // Money has moved but we couldn't price the order (e.g. a product was
      // deleted mid-checkout). Record it for manual review rather than lose it.
      await createOrderDoc({
        orderNumber: reference,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress,
        subtotal: 0,
        shippingFee: 0,
        totalAmount: (pay.amountKobo || 0) / 100,
        amountPaid: (pay.amountKobo || 0) / 100,
        paymentReference: reference,
        paymentVerified: false,
        verificationNote: `Needs review: ${c.error}`,
        items: (input.items || []).map((i) => ({
          _id: clean(i._id, 100),
          name: clean(i.name, 100) || "Item",
          price: 0,
          quantity: Math.max(1, Number(i.quantity) || 1),
          size: clean(i.size, 20),
        })),
      });
      return { success: true as const, orderNumber: reference, verified: false };
    }

    const paidNaira = (pay.amountKobo || 0) / 100;
    let verified = false;
    let note = "";
    if (paystackUnreachable) note = "Paystack couldn't be reached to confirm this payment — check the Paystack dashboard.";
    else if (pay.currency !== "NGN") note = `Paid in ${pay.currency}, expected NGN.`;
    else if ((pay.amountKobo || 0) < c.totalKobo - 100) note = `Paid ${naira(paidNaira)} but the order total is ${naira(c.total)}.`;
    else verified = true;

    const gift = listDoc
      ? {
          listId: listDoc.publicId,
          ownerName: listDoc.ownerName || "",
          deliverToOwner,
          message: clean(input.giftMessage, 500) || undefined,
        }
      : undefined;

    await createOrderDoc({
      orderNumber: reference,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress,
      shippingMethod: c.shippingMethod,
      subtotal: c.subtotal,
      shippingFee: c.shipping,
      discountCode: c.discount > 0 ? c.couponCode : undefined,
      discountAmount: c.discount,
      totalAmount: c.total,
      amountPaid: paystackUnreachable ? undefined : paidNaira,
      paymentReference: reference,
      paymentVerified: verified,
      verificationNote: note,
      displayCurrency: clean(input.displayCurrency, 3).toUpperCase(),
      displayTotal: Number(input.displayTotal) || undefined,
      emailOptIn: input.emailOptIn,
      textOptIn: input.textOptIn,
      items: c.lines,
      gift,
    });

    await reducePrintStock(c.lines);

    try {
      await sendOrderNotification({
        orderNumber: reference,
        customerName: gift ? `${customer.name} (gift for ${gift.ownerName})` : customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: gift
          ? `${shippingAddress}${deliverToOwner ? " [recipient's saved address]" : ""}${gift.message ? ` — Gift message: "${gift.message}"` : ""}`
          : shippingAddress,
        items: c.lines,
        subtotal: c.subtotal,
        shippingFee: c.shipping,
        shippingMethod: c.shippingMethod,
        totalAmount: c.total,
        currency: "NGN",
        paymentReference: reference,
        paymentVerified: verified,
        emailOptIn: input.emailOptIn,
        textOptIn: input.textOptIn,
        orderDate: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Order email failed:", err);
    }

    if (listDoc) {
      const giftKeys = c.lines.filter((l) => l.giftListId === listDoc.publicId).map((l) => l.giftItemKey || "");
      try {
        await markItemsPurchased(listDoc, giftKeys, customer.name, reference);
      } catch (err) {
        console.error("Marking gift items failed:", err);
      }
      if (listDoc.ownerEmail) {
        await sendGiftReceivedEmail({
          to: listDoc.ownerEmail,
          ownerName: listDoc.ownerName || "",
          buyerName: customer.name,
          keepSurprise: listDoc.keepSurprise !== false,
          itemNames: c.lines.filter((l) => l.giftListId === listDoc.publicId).map((l) => l.name),
          giftMessage: gift?.message,
          deliverToOwner,
        });
      }
    }

    return { success: true as const, orderNumber: reference, verified };
  } catch (err) {
    console.error("completeCheckout failed:", err);
    return {
      success: false as const,
      message: `Your payment went through but we hit a snag saving your order. Please contact us with reference ${reference} and we'll sort it out right away.`,
    };
  }
}
