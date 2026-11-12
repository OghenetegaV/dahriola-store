// Server-only marketing automations, run once a day by /api/cron/daily.
// Each returns a small summary for the cron log. All of them respect
// unsubscribes and use the send log so nobody gets the same email twice.
import { writeClient } from "@/src/lib/sanityWrite";
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
  const items = await writeClient.fetch<{ name: string; slug?: string; image?: string; size?: string; purchased?: boolean }[]>(
    `*[_type == "sharedList" && kind == "wishlist" && active != false && lower(ownerEmail) == $email] | order(updatedAt desc)[0].items[]{
      "name": coalesce(product->name, productName), "slug": product->slug.current, "image": product->images[0].asset->url, size, purchased
    }`,
    { email }
  );
  return (items || []).filter((i) => !i.purchased && i.slug).map((i) => ({ ...i, note: i.size ? `Size ${i.size}` : undefined }));
}

async function newArrivals(): Promise<EmailProduct[]> {
  return writeClient.fetch(
    `*[_type == "product" && defined(slug.current)] | order(_createdAt desc)[0...4]{ name, "slug": slug.current, "image": images[0].asset->url }`
  );
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

  const orders = await writeClient.fetch<{ email: string; name?: string; createdAt: string; optIn?: boolean }[]>(
    `*[_type == "order" && paymentVerified == true && defined(customerEmail) && defined(createdAt)] | order(createdAt asc){
      "email": lower(customerEmail), "name": customerName, createdAt, "optIn": emailOptIn
    }`
  );
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

  // Sanity doesn't timestamp the tick, so record it the first day we see it
  const newlyDelivered = await writeClient.fetch<string[]>(`*[_type == "order" && delivered == true && !defined(deliveredAt)]._id`);
  for (const id of newlyDelivered) {
    await writeClient.patch(id).set({ deliveredAt: new Date().toISOString() }).commit();
    stats.recordedDeliveries++;
  }
  if (!settings.reviewRequestsEnabled) return { ...stats, note: "off" };

  const cutoff = new Date(Date.now() - settings.reviewRequestDelayDays * 86_400_000).toISOString();
  const due = await writeClient.fetch<{ _id: string; email: string; name?: string; items: { name: string; productId?: string }[] }[]>(
    `*[_type == "order" && delivered == true && paymentVerified == true && defined(customerEmail)
       && dateTime(deliveredAt) <= dateTime($cutoff) && !defined(reviewRequestSentAt)][0...100]{
      _id, "email": lower(customerEmail), "name": customerName, "items": items[]{ name, "productId": product._ref }
    }`,
    { cutoff }
  );

  for (const order of due) {
    if (budget.left <= 0) break;
    // Older orders don't link to products, so fall back to matching by name
    const ids = order.items.map((i) => i.productId).filter(Boolean);
    const names = order.items.map((i) => i.name).filter(Boolean);
    const products = await writeClient.fetch<EmailProduct[]>(
      `*[_type == "product" && (_id in $ids || name in $names)]{ name, "slug": slug.current, "image": images[0].asset->url }`,
      { ids, names }
    );
    const done = () => writeClient.patch(order._id).set({ reviewRequestSentAt: new Date().toISOString() }).commit();
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

  const ready = await writeClient.fetch<
    { _id: string; email: string; product?: EmailProduct; printName?: string }[]
  >(
    `*[_type == "stockAlert" && !defined(notifiedAt) && print->stockQuantity > 0][0...200]{
      _id, email,
      "product": product->{ name, "slug": slug.current, "image": images[0].asset->url },
      "printName": print->name
    }`
  );

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
          ${p?.image ? `<img src="${esc(p.image)}?w=520&h=650&fit=crop&auto=format" width="260" alt="${esc(p.name)}" style="display:block;margin:20px auto;width:260px;height:auto;border:0;">` : ""}
          ${buttonHtml(p?.slug ? `${SITE_URL}/product/${p.slug}` : SITE_URL, "Shop it now")}
          <p style="font-size:11px;color:#9a9284;margin-top:20px;">You asked us to let you know when this print was back. This is a one-off email.</p>
        </td></tr>
      </table></td></tr></table></body></html>`;
    const ok = await sendMail({ to: alert.email, subject: `Back in stock: ${alert.printName || "your print"}${p ? ` · ${p.name}` : ""}`, html });
    if (ok) {
      await writeClient.patch(alert._id).set({ notifiedAt: new Date().toISOString() }).commit();
      stats.sent++;
    } else stats.failed++;
  }
  return stats;
}
