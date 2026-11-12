// Server-only: abandoned checkouts — saving, restoring and the daily reminder.
import { writeClient } from "@/src/lib/sanityWrite";
import { hmac, safeEqual, sha256 } from "@/src/lib/signing";
import { SITE_URL } from "@/src/lib/events";
import { esc } from "@/src/lib/mailer";
import {
  type MarketingSettings,
  buttonHtml,
  codeBoxHtml,
  createPersonalCoupon,
  isOptedOut,
  marketingShell,
  normEmail,
  productCardsHtml,
  sendMarketingEmail,
} from "@/src/lib/marketing";
import type { Budget } from "@/src/lib/automations";

export type SavedCartItem = {
  _key: string;
  productId: string;
  name: string;
  quantity: number;
  size?: string;
  selectedPrintId?: string;
  selectedPrintName?: string;
  heightLength?: string;
  gender?: string;
  notes?: string;
};

/** One saved checkout per email address. */
export function cartDocId(email: string) {
  return `abandonedCart-${sha256(normEmail(email)).slice(0, 24)}`;
}
export function restoreToken(docId: string) {
  return hmac(`cart|${docId}`).slice(0, 24);
}
export function verifyRestoreToken(docId: string, token: string) {
  return safeEqual(restoreToken(docId), String(token || ""));
}
export function restoreUrl(docId: string) {
  return `${SITE_URL}/checkout?restore=${encodeURIComponent(docId)}&t=${restoreToken(docId)}`;
}

export async function markCartRecovered(email: string) {
  if (!email) return;
  try {
    await writeClient
      .patch(cartDocId(email))
      .set({ recoveredAt: new Date().toISOString() })
      .commit();
  } catch {
    // no saved checkout for this email — nothing to do
  }
}

// ---------------------------------------------------------------------------
// Daily: one reminder for checkouts left 3+ hours (and under 7 days) ago.
export async function runAbandonedCarts(settings: MarketingSettings, budget: Budget) {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  if (!settings.abandonedCartEnabled) return { ...stats, note: "off" };

  const now = Date.now();
  const carts = await writeClient.fetch<
    { _id: string; email: string; name?: string; updatedAt: string; items: SavedCartItem[] }[]
  >(
    `*[_type == "abandonedCart" && !defined(reminderSentAt) && !defined(recoveredAt)
       && dateTime(updatedAt) < dateTime($cutoff) && dateTime(updatedAt) > dateTime($oldest)] | order(updatedAt desc)[0...100]{
      _id, email, name, updatedAt, items
    }`,
    { cutoff: new Date(now - 3 * 3600_000).toISOString(), oldest: new Date(now - 7 * 86_400_000).toISOString() }
  );

  for (const cart of carts) {
    if (budget.left <= 0) break;
    const email = normEmail(cart.email);
    const markSent = () => writeClient.patch(cart._id).set({ reminderSentAt: new Date().toISOString() }).commit();

    // Bought after all (e.g. on another device)?
    const ordered = await writeClient.fetch<number>(
      `count(*[_type == "order" && lower(customerEmail) == $email && dateTime(createdAt) > dateTime($since)])`,
      { email, since: new Date(new Date(cart.updatedAt).getTime() - 3600_000).toISOString() }
    );
    if (ordered > 0) {
      await writeClient.patch(cart._id).set({ recoveredAt: new Date().toISOString() }).commit();
      stats.skipped++;
      continue;
    }
    if (!cart.items?.length || (await isOptedOut(email))) {
      await markSent();
      stats.skipped++;
      continue;
    }

    budget.take();
    const products = await writeClient.fetch<{ _id: string; slug?: string; image?: string }[]>(
      `*[_type == "product" && _id in $ids]{ _id, "slug": slug.current, "image": images[0].asset->url }`,
      { ids: cart.items.map((i) => i.productId) }
    );
    const byId = new Map(products.map((p) => [p._id, p]));
    const cards = cart.items.map((i) => ({
      name: i.name,
      slug: byId.get(i.productId)?.slug,
      image: byId.get(i.productId)?.image,
      note: [i.size && `Size ${i.size}`, i.selectedPrintName].filter(Boolean).join(" · ") || undefined,
    }));

    let code: string | undefined;
    if (settings.abandonedCartDiscount > 0) {
      code = await createPersonalCoupon({
        email,
        percent: settings.abandonedCartDiscount,
        days: 7,
        prefix: "BAG",
        purpose: "Abandoned checkout reminder",
      });
    }

    const first = esc(String(cart.name || "").trim().split(/\s+/)[0] || "there");
    const body = `
      <p>Hi ${first},</p>
      <p>You left something beautiful in your bag. We've saved your picks, sizes and options, so you can finish your order in a click.</p>
      ${productCardsHtml(cards)}
      ${code ? codeBoxHtml(code, `${settings.abandonedCartDiscount}% off to complete your order · valid for 7 days · one use`) : ""}
      ${buttonHtml(restoreUrl(cart._id), "Complete my order")}
      <p style="font-size:13px;color:#777;">Have a question about sizing or delivery? Just reply to this email, we're happy to help.</p>`;

    const res = await sendMarketingEmail({
      to: email,
      name: cart.name,
      subject: "You left something in your bag",
      html: marketingShell({
        title: "Still thinking it over?",
        body,
        email,
        reason: "You're receiving this because you started a checkout at dahriola.com.",
      }),
      kind: "abandoned-cart",
      key: `cart-${cart._id}-${cart.updatedAt.slice(0, 10)}`,
      couponCode: code,
    });
    await markSent();
    if (res.sent) stats.sent++;
    else stats.failed++;
  }
  return stats;
}
