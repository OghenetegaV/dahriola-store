// Server-only marketing automations, run once a day by /api/cron/daily.
// Each returns a small summary for the cron log. All of them respect
// unsubscribes and use the send log so nobody gets the same email twice.
import { db, fetchAll, lc, unwrap } from "@/src/lib/supabase/admin";
import { listProducts, newestProductCards, productsByIds, toCardInfo } from "@/src/lib/catalog";
import type { StoredOrderItem } from "@/src/lib/orders";
import type { ListItemDoc } from "@/src/lib/sharedLists";
import { getSheet } from "@/src/lib/googleSheets";
import { EVENT_TZ, SITE_URL } from "@/src/lib/events";
import { esc, sendMail } from "@/src/lib/mailer";
import {
  type EmailProduct,
  type MarketingSettings,
  alreadySent,
  buttonHtml,
  codeBoxHtml,
  createPersonalCoupon,
  isOptedOut,
  marketingShell,
  normEmail,
  parseBirthday,
  productCardsHtml,
  sendMarketingEmail,
} from "@/src/lib/marketing";
import { imageUrl } from "@/src/lib/images";

/**
 * Shared daily allowance so marketing never crowds out order/RSVP emails, and
 * so the job stops before Vercel's time limit (the rest go out tomorrow).
 */
export class Budget {
  constructor(private count: number, private deadline: number) {}
  get left() {
    return Date.now() < this.deadline ? this.count : 0;
  }
  take() {
    if (this.left <= 0) return false;
    this.count--;
    return true;
  }
}

function lagosParts(d = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: EVENT_TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const firstName = (name?: string) => esc(String(name || "").trim().split(/\s+/)[0] || "there");

async function wishlistFor(email: string): Promise<EmailProduct[]> {
  const list = unwrap(
    await db()
      .from("shared_lists")
      .select("items")
      .eq("kind", "wishlist")
      .eq("active", true)
      .eq("owner_email_lc", lc(email))
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Loading the wishlist"
  ) as { items: ListItemDoc[] | null } | null;
  const items = (list?.items || []).filter((i) => !i.purchased && i.productId);
  const products = await productsByIds(items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p._id, p]));
  return items
    .filter((i) => byId.get(i.productId)?.slug)
    .map((i) => {
      const p = byId.get(i.productId)!;
      return { name: p.name, slug: p.slug, image: p.images[0], note: i.size ? `Size ${i.size}` : undefined };
    });
}

async function newArrivals(): Promise<EmailProduct[]> {
  return newestProductCards({ limit: 4 });
}

// ---------------------------------------------------------------------------
// Birthdays: on the first days of each month, for newsletter subscribers
// whose birthday month it is. One per person per year.
export async function runBirthdays(settings: MarketingSettings, budget: Budget) {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  if (!settings.birthdayEnabled) return { ...stats, note: "off" };
  const today = lagosParts();
  if (today.day > 3) return { ...stats, note: "runs on the 1st–3rd of the month" };

  const sheet = await getSheet(["Name", "Email", "Birthday", "Source", "Discount Code", "Created At"]);
  const rows = await sheet.getRows();
  const people = new Map<string, string>();
  for (const row of rows) {
    const email = normEmail(String(row.get("Email") || ""));
    if (!email || people.has(email)) continue;
    if (parseBirthday(String(row.get("Birthday") || "")).month === today.month) people.set(email, String(row.get("Name") || ""));
  }

  const key = `birthday-${today.year}`;
  for (const [email, name] of people) {
    if (budget.left <= 0) break;
    if ((await isOptedOut(email)) || (await alreadySent(email, key))) {
      stats.skipped++;
      continue;
    }
    budget.take();
    const code = await createPersonalCoupon({ email, percent: settings.birthdayDiscount, days: settings.codeValidDays, prefix: "BDAY", purpose: `Birthday ${today.year}` });
    const wishlist = await wishlistFor(email);
    const picks = wishlist.length ? wishlist : await newArrivals();
    const body = `
      <p>Hi ${firstName(name)},</p>
      <p>Happy birthday month from all of us at DAHRIOLA! 🎉 To celebrate you, here's <strong>${settings.birthdayDiscount}% off</strong> anything you love.</p>
      ${codeBoxHtml(code, `Your personal code · valid for ${settings.codeValidDays} days · one use`)}
      ${buttonHtml(wishlist.length ? `${SITE_URL}/wishlist` : `${SITE_URL}/category/all`, wishlist.length ? "Treat yourself" : "Shop now")}
      ${productCardsHtml(picks, wishlist.length ? "STILL ON YOUR WISHLIST" : "NEW IN")}`;
    const res = await sendMarketingEmail({
      to: email,
      name,
      subject: `Happy birthday month, ${String(name || "").trim().split(/\s+/)[0] || "friend"}! A gift from DAHRIOLA 🎁`,
      html: marketingShell({ title: `Happy ${MONTHS[today.month - 1]} birthday!`, body, email, reason: "You're receiving this because you joined the DAHRIOLA newsletter and shared your birthday month." }),
      kind: "birthday",
      key,
      couponCode: code,
    });
    if (res.sent) stats.sent++;
    else stats.failed++;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// First-order anniversary: one year (or more) to the day after a customer's
// first paid order — only for customers who agreed to marketing emails.
export async function runAnniversaries(settings: MarketingSettings, budget: Budget) {
  const stats = { sent: 0, skipped: 0, failed: 0 };
  if (!settings.anniversaryEnabled) return { ...stats, note: "off" };
  const today = lagosParts();

  const rows = await fetchAll<{ email: string; name?: string; createdAt: string; optIn?: boolean }>(
    (from, to) =>
      db()
        .from("orders")
        .select("email:customer_email, name:customer_name, createdAt:created_at, optIn:email_opt_in")
        .eq("payment_verified", true)
        .not("customer_email", "is", null)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to),
    "Loading orders"
  );
  const orders = rows.map((o) => ({ ...o, email: normEmail(o.email) })).filter((o) => o.email);
  const firstOrder = new Map<string, { name?: string; createdAt: string; optIn: boolean }>();
  for (const o of orders) {
    const prev = firstOrder.get(o.email);
    if (!prev) firstOrder.set(o.email, { name: o.name, createdAt: o.createdAt, optIn: !!o.optIn });
    else if (o.optIn) prev.optIn = true;
  }

  for (const [email, info] of firstOrder) {
    if (budget.left <= 0) break;
    const d = lagosParts(new Date(info.createdAt));
    if (!info.optIn || d.month !== today.month || d.day !== today.day || d.year >= today.year) continue;
    const years = today.year - d.year;
    const key = `anniversary-${today.year}`;
    if ((await isOptedOut(email)) || (await alreadySent(email, key))) {
      stats.skipped++;
      continue;
    }
    budget.take();
    const code = await createPersonalCoupon({ email, percent: settings.anniversaryDiscount, days: settings.codeValidDays, prefix: "THANKS", purpose: `Anniversary ${today.year}` });
    const body = `
      <p>Hi ${firstName(info.name)},</p>
      <p>${years === 1 ? "A year ago today" : `${years} years ago today`}, you placed your first DAHRIOLA order. Thank you for being part of our story.</p>
      <p>To say thank you, here's <strong>${settings.anniversaryDiscount}% off</strong> your next piece.</p>
      ${codeBoxHtml(code, `Your personal code · valid for ${settings.codeValidDays} days · one use`)}
      ${buttonHtml(`${SITE_URL}/category/all`, "See what's new")}
      ${productCardsHtml(await newArrivals(), "NEW IN")}`;
    const res = await sendMarketingEmail({
      to: email,
      name: info.name,
      subject: `Happy DAHRIOLA anniversary! A thank-you for you`,
      html: marketingShell({ title: "Happy anniversary", body, email, reason: "You're receiving this because you agreed to DAHRIOLA news and offers at checkout." }),
      kind: "anniversary",
      key,
      couponCode: code,
    });
    if (res.sent) stats.sent++;
    else stats.failed++;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Review requests: a few days after the owner ticks "Delivered".
export async function runReviewRequests(settings: MarketingSettings, budget: Budget) {
  const stats = { recordedDeliveries: 0, sent: 0, skipped: 0, failed: 0 };

  // Safety net: the dashboard stamps the delivery date, but record it here for
  // any order marked delivered without one
  const newlyDelivered = unwrap(
    await db().from("orders").select("id").eq("delivered", true).is("delivered_at", null),
    "Loading delivered orders"
  ) as { id: string }[];
  for (const { id } of newlyDelivered) {
    unwrap(await db().from("orders").update({ delivered_at: new Date().toISOString() }).eq("id", id), "Recording delivery");
    stats.recordedDeliveries++;
  }
  if (!settings.reviewRequestsEnabled) return { ...stats, note: "off" };

  const cutoff = new Date(Date.now() - settings.reviewRequestDelayDays * 86_400_000).toISOString();
  const dueRows = unwrap(
    await db()
      .from("orders")
      .select("_id:id, email:customer_email, name:customer_name, items")
      .eq("delivered", true)
      .eq("payment_verified", true)
      .not("customer_email", "is", null)
      .lte("delivered_at", cutoff)
      .is("review_request_sent_at", null)
      .limit(100),
    "Loading orders due a review request"
  ) as { _id: string; email: string; name?: string; items: StoredOrderItem[] | null }[];
  const due = dueRows.map((o) => ({ ...o, email: normEmail(o.email), items: Array.isArray(o.items) ? o.items : [] }));

  // Older orders don't link to products, so fall back to matching by name
  const catalogue = due.length ? await listProducts() : [];

  for (const order of due) {
    if (budget.left <= 0) break;
    const ids = new Set(order.items.map((i) => i.productId).filter(Boolean));
    const names = new Set(order.items.map((i) => i.name).filter(Boolean));
    const products: EmailProduct[] = catalogue.filter((p) => ids.has(p._id) || names.has(p.name)).map(toCardInfo);
    const done = async () =>
      unwrap(
        await db().from("orders").update({ review_request_sent_at: new Date().toISOString() }).eq("id", order._id),
        "Recording the review request"
      );
    if (!products.length || (await isOptedOut(order.email))) {
      await done();
      stats.skipped++;
      continue;
    }
    budget.take();
    const cards = products.map((p) => ({ ...p, slug: p.slug ? `${p.slug}#reviews` : p.slug, note: "Leave a review →" }));
    const body = `
      <p>Hi ${firstName(order.name)},</p>
      <p>We hope you're loving your new DAHRIOLA ${products.length > 1 ? "pieces" : "piece"}! Every outfit is made with care, and hearing how it fits and feels means the world to us (and helps other shoppers too).</p>
      <p>Would you take a minute to leave a review?</p>
      ${productCardsHtml(cards)}
      ${buttonHtml(`${SITE_URL}/product/${products[0].slug}#reviews`, "Write a review")}
      <p style="font-size:13px;color:#777;">Got a photo wearing it? Tag us on Instagram, we'd love to see!</p>`;
    const res = await sendMarketingEmail({
      to: order.email,
      name: order.name,
      subject: "How are you loving your DAHRIOLA order?",
      html: marketingShell({ title: "How did we do?", body, email: order.email, reason: "You're receiving this because you recently ordered from DAHRIOLA." }),
      kind: "review-request",
      key: `review-${order._id}`,
    });
    await done();
    if (res.sent) stats.sent++;
    else stats.failed++;
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Back in stock: people who asked to be told when a sold-out print returns.
// They asked for this specific email, so it goes even if they've unsubscribed
// from general marketing.
export async function runBackInStock(settings: MarketingSettings, budget: Budget) {
  const stats = { sent: 0, failed: 0 };
  if (!settings.backInStockEnabled) return { ...stats, note: "off" };

  const rows = unwrap(
    await db()
      .from("stock_alerts")
      .select("_id:id, email, prints!inner(name, stock_quantity), product:products(name, slug, images)")
      .is("notified_at", null)
      .gt("prints.stock_quantity", 0)
      .limit(200),
    "Loading back-in-stock requests"
  ) as unknown as {
    _id: string;
    email: string;
    prints: { name: string } | null;
    product: { name: string; slug: string; images: string[] | null } | null;
  }[];
  const ready = rows.map((r) => ({
    _id: r._id,
    email: r.email,
    printName: r.prints?.name,
    product: r.product ? ({ name: r.product.name, slug: r.product.slug, image: r.product.images?.[0] } as EmailProduct) : undefined,
  }));

  for (const alert of ready) {
    if (!budget.take()) break;
    const p = alert.product;
    const html = `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;"><tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e8e3d9;">
        <tr><td style="padding:22px 32px 0;text-align:center;font-size:11px;letter-spacing:5px;color:#8a8170;">DAHRIOLA</td></tr>
        <tr><td style="padding:22px 32px 30px;text-align:center;">
          <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 12px;">It's back!</h1>
          <p style="font-size:15px;line-height:1.6;">The <strong>${esc(alert.printName || "print")}</strong> print${p ? ` for <strong>${esc(p.name)}</strong>` : ""} is back in stock. Prints are limited, so don't wait too long.</p>
          ${p?.image ? `<img src="${esc(imageUrl(p.image, { width: 520, height: 650 }))}" width="260" alt="${esc(p.name)}" style="display:block;margin:20px auto;width:260px;height:auto;border:0;">` : ""}
          ${buttonHtml(p?.slug ? `${SITE_URL}/product/${p.slug}` : SITE_URL, "Shop it now")}
          <p style="font-size:11px;color:#9a9284;margin-top:20px;">You asked us to let you know when this print was back. This is a one-off email.</p>
        </td></tr>
      </table></td></tr></table></body></html>`;
    const ok = await sendMail({ tag: "back-in-stock", to: alert.email, subject: `Back in stock: ${alert.printName || "your print"}${p ? ` · ${p.name}` : ""}`, html });
    if (ok) {
      unwrap(
        await db().from("stock_alerts").update({ notified_at: new Date().toISOString() }).eq("id", alert._id),
        "Recording the alert"
      );
      stats.sent++;
    } else stats.failed++;
  }
  return stats;
}
