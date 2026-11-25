"use server";

import { db, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
import { priceItems, type CheckoutItemInput } from "@/src/lib/checkoutPricing";
import { cartDocId, verifyRestoreToken, type SavedCartItem } from "@/src/lib/abandonedCarts";
import { normEmail } from "@/src/lib/marketing";
import { trackBrevoEvent } from "@/src/lib/brevo";
import { identityToken } from "@/src/lib/identity";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Saves the checkout once an email is entered, for one reminder if they don't pay. */
export async function saveCheckoutProgress(input: { email: string; name?: string; items: CheckoutItemInput[] }) {
  try {
    const email = normEmail(input.email);
    if (!EMAIL_RE.test(email) || !Array.isArray(input.items) || !input.items.length) return { ok: false };

    const priced = await priceItems(input.items.slice(0, 30));
    if ("error" in priced) return { ok: false };

    const id = cartDocId(email);
    const now = new Date().toISOString();
    const items: SavedCartItem[] = priced.lines.map((l) => ({
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

    const existing = unwrap(
      await db().from("abandoned_carts").select("reminder_sent_at, recovered_at").eq("id", id).maybeSingle(),
      "Loading the saved checkout"
    ) as { reminder_sent_at: string | null; recovered_at: string | null } | null;

    // A new shopping session after an old reminder or a finished order starts fresh
    const startsFresh = !existing || !!existing.recovered_at || !!existing.reminder_sent_at;

    unwrap(
      await db()
        .from("abandoned_carts")
        .upsert(
          {
            id,
            email,
            name: String(input.name || "").trim().slice(0, 100),
            items,
            subtotal: priced.subtotal,
            updated_at: now,
            ...(startsFresh ? { created_at: now, reminder_sent_at: null, recovered_at: null } : {}),
          },
          { onConflict: "id" }
        ),
      "Saving the checkout"
    );

    // Tell Brevo once per shopping session, not on every keystroke
    if (startsFresh) {
      await trackBrevoEvent(email, "checkout_started", {
        value: priced.subtotal,
        currency: "NGN",
        item_count: items.reduce((n, i) => n + i.quantity, 0),
        items: items.map((i) => ({ name: i.name, quantity: i.quantity, size: i.size })),
      });
    }
    return { ok: true, did: identityToken(email) };
  } catch (err) {
    console.error("saveCheckoutProgress failed:", err);
    return { ok: false };
  }
}

/** The "Complete my order" link from the reminder email → the saved bag. */
export async function restoreCheckout(id: string, token: string) {
  const docId = String(id || "");
  if (!/^abandonedCart-[a-f0-9]{24}$/.test(docId) || !verifyRestoreToken(docId, token)) return null;

  const cart = unwrap(
    await db().from("abandoned_carts").select("email, name, items").eq("id", docId).maybeSingle(),
    "Loading the saved checkout"
  ) as { email: string; name?: string | null; items?: SavedCartItem[] | null } | null;
  if (!cart?.items?.length) return null;

  const products = await productsByIds(cart.items.map((i) => i.productId));
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
          image: p.images[0] || "",
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
