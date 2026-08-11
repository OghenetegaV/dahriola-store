// src/app/actions/bespoke.ts
// Emails a bespoke enquiry (all form fields + optional inspiration image) to the
// store inbox. Reuses the same Gmail/Nodemailer setup as the order emails, so no
// new credentials are needed (GMAIL_USER / GMAIL_PASS).

"use server";

import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing from environment variables.`);
  return value;
}

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: requireEnv("GMAIL_USER"),
      pass: requireEnv("GMAIL_PASS"),
    },
  });
}

function getStoreEmail() {
  return process.env.STORE_NOTIFICATION_EMAIL?.trim() || "info.dahriola@gmail.com";
}

function escapeHtml(value: any) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type BespokeEnquiryInput = {
  clientName: string;
  email: string;
  phone?: string;
  service: string;
  vision?: string;
  isBulk: boolean;
  // Optional inspiration image, passed from the browser as base64.
  image?: {
    filename: string;
    contentBase64: string; // raw base64 (no data: prefix)
    contentType: string;
  } | null;
};

export async function sendBespokeEnquiry(
  input: BespokeEnquiryInput,
): Promise<{ success: boolean; message?: string }> {
  try {
    const transporter = getTransporter();
    const senderEmail = requireEnv("GMAIL_USER");
    const storeEmail = getStoreEmail();

    await transporter.verify();

    const now = new Date().toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const rows: { label: string; value: string }[] = [
      { label: "Client Name", value: input.clientName || "—" },
      { label: "Email", value: input.email || "—" },
      { label: "Phone", value: input.phone || "—" },
      { label: "Service Interest", value: input.service || "—" },
      { label: "Bulk Order", value: input.isBulk ? "Yes" : "No" },
    ];

    const rowsHtml = rows
      .map(
        (r) => `
        <tr>
          <td style="padding:8px 0;color:#888;font-size:13px;width:150px;vertical-align:top;">${escapeHtml(r.label)}</td>
          <td style="padding:8px 0;color:#111;font-size:14px;font-weight:600;">${escapeHtml(r.value)}</td>
        </tr>`,
      )
      .join("");

    const visionHtml = input.vision
      ? `
        <div style="margin-top:18px;">
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin-bottom:6px;">Their Vision</div>
          <div style="font-size:14px;color:#111;line-height:1.7;background:#f7f7f5;border-radius:8px;padding:14px 16px;white-space:pre-wrap;">${escapeHtml(input.vision)}</div>
        </div>`
      : "";

    const attachments = input.image
      ? [
          {
            filename: input.image.filename || "inspiration.jpg",
            content: Buffer.from(input.image.contentBase64, "base64"),
            contentType: input.image.contentType || "image/jpeg",
          },
        ]
      : [];

    const imageNote = input.image
      ? `<div style="font-size:13px;color:#256b2e;margin-top:14px;">📎 Inspiration image attached: ${escapeHtml(input.image.filename)}</div>`
      : `<div style="font-size:13px;color:#999;margin-top:14px;">No inspiration image was uploaded.</div>`;

    const mailOptions = {
      from: `"Dahriola Bespoke" <${senderEmail}>`,
      to: storeEmail,
      replyTo: input.email || senderEmail, // reply goes straight to the customer
      subject: `New Bespoke Enquiry — ${escapeHtml(input.clientName)}${input.isBulk ? " (Bulk)" : ""}`,
      attachments,
      html: `
      <div style="background:#f4f4f2;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <div style="background:#111;padding:26px 32px;">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#bbb;">Dahriola</div>
            <div style="font-size:22px;color:#ffffff;font-weight:700;margin-top:6px;">New Bespoke Enquiry</div>
            <div style="font-size:13px;color:#bbb;margin-top:6px;">${escapeHtml(now)}</div>
          </div>

          <div style="padding:24px 32px 28px;">
            <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
            ${visionHtml}
            ${imageNote}
          </div>

          <div style="background:#faf9f7;padding:16px 32px;text-align:center;">
            <div style="font-size:12px;color:#999;">Reply to this email to respond directly to ${escapeHtml(input.clientName || "the client")}.</div>
          </div>

        </div>
      </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Bespoke enquiry email sent:", { messageId: info.messageId, to: storeEmail });
    return { success: true };
  } catch (error: any) {
    console.error("Bespoke Enquiry Email Error:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      response: error?.response,
    });
    return { success: false, message: error?.message || "Enquiry email failed." };
  }
}
