// Server-only email helpers for gifting. Kept out of the "use server" actions
// file so they can't be called directly from a browser to send emails.
import nodemailer from "nodemailer";
import { SITE_URL } from "@/src/lib/events";

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
    ? `<blockquote style="margin:20px 0;padding:14px 18px;background:#faf6ee;border-left:3px solid #E8C77A;font-family:Georgia,serif;font-style:italic;">${esc(p.giftMessage)}</blockquote>`
    : "";
  const delivery = p.deliverToOwner
    ? `<p>It's being made and will be delivered to the address you saved. We'll be in touch about delivery.</p>`
    : `<p>${from} is arranging delivery.</p>`;
  const body = `<p>Hi ${first},</p><p><strong>${from}</strong> just sent you a gift from your DAHRIOLA list! 🎁</p>${items}${message}${delivery}`;
  return sendMail({ to: p.to, subject: `🎁 ${from} sent you a gift from DAHRIOLA`, html: shell("You've received a gift", body) });
}
