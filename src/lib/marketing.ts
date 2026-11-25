// Server-only marketing helpers: settings, unsubscribes, a send log so nobody
// gets the same email twice, personal one-off codes and Brevo contact sync.
import { COUNT, countRows, db, lc, isSupabaseConfigured, unwrap } from "@/src/lib/supabase/admin";
import { imageUrl } from "@/src/lib/images";
import { hmac, randomId, safeEqual } from "@/src/lib/signing";
import { SITE_URL } from "@/src/lib/events";
import { esc, sendMail } from "@/src/lib/mailer";
import { blacklistContact, upsertContact } from "@/src/lib/brevo";

export type MarketingSettings = {
  birthdayEnabled: boolean;
  birthdayDiscount: number;
  anniversaryEnabled: boolean;
  anniversaryDiscount: number;
  codeValidDays: number;
  reviewRequestsEnabled: boolean;
  reviewRequestDelayDays: number;
  backInStockEnabled: boolean;
  receiptsEnabled: boolean;
  shippingEmailsEnabled: boolean;
  abandonedCartEnabled: boolean;
  abandonedCartDiscount: number;
  browseEnabled: boolean;
  browseDiscount: number;
};

export const MARKETING_DEFAULTS: MarketingSettings = {
  birthdayEnabled: true,
  birthdayDiscount: 15,
  anniversaryEnabled: true,
  anniversaryDiscount: 10,
  codeValidDays: 30,
  reviewRequestsEnabled: true,
  reviewRequestDelayDays: 5,
  backInStockEnabled: true,
  receiptsEnabled: true,
  shippingEmailsEnabled: true,
  abandonedCartEnabled: true,
  abandonedCartDiscount: 0,
  browseEnabled: true,
  browseDiscount: 10,
};

export async function getMarketingSettings(): Promise<MarketingSettings> {
  const merged = { ...MARKETING_DEFAULTS };
  if (!isSupabaseConfigured()) return merged;
  const row = unwrap(
    await db().from("marketing_settings").select("settings").eq("id", 1).maybeSingle(),
    "Loading marketing settings"
  ) as { settings: Partial<MarketingSettings> | null } | null;
  const doc = row?.settings;
  for (const key of Object.keys(MARKETING_DEFAULTS) as (keyof MarketingSettings)[]) {
    const v = doc?.[key];
    if (v !== undefined && v !== null) (merged as Record<string, unknown>)[key] = v;
  }
  return merged;
}

export const normEmail = (email: string) => String(email || "").trim().toLowerCase();

// ---- Unsubscribe ----
export function unsubscribeToken(email: string) {
  return hmac(`unsubscribe|${normEmail(email)}`).slice(0, 32);
}
export function unsubscribeUrl(email: string) {
  return `${SITE_URL}/unsubscribe?e=${encodeURIComponent(normEmail(email))}&t=${unsubscribeToken(email)}`;
}
export function verifyUnsubscribeToken(email: string, token: string) {
  return safeEqual(unsubscribeToken(email), String(token || ""));
}

export async function isOptedOut(email: string) {
  return (await countRows(db().from("marketing_opt_outs").select("*", COUNT).eq("email", normEmail(email)))) > 0;
}

export async function optOut(email: string) {
  const e = normEmail(email);
  if (e) {
    unwrap(
      await db().from("marketing_opt_outs").upsert({ email: e }, { onConflict: "email", ignoreDuplicates: true }),
      "Saving the unsubscribe"
    );
  }
  await blacklistContact(e);
}

/** Someone signing up again is a fresh opt-in. */
export async function optBackIn(email: string) {
  unwrap(await db().from("marketing_opt_outs").delete().eq("email", normEmail(email)), "Removing the unsubscribe");
}

/** "YYYY-MM" or "--MM" (month only) → { month, year } */
export function parseBirthday(value?: string) {
  const m = String(value || "").match(/^(\d{4}|-)-(\d{1,2})$/);
  if (!m) return {};
  const month = Number(m[2]);
  const year = m[1] === "-" ? undefined : Number(m[1]);
  return month >= 1 && month <= 12 ? { month, year } : {};
}

// ---- Send log ----
export async function alreadySent(email: string, key: string) {
  return (await countRows(db().from("marketing_log").select("*", COUNT).eq("email", normEmail(email)).eq("key", key))) > 0;
}

/** How many marketing emails this person has been sent since `since`. */
export async function sentSince(email: string, since: Date) {
  return countRows(
    db().from("marketing_log").select("*", COUNT).eq("email", normEmail(email)).gt("sent_at", since.toISOString())
  );
}

async function logSent(email: string, kind: string, key: string | undefined, couponCode?: string) {
  unwrap(
    await db().from("marketing_log").insert({
      email: normEmail(email),
      kind,
      key: key || `${kind}-${Date.now()}`,
      coupon_code: couponCode || null,
    }),
    "Logging the email"
  );
}

// ---- Personal codes ----
export async function createPersonalCoupon(opts: { email: string; percent: number; days: number; prefix: string; purpose: string }) {
  const code = `${opts.prefix}-${randomId(6).toUpperCase()}`;
  unwrap(
    await db().from("coupons").insert({
      code,
      discount_type: "percentage",
      discount_value: opts.percent,
      is_active: true,
      assigned_email: normEmail(opts.email),
      usage_limit: 1,
      times_used: 0,
      expiry_date: new Date(Date.now() + opts.days * 86_400_000).toISOString(),
      purpose: opts.purpose,
    }),
    "Creating a personal code"
  );
  return code;
}

// ---- Email layout ----
export type EmailProduct = { name: string; slug?: string; image?: string; priceNGN?: number; note?: string };

export function productCardsHtml(products: EmailProduct[], heading?: string) {
  const list = products.slice(0, 4);
  if (!list.length) return "";
  const width = Math.floor(100 / list.length);
  return `
    ${heading ? `<p style="margin:28px 0 10px;font-size:11px;letter-spacing:3px;color:#8a8170;text-align:center;">${esc(heading)}</p>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
    ${list
      .map(
        (p) => `<td width="${width}%" style="padding:4px;vertical-align:top;text-align:center;">
          <a href="${esc(p.slug ? `${SITE_URL}/product/${p.slug}` : SITE_URL)}" style="text-decoration:none;color:#1a1a1a;">
            ${p.image ? `<img src="${esc(imageUrl(p.image, { width: 240, height: 300 }))}" width="120" alt="${esc(p.name)}" style="display:block;width:100%;height:auto;border:0;">` : ""}
            <span style="display:block;font-size:12px;margin-top:6px;">${esc(p.name)}</span>
            ${p.note ? `<span style="display:block;font-size:11px;color:#8a8170;">${esc(p.note)}</span>` : ""}
          </a></td>`
      )
      .join("")}
    </tr></table>`;
}

export function codeBoxHtml(code: string, line: string) {
  return `<div style="margin:24px 0;padding:18px;border:1px dashed #778472;text-align:center;background:#F6F4EF;">
    <p style="margin:0;font-family:Georgia,serif;font-size:26px;letter-spacing:4px;">${esc(code)}</p>
    <p style="margin:6px 0 0;font-size:12px;color:#666;">${esc(line)}</p>
  </div>`;
}

export function buttonHtml(href: string, label: string) {
  return `<p style="text-align:center;margin:26px 0 8px;"><a href="${esc(href)}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:13px 24px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${esc(label)}</a></p>`;
}

export function marketingShell(opts: { title: string; body: string; email: string; image?: string; reason: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e8e3d9;">
      <tr><td style="padding:22px 32px 0;text-align:center;font-size:11px;letter-spacing:5px;color:#8a8170;">DAHRIOLA</td></tr>
      ${opts.image ? `<tr><td style="padding-top:18px;"><img src="${esc(imageUrl(opts.image, { width: 1120, height: 640 }))}" width="560" alt="" style="display:block;width:100%;height:auto;border:0;"></td></tr>` : ""}
      <tr><td style="padding:26px 32px 8px;">
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 16px;text-align:center;">${esc(opts.title)}</h1>
        <div style="font-size:15px;line-height:1.65;">${opts.body}</div>
      </td></tr>
      <tr><td style="padding:22px 32px 28px;font-size:11px;color:#9a9284;text-align:center;line-height:1.6;">
        ${esc(opts.reason)}<br>
        <a href="${esc(unsubscribeUrl(opts.email))}" style="color:#9a9284;">Unsubscribe from marketing emails</a> · <a href="${SITE_URL}" style="color:#9a9284;">dahriola.com</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

/**
 * Sends a marketing email unless the person has unsubscribed or (when `key`
 * is given) has already had this one. Goes through Brevo when it's set up,
 * otherwise through the store's Gmail.
 */
export async function sendMarketingEmail(opts: {
  to: string;
  name?: string;
  subject: string;
  html: string;
  kind: string;
  key?: string;
  couponCode?: string;
}) {
  const email = normEmail(opts.to);
  if (!email) return { sent: false, reason: "no email" };
  if (await isOptedOut(email)) return { sent: false, reason: "unsubscribed" };
  if (opts.key && (await alreadySent(email, opts.key))) return { sent: false, reason: "already sent" };

  const ok = await sendMail({ tag: opts.kind, to: email, toName: opts.name, subject: opts.subject, html: opts.html });
  if (ok) await logSent(email, opts.kind, opts.key, opts.couponCode);
  return { sent: ok, reason: ok ? undefined : "send failed" };
}

// ---- Customer sync (Brevo) ----
type OrderStat = { createdAt?: string; totalAmount?: number; emailOptIn?: boolean; customerName?: string };

/** Recalculates a customer's order stats and updates Brevo — only if they opted in. */
export async function syncCustomerToBrevo(email: string) {
  const e = normEmail(email);
  if (!e) return;
  const orders = unwrap(
    await db()
      .from("orders")
      .select("createdAt:created_at, totalAmount:total_amount, emailOptIn:email_opt_in, customerName:customer_name")
      .eq("customer_email_lc", lc(e))
      .eq("payment_verified", true)
      .order("created_at", { ascending: true }),
    "Loading customer orders"
  ) as OrderStat[];
  if (!orders.some((o) => o.emailOptIn) || (await isOptedOut(e))) return;

  const total = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const name = (orders[orders.length - 1]?.customerName || "").trim().split(/\s+/);
  await upsertContact(
    e,
    {
      FIRSTNAME: name[0] || undefined,
      LASTNAME: name.slice(1).join(" ") || undefined,
      FIRST_ORDER_DATE: orders[0]?.createdAt?.slice(0, 10),
      LAST_ORDER_DATE: orders[orders.length - 1]?.createdAt?.slice(0, 10),
      ORDER_COUNT: orders.length,
      TOTAL_SPENT: Math.round(total),
      VIP: orders.length >= 3 || total >= 500_000,
    },
    ["CUSTOMERS"]
  );
}
