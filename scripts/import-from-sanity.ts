// One-off import of everything in Sanity into Supabase.
//
//   npx tsx scripts/import-from-sanity.ts --dry-run     (count only, changes nothing)
//   npx tsx scripts/import-from-sanity.ts               (copy data + images)
//   npx tsx scripts/import-from-sanity.ts --keep-sanity-images
//                                                       (copy data, leave images on Sanity's CDN)
//
// Before running: create the tables with supabase/schema.sql and put the
// Supabase keys in .env.local next to the existing Sanity ones.
//
// Safe to run more than once: rows are matched by their Sanity ID and
// overwritten, images are re-used. Nothing in Sanity is changed or deleted.
// IDs are kept, so customers' saved carts, wishlists, shared lists and order
// tracking links carry on working.
import fs from "fs";
import { createClient as createSanityClient } from "@sanity/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i < 0 || line.trim().startsWith("#")) continue;
  const k = line.slice(0, i).trim();
  const v = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  process.env[k] ??= v;
}

const DRY = process.argv.includes("--dry-run");
const KEEP_CDN = process.argv.includes("--keep-sanity-images");
const BUCKET = "media";

function need(name: string) {
  const v = (process.env[name] || "").trim();
  if (!v) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return v;
}

const SUPABASE_URL = need("NEXT_PUBLIC_SUPABASE_URL").replace(/\/+$/, "");
const sanity = createSanityClient({
  projectId: need("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-03-03",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
  perspective: "published",
});
if (!process.env.SUPABASE_SECRET_KEY) process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createSupabaseClient(SUPABASE_URL, need("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

/* eslint-disable @typescript-eslint/no-explicit-any */
type Doc = Record<string, any>;
const warnings: string[] = [];
const warn = (message: string) => {
  warnings.push(message);
  console.warn(`  ! ${message}`);
};

const NOT_DRAFT = `!(_id in path("drafts.**"))`;
const fetchType = (type: string, projection = "{...}") => sanity.fetch<Doc[]>(`*[_type == "${type}" && ${NOT_DRAFT}] | order(_createdAt asc) ${projection}`);

const ASSET = `{ "id": asset->_id, "url": asset->url, "ext": asset->extension, "mime": asset->mimeType, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height }`;

// ───────────────────────── Images and files ─────────────────────────

type Asset = { id?: string; url?: string; ext?: string; mime?: string; width?: number; height?: number };
const copied = new Map<string, string>();

/** Copies one Sanity asset into Supabase Storage and returns its new public URL. */
async function moveAsset(asset?: Asset | null): Promise<string | null> {
  if (!asset?.url) return null;
  if (KEEP_CDN || DRY) return asset.url;
  const key = asset.id || asset.url;
  const done = copied.get(key);
  if (done) return done;

  const name = String(asset.id || asset.url.split("/").pop() || "file").replace(/[^a-zA-Z0-9_-]/g, "-");
  const path = `imported/${name}.${asset.ext || asset.url.split(".").pop() || "bin"}`;
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  try {
    const res = await fetch(asset.url);
    if (!res.ok) throw new Error(`download ${res.status}`);
    const body = Buffer.from(await res.arrayBuffer());
    const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
      contentType: asset.mime || res.headers.get("content-type") || "application/octet-stream",
      cacheControl: "31536000",
      upsert: true,
    });
    if (error) throw new Error(error.message);
    copied.set(key, publicUrl);
    return publicUrl;
  } catch (err) {
    warn(`Could not copy ${asset.url} (${err instanceof Error ? err.message : err}); keeping the Sanity link for now.`);
    return asset.url;
  }
}

async function moveAll(assets: (Asset | null | undefined)[] | null | undefined) {
  const out: string[] = [];
  for (const a of assets || []) {
    const url = await moveAsset(a);
    if (url) out.push(url);
  }
  return out;
}

// ───────────────────────── Formatted text ─────────────────────────

/** Sanity's block text → the simple text format the dashboard and shop use. */
function blocksToText(blocks: unknown): string | null {
  if (typeof blocks === "string") return blocks.trim() || null;
  if (!Array.isArray(blocks)) return null;
  const parts: string[] = [];
  let list: string[] = [];
  const flushList = () => {
    if (list.length) parts.push(list.join("\n"));
    list = [];
  };
  for (const block of blocks as Doc[]) {
    if (block?._type !== "block") continue;
    const links = new Map<string, string>((block.markDefs || []).filter((d: Doc) => d._type === "link" && d.href).map((d: Doc) => [d._key, d.href]));
    const text = (block.children || [])
      .map((child: Doc) => {
        let t = String(child.text || "");
        if (!t.trim()) return t;
        const marks: string[] = child.marks || [];
        if (marks.includes("strong")) t = `**${t.trim()}**${t.endsWith(" ") ? " " : ""}`;
        const href = marks.map((m) => links.get(m)).find(Boolean);
        if (href) t = `[${t.trim()}](${href})`;
        return t;
      })
      .join("")
      .trim();
    if (!text) continue;
    if (block.listItem) {
      list.push(`- ${text}`);
      continue;
    }
    flushList();
    parts.push(/^h[1-6]$/.test(block.style || "") ? `## ${text.replace(/\*\*/g, "")}` : text);
  }
  flushList();
  return parts.join("\n\n").trim() || null;
}

// ───────────────────────── Helpers ─────────────────────────

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** Unique slugs, even if Sanity had blanks or duplicates. */
function slugger(kind: string) {
  const used = new Set<string>();
  return (doc: Doc, fallback: string) => {
    const base = slugify(doc.slug?.current || fallback) || doc._id.slice(0, 8).toLowerCase();
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    if (slug !== doc.slug?.current) warn(`${kind} "${fallback}" gets the link "${slug}" (was "${doc.slug?.current || "empty"}").`);
    used.add(slug);
    return slug;
  };
}

const num = (v: unknown) => (v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
const int = (v: unknown, fallback = 0) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : fallback);
const str = (v: unknown) => (v === null || v === undefined ? null : String(v));
const ts = (v: unknown, fallback?: unknown) => {
  const d = new Date(String(v || fallback || ""));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

async function upsert(table: string, rows: Doc[], onConflict = "id") {
  console.log(`${table}: ${rows.length}`);
  if (DRY || !rows.length) return;
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + 200), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

// ───────────────────────── Import ─────────────────────────

async function main() {
  console.log(DRY ? "DRY RUN: nothing will be written.\n" : KEEP_CDN ? "Importing data (images stay on Sanity's CDN)…\n" : "Importing data and copying images…\n");

  // Categories
  const categorySlug = slugger("Category");
  const categories = await fetchType("category");
  await upsert(
    "categories",
    categories.map((c) => ({
      id: c._id,
      title: c.title || "Untitled",
      slug: categorySlug(c, c.title || "category"),
      composition_care: blocksToText(c.compositionCare),
      size_fit: blocksToText(c.sizeFit),
      created_at: c._createdAt,
    }))
  );
  const categoryIds = new Set(categories.map((c) => c._id));

  // Prints
  const prints = await fetchType("print", `{..., "imageAsset": image${ASSET}}`);
  const printRows: Doc[] = [];
  for (const p of prints) {
    printRows.push({
      id: p._id,
      name: p.name || "Untitled print",
      image_url: await moveAsset(p.imageAsset),
      stock_quantity: int(p.stockQuantity),
      low_stock_threshold: int(p.lowStockThreshold, 2),
      is_active: p.isActive !== false,
      created_at: p._createdAt,
    });
  }
  await upsert("prints", printRows);
  const printIds = new Set(prints.map((p) => p._id));

  // Products
  const productSlug = slugger("Product");
  const products = await fetchType("product", `{..., "imageAssets": images[]${ASSET}, "categoryId": category._ref, "printIds": prints[]._ref}`);
  const productRows: Doc[] = [];
  const productPrintRows: Doc[] = [];
  for (const p of products) {
    productRows.push({
      id: p._id,
      name: p.name || "Untitled",
      slug: productSlug(p, p.name || "product"),
      brief_description: str(p.briefDescription),
      product_type: p.productType === "bespoke" ? "bespoke" : "ready-to-wear",
      category_id: categoryIds.has(p.categoryId) ? p.categoryId : null,
      images: await moveAll(p.imageAssets),
      price_ngn: num(p.priceNGN),
      compare_at_price: num(p.compareAtPrice),
      production_time: str(p.productionTime),
      description: blocksToText(p.description),
      is_published: true,
      created_at: p._createdAt,
    });
    [...new Set<string>((p.printIds || []).filter((id: string) => printIds.has(id)))].forEach((print_id, position) =>
      productPrintRows.push({ product_id: p._id, print_id, position })
    );
  }
  await upsert("products", productRows);
  await upsert("product_prints", productPrintRows, "product_id,print_id");
  const productIds = new Set(products.map((p) => p._id));

  // Discount codes
  const seenCodes = new Set<string>();
  const coupons = (await fetchType("coupon")).filter((c) => {
    const code = String(c.code || "").trim().toUpperCase();
    if (!code || seenCodes.has(code)) {
      warn(`Skipped a discount code with ${code ? `a duplicate code (${code})` : "no code"}.`);
      return false;
    }
    seenCodes.add(code);
    return true;
  });
  await upsert(
    "coupons",
    coupons.map((c) => ({
      id: c._id,
      code: String(c.code).trim().toUpperCase(),
      discount_type: c.discountType === "fixed" ? "fixed" : "percentage",
      discount_value: num(c.discountValue) ?? 0,
      is_active: c.isActive !== false,
      first_order_only: !!c.firstOrderOnly,
      expiry_date: ts(c.expiryDate),
      assigned_email: str(c.assignedEmail)?.trim().toLowerCase() || null,
      usage_limit: num(c.usageLimit) && Number(c.usageLimit) >= 1 ? Math.round(Number(c.usageLimit)) : null,
      times_used: int(c.timesUsed),
      purpose: str(c.purpose),
      created_at: c._createdAt,
    }))
  );

  // Reviews
  const reviews = (await fetchType("review", `{..., "productId": product._ref}`)).filter((r) => {
    if (productIds.has(r.productId)) return true;
    warn(`Skipped a review by ${r.name || "someone"}: its product no longer exists.`);
    return false;
  });
  await upsert(
    "reviews",
    reviews.map((r) => ({
      id: r._id,
      product_id: r.productId,
      name: r.name || "Customer",
      rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
      title: str(r.title),
      comment: r.comment || "",
      approved: !!r.approved,
      created_at: r._createdAt,
    }))
  );

  // Orders
  const STATUSES = ["received", "in_production", "ready", "shipped", "out_for_delivery", "delivered", "cancelled"];
  const orders = await fetchType("order");
  await upsert(
    "orders",
    orders.map((o) => {
      const status = STATUSES.includes(o.status) ? o.status : null;
      return {
        id: o._id,
        order_number: o.orderNumber || o.paymentReference || o._id,
        status,
        courier: str(o.courier),
        tracking_number: str(o.trackingNumber),
        tracking_url: str(o.trackingUrl),
        status_note: str(o.statusNote),
        // An order whose status was never emailed about stays quiet after the move
        status_emailed_for: status ? o.statusEmailedFor ?? status : null,
        status_history: (o.statusHistory || []).filter((h: Doc) => h?.status).map((h: Doc) => ({ status: h.status, at: ts(h.at, o._createdAt), ...(h.note ? { note: h.note } : {}) })),
        delivered: !!o.delivered,
        delivered_at: ts(o.deliveredAt),
        review_request_sent_at: ts(o.reviewRequestSentAt),
        receipt_sent_at: ts(o.receiptSentAt),
        customer_name: str(o.customerName),
        customer_email: str(o.customerEmail)?.trim() || null,
        customer_phone: str(o.customerPhone),
        shipping_address: str(o.shippingAddress),
        shipping_method: str(o.shippingMethod),
        items: (o.items || []).map((i: Doc) => ({
          productId: i.product?._ref || undefined,
          name: i.name || "Item",
          price: num(i.price) ?? undefined,
          quantity: num(i.quantity) ?? 1,
          size: i.size || undefined,
          selectedPrintName: i.selectedPrintName || "",
          heightLength: i.heightLength || "",
          gender: i.gender || "",
          notes: i.notes || "",
        })),
        currency: o.currency || "NGN",
        subtotal: num(o.subtotal),
        shipping_fee: num(o.shippingFee),
        discount_code: str(o.discountCode),
        discount_amount: num(o.discountAmount),
        total_amount: num(o.totalAmount),
        amount_paid: num(o.amountPaid),
        display_currency: str(o.displayCurrency),
        display_total: num(o.displayTotal),
        payment_reference: str(o.paymentReference),
        // Orders from before payment checks existed were only ever saved after paying
        payment_verified: o.paymentVerified !== false,
        verification_note: str(o.verificationNote),
        is_gift: !!o.isGift,
        gift_recipient: str(o.giftRecipient),
        gift_deliver_to_owner: typeof o.giftDeliverToOwner === "boolean" ? o.giftDeliverToOwner : null,
        gift_message: str(o.giftMessage),
        gift_list_id: str(o.giftListId),
        email_opt_in: !!o.emailOptIn,
        text_opt_in: !!o.textOptIn,
        created_at: ts(o.createdAt, o._createdAt),
      };
    })
  );

  // Events
  const eventSlug = slugger("Event");
  const events = await fetchType(
    "event",
    `{..., "flyerAsset": flyer${ASSET}, "galleryAssets": gallery[]{ caption, "asset": @${ASSET} }, "videoAssets": videoFiles[]{ caption, "asset": @${ASSET} }, "featuredIds": featuredProducts[]._ref}`
  );
  const eventRows: Doc[] = [];
  for (const e of events) {
    const start = ts(e.startDate, e._createdAt);
    const gallery: Doc[] = [];
    for (const g of e.galleryAssets || []) {
      const url = await moveAsset(g?.asset);
      if (url) gallery.push({ url, width: g.asset.width, height: g.asset.height, caption: g.caption || undefined });
    }
    const videoFiles: Doc[] = [];
    for (const v of e.videoAssets || []) {
      const url = await moveAsset(v?.asset);
      if (url) videoFiles.push({ url, mimeType: v.asset.mime, caption: v.caption || undefined });
    }
    eventRows.push({
      id: e._id,
      title: e.title || "Untitled event",
      slug: eventSlug(e, e.title || "event"),
      tagline: str(e.tagline),
      start_date: start,
      end_date: ts(e.endDate, start),
      venue_name: str(e.venueName),
      venue_address: str(e.venueAddress),
      map_link: str(e.mapLink),
      flyer_url: await moveAsset(e.flyerAsset),
      description: blocksToText(e.description),
      capacity: num(e.capacity),
      max_guests: int(e.maxGuests, 1),
      rsvp_open: e.rsvpOpen !== false,
      show_popup: !!e.showPopup,
      theme: "default",
      gallery,
      videos: (e.videos || []).filter(Boolean),
      video_files: videoFiles,
      recap: blocksToText(e.recap),
      featured_product_ids: (e.featuredIds || []).filter((id: string) => productIds.has(id)),
      follow_ups_enabled: !!e.followUpsEnabled,
      attendee_code: str(e.attendeeCode)?.trim().toUpperCase() || null,
      created_at: e._createdAt,
    });
  }
  await upsert("events", eventRows);
  const eventIds = new Set(events.map((e) => e._id));

  // RSVPs
  const rsvps = (await fetchType("rsvp", `{..., "eventId": event._ref}`)).filter((r) => {
    if (eventIds.has(r.eventId)) return true;
    warn(`Skipped an RSVP from ${r.email || r.name || "someone"}: its event no longer exists.`);
    return false;
  });
  await upsert(
    "rsvps",
    rsvps.map((r) => ({
      id: r._id,
      event_id: r.eventId,
      name: str(r.name),
      email: str(r.email)?.trim().toLowerCase() || null,
      phone: str(r.phone),
      guests: int(r.guests),
      source: str(r.source),
      marketing_opt_in: !!r.marketingOptIn,
      ticket_code: str(r.ticketCode),
      checked_in: !!r.checkedIn,
      checked_in_at: ts(r.checkedInAt),
      reminder48_sent_at: ts(r.reminder48SentAt),
      reminder24_sent_at: ts(r.reminder24SentAt),
      follow_up_sent_at: ts(r.followUpSentAt),
      follow_up_type: str(r.followUpType),
      created_at: ts(r.createdAt, r._createdAt),
    }))
  );

  // Shared lists
  const lists = (await fetchType("sharedList")).filter((l) => l.publicId);
  await upsert(
    "shared_lists",
    lists.map((l) => ({
      id: l._id,
      kind: l.kind === "cart" ? "cart" : "wishlist",
      public_id: l.publicId,
      message: str(l.message),
      keep_surprise: l.keepSurprise !== false,
      active: l.active !== false,
      items: (l.items || []).map((i: Doc) => ({
        key: i._key,
        productId: i.product?._ref || "",
        productName: i.productName,
        size: i.size,
        selectedPrintId: i.selectedPrintId,
        selectedPrintName: i.selectedPrintName,
        heightLength: i.heightLength,
        gender: i.gender,
        notes: i.notes,
        quantity: num(i.quantity) ?? 1,
        purchased: !!i.purchased,
        purchasedAt: i.purchasedAt,
        purchasedBy: i.purchasedBy,
        orderReference: i.orderReference,
      })),
      owner_name: str(l.ownerName),
      owner_email: str(l.ownerEmail)?.trim().toLowerCase() || null,
      edit_token_hash: str(l.editTokenHash),
      delivery_address: l.deliveryAddress || null,
      created_at: ts(l.createdAt, l._createdAt),
      updated_at: ts(l.updatedAt, l._updatedAt),
    }))
  );

  // Marketing
  const [settingsDoc] = await fetchType("marketingSettings");
  if (settingsDoc) {
    const settings = Object.fromEntries(Object.entries(settingsDoc).filter(([k, v]) => !k.startsWith("_") && (typeof v === "boolean" || typeof v === "number")));
    await upsert("marketing_settings", [{ id: 1, settings }]);
  }

  const alerts = await fetchType("stockAlert", `{..., "productId": product._ref, "printId": print._ref}`);
  await upsert(
    "stock_alerts",
    alerts
      .filter((a) => a.email && printIds.has(a.printId))
      .map((a) => ({
        id: a._id,
        email: String(a.email).trim().toLowerCase(),
        product_id: productIds.has(a.productId) ? a.productId : null,
        print_id: a.printId,
        created_at: ts(a.createdAt, a._createdAt),
        notified_at: ts(a.notifiedAt),
      }))
  );

  const log = await fetchType("marketingLog");
  await upsert(
    "marketing_log",
    log
      .filter((l) => l.email)
      .map((l) => ({ id: l._id, email: String(l.email).trim().toLowerCase(), kind: str(l.kind), key: str(l.key), coupon_code: str(l.couponCode), sent_at: ts(l.sentAt, l._createdAt) }))
  );

  const optOuts = new Map<string, Doc>();
  for (const o of await fetchType("marketingOptOut")) {
    const email = String(o.email || "").trim().toLowerCase();
    if (email && !optOuts.has(email)) optOuts.set(email, { email, created_at: ts(o.createdAt, o._createdAt) });
  }
  await upsert("marketing_opt_outs", [...optOuts.values()], "email");

  const carts = await fetchType("abandonedCart");
  await upsert(
    "abandoned_carts",
    carts
      .filter((c) => c.email)
      .map((c) => ({
        id: c._id,
        email: String(c.email).trim().toLowerCase(),
        name: str(c.name),
        subtotal: num(c.subtotal),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        items: (c.items || []).map(({ _key, _type, ...item }: Doc) => item),
        created_at: ts(c.createdAt, c._createdAt),
        updated_at: ts(c.updatedAt, c._updatedAt),
        reminder_sent_at: ts(c.reminderSentAt),
        recovered_at: ts(c.recoveredAt),
      }))
  );

  const browse = await fetchType("browseActivity");
  await upsert(
    "browse_activity",
    browse
      .filter((b) => b.email)
      .map((b) => ({
        id: b._id,
        email: String(b.email).trim().toLowerCase(),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        views: (b.views || []).map(({ _key, _type, ...view }: Doc) => view),
        last_viewed_at: ts(b.lastViewedAt),
        last_engaged_at: ts(b.lastEngagedAt),
        sequence_started_at: ts(b.sequenceStartedAt, b._createdAt),
        step: int(b.step),
        last_step_at: ts(b.lastStepAt),
        converted_at: ts(b.convertedAt),
      }))
  );

  console.log(`\n${DRY ? "Dry run finished." : "Import finished."}${copied.size ? ` ${copied.size} images and files copied.` : ""}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} thing${warnings.length === 1 ? "" : "s"} to check:`);
    warnings.forEach((w) => console.log(` - ${w}`));
  }
}

main().catch((err) => {
  console.error("\nImport stopped:", err instanceof Error ? err.message : err);
  process.exit(1);
});
