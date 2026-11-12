"use server";

import { writeClient } from "@/src/lib/sanityWrite";
import { priceItems, type CheckoutItemInput } from "@/src/lib/checkoutPricing";
import { cartDocId, verifyRestoreToken, type SavedCartItem } from "@/src/lib/abandonedCarts";
import { normEmail } from "@/src/lib/marketing";
import { randomId } from "@/src/lib/signing";
import { urlFor } from "@/src/lib/sanity";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Saves the checkout once an email is entered, for one reminder if they don't pay. */
export async function saveCheckoutProgress(input: { email: string; name?: string; items: CheckoutItemInput[] }) {
  try {
    const email = normEmail(input.email);
    if (!EMAIL_RE.test(email) || !Array.isArray(input.items) || !input.items.length) return { ok: false };

    const priced = await priceItems(input.items.slice(0, 30));
    if ("error" in priced) return { ok: false };

    const _id = cartDocId(email);
    const now = new Date().toISOString();
    const items: SavedCartItem[] = priced.lines.map((l) => ({
      _key: randomId(8),
      productId: l._id,
      name: l.name,
      quantity: l.quantity,
      size: l.size,
      selectedPrintId: l.selectedPrintId,
      selectedPrintName: l.selectedPrintName,
      heightLength: l.heightLength,
      gender: l.gender,
      notes: l.notes,
    }));

    const existing = await writeClient.fetch<{ reminderSentAt?: string; recoveredAt?: string } | null>(
      `*[_id == $id][0]{ reminderSentAt, recoveredAt }`,
      { id: _id }
    );
    await writeClient.createIfNotExists({ _id, _type: "abandonedCart", email, createdAt: now });

    let patch = writeClient.patch(_id).set({
      email,
      name: String(input.name || "").trim().slice(0, 100),
      items,
      subtotal: priced.subtotal,
      updatedAt: now,
    });
    // A new shopping session after an old reminder or a finished order starts fresh
    if (existing?.recoveredAt || existing?.reminderSentAt) {
      patch = patch.unset(["reminderSentAt", "recoveredAt"]).set({ createdAt: now });
    }
    await patch.commit();
    return { ok: true };
  } catch (err) {
    console.error("saveCheckoutProgress failed:", err);
    return { ok: false };
  }
}

/** The "Complete my order" link from the reminder email → the saved bag. */
export async function restoreCheckout(id: string, token: string) {
  const docId = String(id || "");
  if (!/^abandonedCart-[a-f0-9]{24}$/.test(docId) || !verifyRestoreToken(docId, token)) return null;

  const cart = await writeClient.fetch<{ email: string; name?: string; items?: SavedCartItem[] } | null>(
    `*[_id == $id][0]{ email, name, items }`,
    { id: docId }
  );
  if (!cart?.items?.length) return null;

  const products = await writeClient.fetch<{ _id: string; name: string; priceNGN?: number; images?: unknown[] }[]>(
    `*[_type == "product" && _id in $ids]{ _id, name, priceNGN, images }`,
    { ids: cart.items.map((i) => i.productId) }
  );
  const byId = new Map(products.map((p) => [p._id, p]));

  return {
    email: cart.email,
    name: cart.name || "",
    items: cart.items
      .filter((i) => byId.get(i.productId)?.priceNGN !== undefined)
      .map((i) => {
        const p = byId.get(i.productId)!;
        return {
          _id: p._id,
          name: p.name,
          price: p.priceNGN as number,
          image: p.images?.[0] ? urlFor(p.images[0]).url() : "",
          quantity: i.quantity,
          size: i.size || "M",
          notes: i.notes || "",
          heightLength: i.heightLength,
          gender: i.gender,
          selectedPrintId: i.selectedPrintId,
          selectedPrintName: i.selectedPrintName,
        };
      }),
  };
}
