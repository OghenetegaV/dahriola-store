"use server";

import { writeClient } from "@/src/lib/sanityWrite";
import { getMarketingSettings, normEmail } from "@/src/lib/marketing";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Notify me when this print is back" on a sold-out print. */
export async function requestStockAlert(input: { email: string; productId: string; printId: string }) {
  try {
    const email = normEmail(input.email);
    if (!EMAIL_RE.test(email)) return { success: false, message: "Please enter a valid email address." };

    const settings = await getMarketingSettings();
    if (!settings.backInStockEnabled) return { success: false, message: "Alerts aren't available right now." };

    // The print must belong to this product and actually be sold out
    const check = await writeClient.fetch<{ ok: boolean; stock?: number } | null>(
      `*[_type == "product" && _id == $productId][0]{
        "ok": $printId in prints[]._ref,
        "stock": *[_type == "print" && _id == $printId][0].stockQuantity
      }`,
      { productId: String(input.productId), printId: String(input.printId) }
    );
    if (!check?.ok) return { success: false, message: "That print isn't available for this piece." };
    if (Number(check.stock || 0) > 0) return { success: false, message: "Good news, this print is back in stock!" };

    const existing = await writeClient.fetch<number>(
      `count(*[_type == "stockAlert" && email == $email && print._ref == $printId && product._ref == $productId && !defined(notifiedAt)])`,
      { email, printId: input.printId, productId: input.productId }
    );
    if (existing > 0) return { success: true, message: "You're already on the list for this one." };

    const open = await writeClient.fetch<number>(`count(*[_type == "stockAlert" && email == $email && !defined(notifiedAt)])`, { email });
    if (open >= 15) return { success: false, message: "You've asked for a lot of alerts already. We'll be in touch!" };

    await writeClient.create({
      _type: "stockAlert",
      email,
      product: { _type: "reference", _ref: input.productId, _weak: true },
      print: { _type: "reference", _ref: input.printId, _weak: true },
      createdAt: new Date().toISOString(),
    });
    return { success: true, message: "We'll email you as soon as it's back." };
  } catch (err) {
    console.error("requestStockAlert failed:", err);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}
