// Server-only email helpers for gifting. Kept out of the "use server" actions
// file so they can't be called directly from a browser to send emails.
import nodemailer from "nodemailer";
import { type EventRecap, SITE_URL, eventUrl, formatEventDateRange } from "@/src/lib/events";

export function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) {
    console.error("sendMail: GMAIL_USER / GMAIL_PASS not set");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({ from: `"DAHRIOLA" <${user}>`, ...opts });
    return true;
  } catch (err) {
    console.error("sendMail failed:", err);
    return false;
  }
}

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f4ef;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f4ef;padding:32px 12px;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e8e3d9;">
      <tr><td style="padding:28px 32px 8px;text-align:center;">
        <div style="font-size:11px;letter-spacing:4px;color:#8a8170;">DAHRIOLA</div>
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:14px 0 0;">${title}</h1>
      </td></tr>
      <tr><td style="padding:16px 32px 32px;font-size:14px;line-height:1.6;">${body}</td></tr>
    </table>
    <p style="font-size:11px;color:#9a9284;margin-top:16px;">${SITE_URL.replace("https://", "")}</p>
  </td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<a href="${esc(href)}" style="display:inline-block;background:#1a1a1a;color:#fff;text-decoration:none;padding:12px 22px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">${esc(label)}</a>`;
}

export async function sendListCreatedEmail(p: {
  to: string;
  ownerName: string;
  kind: "wishlist" | "cart";
  shareUrl: string;
  manageUrl: string;
}) {
  const what = p.kind === "cart" ? "cart" : "wishlist";
  const body = `
    <p>Hi ${esc(p.ownerName.split(" ")[0])},</p>
    <p>Your ${what} is ready to share. Anyone with this link can see your picks, with your sizes and options, and buy them for you:</p>
    <p style="text-align:center;margin:24px 0;">${button(p.shareUrl, `View my ${what}`)}</p>
    <p style="word-break:break-all;color:#555;font-size:13px;">${esc(p.shareUrl)}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
    <p style="font-size:13px;color:#555;"><strong>Keep this email.</strong> To edit your ${what}, change your delivery address or switch the link off, use your private link below. Don't share it.</p>
    <p style="text-align:center;margin:18px 0;">${button(p.manageUrl, `Manage my ${what}`)}</p>`;
  return sendMail({ to: p.to, subject: `Your DAHRIOLA ${what} is ready to share`, html: shell(`Your ${what} is ready to share`, body) });
}

export async function sendGiftReceivedEmail(p: {
  to: string;
  ownerName: string;
  buyerName: string;
  keepSurprise: boolean;
  itemNames: string[];
  giftMessage?: string;
  deliverToOwner: boolean;
}) {
  const first = esc(p.ownerName.split(" ")[0]);
  const from = esc(p.buyerName.split(" ")[0] || "Someone");
  const items = p.keepSurprise
    ? `<p>We won't spoil the surprise by saying what it is. 🤫</p>`
    : `<p>They chose:</p><ul>${p.itemNames.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
  const message = p.giftMessage
    ? `<blockquote style="margin:20px 0;padding:14px 18px;background:#F6F4EF;border-left:3px solid #778472;font-family:Georgia,serif;font-style:italic;">${esc(p.giftMessage)}</blockquote>`
    : "";
  const delivery = p.deliverToOwner
    ? `<p>It's being made and will be delivered to the address you saved. We'll be in touch about delivery.</p>`
    : `<p>${from} is arranging delivery.</p>`;
  const body = `<p>Hi ${first},</p><p><strong>${from}</strong> just sent you a gift from your DAHRIOLA list! 🎁</p>${items}${message}${delivery}`;
  return sendMail({ to: p.to, subject: `🎁 ${from} sent you a gift from DAHRIOLA`, html: shell("You've received a gift", body) });
}

// ---- Event follow-ups (sent by the daily cron once the owner switches them on) ----

export function buildEventFollowUpEmail(
  event: EventRecap,
  recipient: { name?: string; email: string },
  kind: "attended" | "missed"
) {
  const first = esc(String(recipient.name || "").trim().split(/\s+/)[0] || "there");
  const photo = event.gallery?.[0]?.url || event.flyerUrl;
  const hasPhotos = (event.gallery?.length || 0) > 0;
  const pageUrl = eventUrl(event.slug);
  const products = (event.featuredProducts || []).slice(0, 4);

  const productGrid = products.length
    ? `<p style="margin:28px 0 10px;font-size:11px;letter-spacing:3px;color:#8a8170;text-align:center;">SHOP THE LOOK</p>
       <table width="100%" cellpadding="0" cellspacing="0"><tr>
       ${products
         .map(
           (p) => `<td width="${Math.floor(100 / products.length)}%" style="padding:4px;vertical-align:top;text-align:center;">
             <a href="${esc(`${SITE_URL}/product/${p.slug}`)}" style="text-decoration:none;color:#1a1a1a;">
               ${p.image ? `<img src="${esc(p.image)}?w=240&h=300&fit=crop&auto=format" width="120" alt="${esc(p.name)}" style="display:block;width:100%;height:auto;border:0;">` : ""}
               <span style="display:block;font-size:12px;margin-top:6px;">${esc(p.name)}</span>
             </a></td>`
         )
         .join("")}
       </tr></table>`
    : "";

  const codeBox =
    kind === "attended" && event.attendeeCode
      ? `<div style="margin:24px 0;padding:18px;border:1px dashed #778472;text-align:center;background:#F6F4EF;">
           <p style="margin:0;font-size:11px;letter-spacing:3px;color:#8a8170;">A LITTLE THANK YOU</p>
           <p style="margin:8px 0 4px;font-family:Georgia,serif;font-size:26px;letter-spacing:4px;">${esc(event.attendeeCode)}</p>
           <p style="margin:0;font-size:12px;color:#666;">Use this code on your next order at dahriola.com</p>
         </div>`
      : "";

  const intro =
    kind === "attended"
      ? `<p>Hi ${first},</p>
         <p>Thank you for coming to <strong>${esc(event.title)}</strong>. Having you there made it special, and we loved celebrating with you.</p>
         ${hasPhotos ? `<p>The photos are up. See if you can spot yourself!</p>` : ""}`
      : `<p>Hi ${first},</p>
         <p>We missed you at <strong>${esc(event.title)}</strong>! We hope everything's well.</p>
         <p>${hasPhotos ? "Here's a look at what you missed. " : ""}Every piece from the pop-up is also available online, made to your size.</p>`;

  const cta = hasPhotos
    ? `<a href="${esc(`${pageUrl}#gallery`)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 24px;font-size:12px;letter-spacing:2px;">SEE THE PHOTOS</a>`
    : `<a href="${esc(`${SITE_URL}/category/all`)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 24px;font-size:12px;letter-spacing:2px;">SHOP THE COLLECTION</a>`;

  const html = `<!doctype html><html><body style="margin:0;background:#F6F4EF;font-family:Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border:1px solid #e8e3d9;">
      <tr><td style="background:#111;color:#fff;text-align:center;padding:12px 0;font-size:12px;letter-spacing:6px;">DAHRIOLA</td></tr>
      ${photo ? `<tr><td><img src="${esc(photo)}?w=1120&h=700&fit=crop&auto=format" alt="" width="560" style="display:block;width:100%;height:auto;border:0;"></td></tr>` : ""}
      <tr><td style="padding:28px 32px 8px;">
        <h1 style="font-family:Georgia,serif;font-weight:normal;font-size:26px;margin:0 0 6px;">${kind === "attended" ? "Thank you for coming" : "We missed you"}</h1>
        <p style="margin:0 0 18px;font-size:12px;letter-spacing:2px;color:#8a8170;">${esc(`${event.title} · ${formatEventDateRange(event, { weekday: false })}`.toUpperCase())}</p>
        <div style="font-size:15px;line-height:1.65;">${intro}</div>
        ${codeBox}
        <p style="text-align:center;margin:26px 0 8px;">${cta}</p>
        ${productGrid}
      </td></tr>
      <tr><td style="padding:20px 32px 28px;font-size:11px;color:#9a9284;text-align:center;">
        You're receiving this because you registered for ${esc(event.title)}.<br>
        <a href="${SITE_URL}" style="color:#9a9284;">dahriola.com</a>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  return {
    subject: kind === "attended" ? `Thank you for coming to ${event.title} ✨` : `We missed you at ${event.title}`,
    html,
  };
}

export async function sendEventFollowUpEmail(
  event: EventRecap,
  recipient: { name?: string; email: string },
  kind: "attended" | "missed"
) {
  const { subject, html } = buildEventFollowUpEmail(event, recipient, kind);
  return sendMail({ to: recipient.email, subject, html });
}

// ---- Customer receipt (transactional — always sent via the store Gmail) ----
export async function sendOrderReceiptEmail(p: {
  to: string;
  name: string;
  reference: string;
  items: { name: string; price: number; quantity: number; size?: string; selectedPrintName?: string; heightLength?: string; gender?: string }[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  shipping: number;
  shippingMethod?: string;
  total: number;
  deliverTo: string; // already safe to show to this person
  gift?: { recipientFirstName: string; message?: string };
  trackUrl?: string;
}) {
  const naira = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  const first = esc(p.name.trim().split(/\s+/)[0] || "there");
  const rows = p.items
    .map((i) => {
      const meta = [i.size && `Size ${i.size}`, i.selectedPrintName, i.gender && `${i.gender} fit`, i.heightLength && `Height/length ${i.heightLength}`]
        .filter(Boolean)
        .map((m) => esc(m))
        .join(" · ");
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;">${esc(i.name)}${i.quantity > 1 ? ` × ${i.quantity}` : ""}
          ${meta ? `<div style="font-size:12px;color:#777;margin-top:3px;">${meta}</div>` : ""}</td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;white-space:nowrap;">${naira(i.price * i.quantity)}</td>
      </tr>`;
    })
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:5px 0;font-size:14px;${bold ? "font-weight:bold;" : "color:#555;"}">${label}</td><td style="padding:5px 0;font-size:14px;text-align:right;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;

  const body = `
    <p>Hi ${first},</p>
    <p>${p.gift ? `Thank you for your gift for <strong>${esc(p.gift.recipientFirstName)}</strong>! 🎁` : "Thank you for shopping with DAHRIOLA!"} Your payment was received and your order is now with our team.</p>
    <p style="font-size:12px;letter-spacing:2px;color:#8a8170;margin-top:22px;">ORDER ${esc(p.reference.toUpperCase())}</p>
    <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
      ${line("Subtotal", naira(p.subtotal))}
      ${p.discount > 0 ? line(`Discount${p.discountCode ? ` (${esc(p.discountCode)})` : ""}`, `−${naira(p.discount)}`) : ""}
      ${line(`Shipping${p.shippingMethod ? ` · ${esc(p.shippingMethod)}` : ""}`, naira(p.shipping))}
      ${line("Total paid", naira(p.total), true)}
    </table>
    <p style="margin-top:22px;font-size:12px;letter-spacing:2px;color:#8a8170;">DELIVERY</p>
    <p style="margin-top:4px;">${esc(p.deliverTo)}</p>
    ${p.gift?.message ? `<p style="font-size:12px;letter-spacing:2px;color:#8a8170;margin-top:18px;">YOUR GIFT MESSAGE</p><p style="font-style:italic;">“${esc(p.gift.message)}”</p>` : ""}
    <p style="margin-top:22px;">Each piece is made with care. We'll email you as your order moves along. Questions? Just reply to this email.</p>
    ${p.trackUrl ? `<p style="text-align:center;margin:24px 0 6px;"><a href="${esc(p.trackUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 24px;font-size:12px;letter-spacing:2px;">TRACK YOUR ORDER</a></p>` : ""}`;

  return sendMail({
    to: p.to,
    subject: `Thank you for your order — ${p.reference.toUpperCase()}`,
    html: shell(p.gift ? "Thank you for your gift" : "Thank you for your order", body),
  });
}

// ---- Order status updates (transactional — store Gmail) ----
const STATUS_COPY: Record<string, { title: string; line: string }> = {
  in_production: { title: "Your order is being made", line: "Good news: our team has started making your order. Each piece is crafted with care, and we'll let you know as soon as it's ready." },
  ready: { title: "Your order is ready", line: "Your order is finished, checked and packed. It'll be handed to the courier shortly." },
  shipped: { title: "Your order is on its way", line: "Your order has left our studio and is on its way to you." },
  out_for_delivery: { title: "Arriving soon", line: "Your order is out for delivery. Please keep your phone close so the courier can reach you." },
  delivered: { title: "Your order has been delivered", line: "Your order has been delivered. We hope you love it! If anything isn't quite right, just reply to this email." },
  cancelled: { title: "Your order has been cancelled", line: "Your order has been cancelled. If you have any questions about this, please reply to this email and we'll help." },
};

export async function sendOrderStatusEmail(p: {
  to: string;
  name: string;
  reference: string;
  status: string;
  statusLabel: string;
  steps: { value: string; label: string }[];
  courier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
  trackUrl: string;
  items: { name: string; size?: string; quantity?: number }[];
  giftRecipient?: string;
}) {
  const copy = STATUS_COPY[p.status] || { title: p.statusLabel, line: `Your order status is now: ${p.statusLabel}.` };
  const first = esc(p.name.trim().split(/\s+/)[0] || "there");
  const current = p.steps.findIndex((s) => s.value === p.status);

  const progress =
    p.status === "cancelled" || current < 0
      ? ""
      : `<table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;"><tr>
          ${p.steps
            .map(
              (s, i) => `<td style="padding:0 2px;vertical-align:top;text-align:center;">
                <div style="height:4px;border-radius:2px;background:${i <= current ? "#778472" : "#e5e1da"};"></div>
                <div style="font-size:10px;line-height:1.3;margin-top:6px;color:${i === current ? "#1a1a1a" : "#9a958d"};${i === current ? "font-weight:bold;" : ""}">${esc(s.label)}</div>
              </td>`
            )
            .join("")}
        </tr></table>`;

  const shipping =
    p.courier || p.trackingNumber
      ? `<div style="margin:20px 0;padding:16px 18px;background:#F6F4EF;border:1px solid #e8e3d9;">
          ${p.courier ? `<p style="margin:0;font-size:13px;"><span style="color:#8a8170;">Courier:</span> ${esc(p.courier)}</p>` : ""}
          ${p.trackingNumber ? `<p style="margin:6px 0 0;font-size:13px;"><span style="color:#8a8170;">Tracking number:</span> <strong>${esc(p.trackingNumber)}</strong></p>` : ""}
          ${p.trackingUrl ? `<p style="margin:10px 0 0;font-size:13px;"><a href="${esc(p.trackingUrl)}" style="color:#1a1a1a;">Track with the courier →</a></p>` : ""}
        </div>`
      : "";

  const items = p.items.length
    ? `<p style="font-size:12px;letter-spacing:2px;color:#8a8170;margin-top:22px;">YOUR ORDER</p>
       <ul style="padding-left:18px;margin:6px 0;">${p.items
         .map((i) => `<li style="font-size:14px;margin:3px 0;">${esc(i.name)}${i.size ? ` · Size ${esc(i.size)}` : ""}${(i.quantity || 1) > 1 ? ` × ${i.quantity}` : ""}</li>`)
         .join("")}</ul>`
    : "";

  const body = `
    <p>Hi ${first},</p>
    <p>${copy.line}${p.giftRecipient ? ` (This is the gift for ${esc(p.giftRecipient.split(" ")[0])}.)` : ""}</p>
    ${p.note ? `<p style="padding:12px 16px;border-left:3px solid #778472;background:#F6F4EF;font-style:italic;">${esc(p.note)}</p>` : ""}
    ${progress}
    ${shipping}
    <p style="text-align:center;margin:26px 0 10px;"><a href="${esc(p.trackUrl)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 24px;font-size:12px;letter-spacing:2px;">TRACK YOUR ORDER</a></p>
    ${items}
    <p style="font-size:12px;color:#8a8170;margin-top:18px;">Order ${esc(p.reference.toUpperCase())}</p>`;

  return sendMail({ to: p.to, subject: `${copy.title} — ${p.reference.toUpperCase()}`, html: shell(copy.title, body) });
}
