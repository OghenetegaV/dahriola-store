// Server-only: abandoned checkouts — saving, restoring and the daily reminder.
import { COUNT, countRows, db, lc, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
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
    // Does nothing when there is no saved checkout for this email
    await db().from("abandoned_carts").update({ recovered_at: new Date().toISOString() }).eq("id", cartDocId(email));
  } catch (err) {
    console.error("markCartRecovered failed:", err);
  }
}

type CartRow = { _id: string; email: string; name?: string | null; updatedAt: string; items: SavedCartItem[] | null };

// ---------------------------------------------------------------------------
// Daily: one reminder for checkouts left 3+ hours (and under 7 days) ago.
export async function runAbandonedCarts(settings: MarketingSettings, budget: Budget) {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  if (!settings.abandonedCartEnabled) return { ...stats, note: "off" };

  const now = Date.now();
  const carts = unwrap(
    await db()
      .from("abandoned_carts")
      .select("_id:id, email, name, updatedAt:updated_at, items")
      .is("reminder_sent_at", null)
      .is("recovered_at", null)
      .lt("updated_at", new Date(now - 3 * 3600_000).toISOString())
      .gt("updated_at", new Date(now - 7 * 86_400_000).toISOString())
      .order("updated_at", { ascending: false })
      .limit(100),
    "Loading abandoned checkouts"
  ) as CartRow[];

  const patch = async (id: string, values: Record<string, unknown>) =>
    unwrap(await db().from("abandoned_carts").update(values).eq("id", id), "Updating the saved checkout");

  for (const cart of carts) {
    if (budget.left <= 0) break;
    const email = normEmail(cart.email);
    const items = Array.isArray(cart.items) ? cart.items : [];
    const updatedDay = new Date(cart.updatedAt).toISOString().slice(0, 10);
    const markSent = () => patch(cart._id, { reminder_sent_at: new Date().toISOString() });

    // Bought after all (e.g. on another device)?
    const ordered = await countRows(
      db()
        .from("orders")
        .select("*", COUNT)
        .eq("customer_email_lc", lc(email))
        .gt("created_at", new Date(new Date(cart.updatedAt).getTime() - 3600_000).toISOString())
    );
    if (ordered > 0) {
      await patch(cart._id, { recovered_at: new Date().toISOString() });
      stats.skipped++;
      continue;
    }
    if (!items.length || (await isOptedOut(email))) {
      await markSent();
      stats.skipped++;
      continue;
    }

    budget.take();
    const products = await productsByIds(items.map((i) => i.productId));
    const byId = new Map(products.map((p) => [p._id, p]));
    const cards = items.map((i) => ({
      name: i.name,
      slug: byId.get(i.productId)?.slug,
      image: byId.get(i.productId)?.images[0],
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
      name: cart.name || undefined,
      subject: "You left something in your bag",
      html: marketingShell({
        title: "Still thinking it over?",
        body,
        email,
        reason: "You're receiving this because you started a checkout at dahriola.com.",
      }),
      kind: "abandoned-cart",
      key: `cart-${cart._id}-${updatedDay}`,
      couponCode: code,
    });
    await markSent();
    if (res.sent) stats.sent++;
    else stats.failed++;
  }
  return stats;
}
