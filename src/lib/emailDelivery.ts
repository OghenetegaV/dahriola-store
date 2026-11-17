// Server-only: the ONE place every email leaves the website.
//
// All emails go through Brevo so they appear in Brevo's reports (delivered,
// opened, clicked, bounced), tagged by type — e.g. "order-receipt",
// "rsvp-confirmation". Links to dahriola.com get UTM tags so Google Analytics
// shows which emails bring visits and sales.
//
// If Brevo isn't configured or fails, the email falls back to the store Gmail
// so customers still get it (logged as EMAIL_FALLBACK).
import nodemailer from "nodemailer";
import { identityToken } from "@/src/lib/identity";

export type EmailAttachment = {
  filename: string;
  content: Buffer | string; // Buffer or base64 string
  contentType?: string;
};

export type DeliverOptions = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  /** Email type, used for Brevo reporting and UTM campaign, e.g. "order-receipt" */
  tag: string;
  replyTo?: string;
  fromName?: string;
  attachments?: EmailAttachment[];
  /** Skip UTM tagging (e.g. internal store notifications) */
  noUtm?: boolean;
};

export type DeliverResult = { ok: boolean; via: "brevo" | "gmail" | "none"; error?: string };

const SITE_HOSTS = ["dahriola.com", "www.dahriola.com"];

/** Adds utm_source/medium/campaign to every link that points at dahriola.com. */
export function addUtm(html: string, campaign: string, visitorId?: string) {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url: string) => {
    try {
      const u = new URL(url.replace(/&amp;/g, "&"));
      if (!SITE_HOSTS.includes(u.hostname) || u.searchParams.has("utm_source")) return match;
      // keep unsubscribe/track/restore links clean of marketing params? They work either way.
      u.searchParams.set("utm_source", "brevo");
      u.searchParams.set("utm_medium", "email");
      u.searchParams.set("utm_campaign", campaign);
      if (visitorId && !u.searchParams.has("did")) u.searchParams.set("did", visitorId);
      return `href="${u.toString().replace(/&/g, "&amp;")}"`;
    } catch {
      return match;
    }
  });
}

const toBase64 = (c: Buffer | string) => (Buffer.isBuffer(c) ? c.toString("base64") : c);

async function viaBrevo(opts: DeliverOptions, html: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.BREVO_API_KEY;
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!key || !sender) return { ok: false, error: "Brevo not configured" };
  const replyTo = opts.replyTo || process.env.BREVO_REPLY_TO;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: sender, name: opts.fromName || "DAHRIOLA" },
        to: [{ email: opts.to, ...(opts.toName ? { name: opts.toName } : {}) }],
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        subject: opts.subject,
        htmlContent: html,
        tags: [opts.tag],
        ...(opts.attachments?.length
          ? { attachment: opts.attachments.map((a) => ({ name: a.filename, content: toBase64(a.content) })) }
          : {}),
      }),
      cache: "no-store",
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `Brevo ${res.status}: ${(await res.text()).slice(0, 300)}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Brevo request failed" };
  }
}

async function viaGmail(opts: DeliverOptions, html: string): Promise<{ ok: boolean; error?: string }> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!user || !pass) return { ok: false, error: "Gmail not configured" };
  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({
      from: `"${opts.fromName || "DAHRIOLA"}" <${user}>`,
      to: opts.toName ? `"${opts.toName.replace(/"/g, "")}" <${opts.to}>` : opts.to,
      replyTo: opts.replyTo || process.env.BREVO_REPLY_TO || undefined,
      subject: opts.subject,
      html,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content, "base64"),
        contentType: a.contentType,
      })),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Gmail send failed" };
  }
}

export async function deliverEmail(opts: DeliverOptions): Promise<DeliverResult> {
  if (!opts.to) return { ok: false, via: "none", error: "No recipient" };
  const html = opts.noUtm ? opts.html : addUtm(opts.html, opts.tag, identityToken(opts.to));

  const brevo = await viaBrevo(opts, html);
  if (brevo.ok) return { ok: true, via: "brevo" };

  const gmail = await viaGmail(opts, html);
  if (gmail.ok) {
    if (process.env.BREVO_API_KEY) {
      console.warn(`EMAIL_FALLBACK [${opts.tag}] sent via Gmail because Brevo failed: ${brevo.error}`);
    }
    return { ok: true, via: "gmail" };
  }
  console.error(`EMAIL_FAILED [${opts.tag}] to ${opts.to}: brevo=${brevo.error} | gmail=${gmail.error}`);
  return { ok: false, via: "none", error: gmail.error || brevo.error };
}
