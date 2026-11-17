// Server-only: browse follow-up emails for known contacts who allowed
// personalised emails. Five steps over 30 days, sent by the daily job:
//   1. ~24h   "Still thinking about it?"   the pieces they looked at
//   2. day 3  "How to wear it"             more photos + a customer review
//   3. day 7  "You might also love"        similar pieces
//   4. day 14 "The craft behind DAHRIOLA"  brand story
//   5. day 30 "New in, picked for you"     new arrivals (+ optional code)
// Stops when they buy; waits while an abandoned-checkout reminder is pending;
// at most one marketing email a day and three a week; stops after 60 days
// without any browsing or email clicks.
import { writeClient } from "@/src/lib/sanityWrite";
import { sha256 } from "@/src/lib/signing";
import { SITE_URL } from "@/src/lib/events";
import { esc } from "@/src/lib/mailer";
import type { Budget } from "@/src/lib/automations";
import {
  type EmailProduct,
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

export function browseDocId(email: string) {
  return `browse-${sha256(normEmail(email)).slice(0, 24)}`;
}

const DAY = 86_400_000;
// When each step is due, measured from when the sequence started
const STEP_DUE = [20 * 3600_000, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];

type Doc = {
  _id: string;
  email: string;
  views?: { productId: string; name: string; count: number; lastAt: string }[];
  lastViewedAt?: string;
  lastEngagedAt?: string;
  sequenceStartedAt: string;
  step?: number;
};

type Product = EmailProduct & { _id: string; category?: string; images?: string[]; description?: string };

async function productsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const rows = await writeClient.fetch<Product[]>(
    `*[_type == "product" && _id in $ids]{ _id, name, "slug": slug.current, priceNGN, "image": images[0].asset->url,
       "images": images[].asset->url, "category": category->title, briefDescription }`,
    { ids }
  );
  return ids.map((id) => rows.find((r) => r._id === id)).filter(Boolean) as Product[];
}

const firstName = (email: string, name?: string) => esc(String(name || "").trim().split(/\s+/)[0] || "there");

async function contactName(email: string) {
  return writeClient.fetch<string | null>(
    `coalesce(*[_type == "order" && lower(customerEmail) == $email][0].customerName, *[_type == "rsvp" && lower(email) == $email][0].name, *[_type == "abandonedCart" && email == $email][0].name)`,
    { email }
  );
}

async function buildStep(step: number, doc: Doc, settings: MarketingSettings) {
  const viewedIds = (doc.views || [])
    .slice()
    .sort((a, b) => b.count - a.count || new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime())
    .map((v) => v.productId);
  const viewed = await productsByIds(viewedIds.slice(0, 4));
  if (!viewed.length) return null;
  const top = viewed[0];
  const name = await contactName(doc.email);
  const hi = `<p>Hi ${firstName(doc.email, name || undefined)},</p>`;
  const productUrl = (p: Product) => (p.slug ? `${SITE_URL}/product/${p.slug}` : `${SITE_URL}/category/all`);

  if (step === 0) {
    return {
      subject: `Still thinking about ${top.name}?`,
      title: "Still thinking about it?",
      image: top.image,
      body: `${hi}
        <p>We noticed you had your eye on <strong>${esc(top.name)}</strong>. Good choice: each piece is made to order, with your height and fit in mind.</p>
        ${buttonHtml(productUrl(top), `See ${top.name}`)}
        ${viewed.length > 1 ? productCardsHtml(viewed.slice(1, 4), "ALSO ON YOUR RADAR") : ""}`,
    };
  }

  if (step === 1) {
    const review = await writeClient.fetch<{ name?: string; rating?: number; comment?: string } | null>(
      `*[_type == "review" && approved == true && product._ref == $id] | order(rating desc, _createdAt desc)[0]{ name, rating, comment }`,
      { id: top._id }
    );
    const gallery = (top.images || []).slice(1, 4).map((img) => ({ name: top.name, slug: top.slug, image: img }));
    return {
      subject: `How to wear ${top.name}`,
      title: "How to wear it",
      image: (top.images || [])[1] || top.image,
      body: `${hi}
        <p><strong>${esc(top.name)}</strong> is made to be lived in. Dress it up for an occasion or keep it easy for the weekend.</p>
        ${gallery.length ? productCardsHtml(gallery) : ""}
        ${review?.comment ? `<blockquote style="margin:22px 0;padding:14px 18px;background:#F6F4EF;border-left:3px solid #778472;font-family:Georgia,serif;font-style:italic;">“${esc(review.comment.slice(0, 260))}”<br><span style="font-style:normal;font-size:12px;color:#8a8170;">— ${esc(review.name || "A DAHRIOLA customer")}${review.rating ? ` · ${"★".repeat(Math.min(5, Math.round(review.rating)))}` : ""}</span></blockquote>` : ""}
        ${buttonHtml(productUrl(top), "Shop the piece")}`,
    };
  }

  if (step === 2) {
    const categories = [...new Set(viewed.map((p) => p.category).filter(Boolean))];
    const similar = await writeClient.fetch<EmailProduct[]>(
      `*[_type == "product" && defined(slug.current) && !(_id in $viewed) && category->title in $cats] | order(_createdAt desc)[0...4]{
        name, "slug": slug.current, "image": images[0].asset->url }`,
      { viewed: viewedIds, cats: categories }
    );
    const picks = similar.length >= 2 ? similar : await writeClient.fetch<EmailProduct[]>(
      `*[_type == "product" && defined(slug.current) && !(_id in $viewed)] | order(_createdAt desc)[0...4]{ name, "slug": slug.current, "image": images[0].asset->url }`,
      { viewed: viewedIds }
    );
    return {
      subject: "You might also love these",
      title: "You might also love",
      body: `${hi}
        <p>Based on the pieces you've been looking at, we think these are very you.</p>
        ${productCardsHtml(picks)}
        ${buttonHtml(`${SITE_URL}/category/all`, "Explore the collection")}`,
    };
  }

  if (step === 3) {
    return {
      subject: "The story behind every DAHRIOLA piece",
      title: "The craft behind DAHRIOLA",
      body: `${hi}
        <p>DAHRIOLA is a Nigerian contemporary African fashion brand, built on the idea that clothing should feel natural, expressive and comfortable, without forcing anyone into unrealistic standards of style or body type.</p>
        <p>Every piece is made to order, with your height and fit in mind, in prints chosen with care. And if you have something specific in mind, our bespoke service makes it just for you.</p>
        ${buttonHtml(`${SITE_URL}/our-story`, "Read our story")}
        <p style="text-align:center;margin:0;"><a href="${SITE_URL}/bespoke" style="color:#1a1a1a;font-size:13px;">Or start a bespoke piece →</a></p>
        ${productCardsHtml(viewed.slice(0, 3), "STILL WAITING FOR YOU")}`,
    };
  }

  // step 4
  const categories = [...new Set(viewed.map((p) => p.category).filter(Boolean))];
  const fresh = await writeClient.fetch<EmailProduct[]>(
    `*[_type == "product" && defined(slug.current) && !(_id in $viewed)] | order(category->title in $cats desc, _createdAt desc)[0...4]{
      name, "slug": slug.current, "image": images[0].asset->url }`,
    { viewed: viewedIds, cats: categories }
  );
  let code: string | undefined;
  if (settings.browseDiscount > 0) {
    code = await createPersonalCoupon({ email: doc.email, percent: settings.browseDiscount, days: 14, prefix: "PICK", purpose: "Browse follow-up (day 30)" });
  }
  return {
    subject: code ? `${settings.browseDiscount}% off, picked for you` : "New in, picked for you",
    title: "New in, picked for you",
    code,
    body: `${hi}
      <p>Here's what's new at DAHRIOLA, chosen around the pieces you've loved.</p>
      ${productCardsHtml(fresh)}
      ${code ? codeBoxHtml(code, `${settings.browseDiscount}% off your order · valid for 14 days · one use`) : ""}
      ${buttonHtml(`${SITE_URL}/category/all`, code ? "Use my code" : "Shop new arrivals")}`,
  };
}

export async function runBrowseSequences(settings: MarketingSettings, budget: Budget) {
  const stats = { sent: 0, waiting: 0, stopped: 0, converted: 0, failed: 0 };
  if (!settings.browseEnabled) return { ...stats, note: "off" };
  const now = Date.now();

  const docs = await writeClient.fetch<Doc[]>(
    `*[_type == "browseActivity" && coalesce(step, 0) < 5 && !defined(convertedAt) && count(views) > 0] | order(lastViewedAt desc)[0...200]{
      _id, email, views, lastViewedAt, lastEngagedAt, sequenceStartedAt, step }`
  );

  for (const doc of docs) {
    if (budget.left <= 0) break;
    const step = doc.step || 0;
    const started = new Date(doc.sequenceStartedAt).getTime();
    if (now < started + STEP_DUE[step]) {
      stats.waiting++;
      continue;
    }
    const email = normEmail(doc.email);
    const stop = () => writeClient.patch(doc._id).set({ step: 5 }).commit();

    // Bought since the sequence started? Hand over to the post-purchase emails.
    const bought = await writeClient.fetch<number>(
      `count(*[_type == "order" && lower(customerEmail) == $email && dateTime(createdAt) > dateTime($since)])`,
      { email, since: doc.sequenceStartedAt }
    );
    if (bought > 0) {
      await writeClient.patch(doc._id).set({ convertedAt: new Date().toISOString() }).commit();
      stats.converted++;
      continue;
    }

    // Sunset: no browsing or clicks for 60 days
    const lastSignal = Math.max(new Date(doc.lastViewedAt || 0).getTime(), new Date(doc.lastEngagedAt || 0).getTime());
    if (now - lastSignal > 60 * DAY || (await isOptedOut(email))) {
      await stop();
      stats.stopped++;
      continue;
    }

    // One journey at a time: an abandoned checkout reminder takes priority
    const cartPending = await writeClient.fetch<number>(
      `count(*[_type == "abandonedCart" && email == $email && !defined(recoveredAt) && dateTime(updatedAt) > dateTime($since)
         && (!defined(reminderSentAt) || dateTime(reminderSentAt) > dateTime($recent))])`,
      { email, since: new Date(now - 7 * DAY).toISOString(), recent: new Date(now - 2 * DAY).toISOString() }
    );
    // Frequency caps across all marketing emails
    const sentDay = await writeClient.fetch<number>(`count(*[_type == "marketingLog" && email == $email && dateTime(sentAt) > dateTime($since)])`, {
      email,
      since: new Date(now - 20 * 3600_000).toISOString(),
    });
    const sentWeek = await writeClient.fetch<number>(`count(*[_type == "marketingLog" && email == $email && dateTime(sentAt) > dateTime($since)])`, {
      email,
      since: new Date(now - 7 * DAY).toISOString(),
    });
    if (cartPending > 0 || sentDay >= 1 || sentWeek >= 3) {
      stats.waiting++;
      continue;
    }

    const content = await buildStep(step, doc, settings);
    if (!content) {
      await stop();
      stats.stopped++;
      continue;
    }
    if (!budget.take()) break;

    const res = await sendMarketingEmail({
      to: email,
      subject: content.subject,
      html: marketingShell({
        title: content.title,
        body: content.body,
        email,
        image: "image" in content ? content.image : undefined,
        reason: "You're receiving this because you're on the DAHRIOLA list and allowed personalised emails on our website.",
      }),
      kind: `browse-${step + 1}-${["viewed", "how-to-wear", "also-love", "brand-story", "new-in"][step]}`,
      key: `${doc._id}-${doc.sequenceStartedAt.slice(0, 10)}-${step}`,
      couponCode: "code" in content ? content.code : undefined,
    });
    if (res.sent || res.reason === "already sent") {
      await writeClient.patch(doc._id).set({ step: step + 1, lastStepAt: new Date().toISOString() }).commit();
      stats.sent += res.sent ? 1 : 0;
    } else if (res.reason === "unsubscribed") {
      await stop();
      stats.stopped++;
    } else {
      stats.failed++;
    }
  }
  return stats;
}
