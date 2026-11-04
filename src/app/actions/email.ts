"use server";

import nodemailer from "nodemailer";
import QRCode from "qrcode";
import {
  type EventSummary,
  buildIcs,
  eventLocation,
  eventUrl,
  formatEventWhen,
  googleCalendarUrl,
  SITE_URL,
} from "@/src/lib/events";

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing from environment variables.`);
  }

  return value;
}

function getTransporter() {
  const gmailUser = requireEnv("GMAIL_USER");
  const gmailPass = requireEnv("GMAIL_PASS");

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

function getStoreEmail() {
  return (
    process.env.STORE_NOTIFICATION_EMAIL?.trim() || "info.dahriola@gmail.com"
  );
}

function getSenderEmail() {
  return requireEnv("GMAIL_USER");
}

function escapeHtml(value: any) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Format a currency amount consistently (₦ for NGN, otherwise the code).
function fmtMoney(currency: string, amount: number) {
  const symbol = String(currency).toUpperCase() === "NGN" ? "₦" : "";
  const code = symbol ? "" : `${escapeHtml(currency)} `;
  return `${code}${symbol}${Number(amount || 0).toLocaleString()}`;
}

export async function sendOrderNotification(orderData: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;        // NEW
  items: any[];
  totalAmount: number;
  currency: string;
  shippingAddress: string;
  subtotal?: number;             // NEW — for the price breakdown
  shippingFee?: number;          // NEW — the delivery cost
  shippingMethod?: string;       // NEW — e.g. "DHL Domestic Express (Lagos)"
  paymentReference?: string;     // NEW — Paystack reference, if different from order #
  paymentVerified?: boolean;     // NEW — verification flag for the client
  orderDate?: string;            // NEW — ISO date; defaults to now
  emailOptIn?: boolean;          // NEW — marketing consent (email)
  textOptIn?: boolean;           // NEW — marketing consent (SMS/text)
}) {
  try {
    const transporter = getTransporter();
    const senderEmail = getSenderEmail();
    const storeEmail = getStoreEmail();

    await transporter.verify();

    const currency = orderData.currency || "NGN";

    // ── Derive a safe subtotal + shipping if not explicitly provided ──
    const computedSubtotal =
      typeof orderData.subtotal === "number"
        ? orderData.subtotal
        : orderData.items.reduce(
            (sum, item) =>
              sum + Number(item.price || 0) * Number(item.quantity || 1),
            0
          );

    const shippingFee = Number(orderData.shippingFee || 0);

    // If a total wasn't passed, build it from the parts.
    const grandTotal =
      typeof orderData.totalAmount === "number" && orderData.totalAmount > 0
        ? orderData.totalAmount
        : computedSubtotal + shippingFee;

    const itemCount = orderData.items.reduce(
      (n, item) => n + Number(item.quantity || 1),
      0
    );

    const orderDate = orderData.orderDate
      ? new Date(orderData.orderDate)
      : new Date();
    const orderDateStr = orderDate.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const itemsHtml = orderData.items
      .map((item) => {
        const unit = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const itemTotal = unit * qty;

        const metaLines = [
          item.size ? `Size: ${escapeHtml(item.size)}` : "",
          item.selectedPrintName
            ? `Print: ${escapeHtml(item.selectedPrintName)}`
            : "",
          item.heightLength
            ? `Height / Length: ${escapeHtml(item.heightLength)}`
            : "",
          item.gender ? `Gender: ${escapeHtml(item.gender)}` : "",
          item.notes ? `Notes: ${escapeHtml(item.notes)}` : "",
        ]
          .filter(Boolean)
          .map(
            (line) =>
              `<div style="font-size:13px;color:#666;margin-top:3px;">${line}</div>`
          )
          .join("");

        return `
          <tr>
            <td style="padding: 14px 10px; border-bottom: 1px solid #eee; vertical-align: top;">
              <strong style="font-size:14px;color:#111;">${escapeHtml(
                item.name
              )}</strong>
              ${metaLines}
              <div style="font-size:12px;color:#999;margin-top:5px;">
                ${fmtMoney(currency, unit)} each
              </div>
            </td>

            <td style="padding: 14px 10px; border-bottom: 1px solid #eee; text-align: center; vertical-align: top; font-size:14px;">
              ${qty}
            </td>

            <td style="padding: 14px 10px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top; font-size:14px; white-space:nowrap;">
              ${fmtMoney(currency, itemTotal)}
            </td>
          </tr>
        `;
      })
      .join("");

    // Address: turn comma-separated parts into readable lines.
    const addressHtml = escapeHtml(orderData.shippingAddress)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .join("<br />");

    const paymentRef =
      orderData.paymentReference && orderData.paymentReference !== orderData.orderNumber
        ? orderData.paymentReference
        : orderData.orderNumber;

    const verifiedBadge =
      orderData.paymentVerified === false
        ? `<span style="display:inline-block;background:#fdecea;color:#b02a1a;font-size:11px;font-weight:bold;padding:3px 9px;border-radius:20px;">⚠ Payment unverified — confirm on Paystack</span>`
        : orderData.paymentVerified === true
        ? `<span style="display:inline-block;background:#eaf6ec;color:#256b2e;font-size:11px;font-weight:bold;padding:3px 9px;border-radius:20px;">✓ Payment verified</span>`
        : "";

    const marketingBadges = [
      orderData.emailOptIn
        ? `<span style="display:inline-block;background:#eef3fb;color:#274b8a;font-size:11px;font-weight:bold;padding:3px 9px;border-radius:20px;margin-right:6px;">📧 Opted in to email offers</span>`
        : "",
      orderData.textOptIn
        ? `<span style="display:inline-block;background:#eef3fb;color:#274b8a;font-size:11px;font-weight:bold;padding:3px 9px;border-radius:20px;">💬 Opted in to SMS offers</span>`
        : "",
    ]
      .filter(Boolean)
      .join("");

    const mailOptions = {
      from: `"Dahriola Store" <${senderEmail}>`,
      to: storeEmail,
      replyTo: orderData.customerEmail,
      subject: `New Order — ${escapeHtml(orderData.customerName)} · ${fmtMoney(
        currency,
        grandTotal
      )} (${escapeHtml(orderData.orderNumber)})`,
      html: `
      <div style="background:#f4f4f2;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

          <!-- Header -->
          <div style="background:#3f5040;padding:26px 32px;">
            <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9d3c4;">Dahriola</div>
            <div style="font-size:22px;color:#ffffff;font-weight:700;margin-top:6px;">New Order Received</div>
            <div style="font-size:13px;color:#c9d3c4;margin-top:6px;">
              ${escapeHtml(orderData.orderNumber)} &nbsp;·&nbsp; ${escapeHtml(orderDateStr)}
            </div>
            ${verifiedBadge ? `<div style="margin-top:12px;">${verifiedBadge}</div>` : ""}
          </div>

          <!-- Customer -->
          <div style="padding:24px 32px 6px;">
            <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin-bottom:10px;">Customer</div>
            <table style="width:100%;font-size:14px;color:#333;border-collapse:collapse;">
              <tr>
                <td style="padding:4px 0;width:130px;color:#888;">Name</td>
                <td style="padding:4px 0;color:#111;font-weight:600;">${escapeHtml(orderData.customerName) || "—"}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#888;">Email</td>
                <td style="padding:4px 0;color:#111;">
                  <a href="mailto:${escapeHtml(orderData.customerEmail)}" style="color:#3f5040;">${escapeHtml(orderData.customerEmail) || "—"}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#888;">Phone</td>
                <td style="padding:4px 0;color:#111;font-weight:600;">
                  ${
                    orderData.customerPhone
                      ? `<a href="tel:${escapeHtml(orderData.customerPhone)}" style="color:#3f5040;">${escapeHtml(orderData.customerPhone)}</a>`
                      : "—"
                  }
                </td>
              </tr>
            </table>
            ${marketingBadges ? `<div style="margin-top:12px;">${marketingBadges}</div>` : ""}
          </div>

          <!-- Delivery -->
          <div style="padding:14px 32px 6px;">
            <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin-bottom:8px;">Delivery Address</div>
            <div style="font-size:14px;color:#111;line-height:1.7;background:#f7f7f5;border-radius:8px;padding:14px 16px;">
              ${addressHtml || "—"}
            </div>
            ${
              orderData.shippingMethod
                ? `<div style="font-size:13px;color:#555;margin-top:10px;"><strong>Method:</strong> ${escapeHtml(orderData.shippingMethod)}</div>`
                : ""
            }
          </div>

          <!-- Items -->
          <div style="padding:20px 32px 6px;">
            <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin-bottom:6px;">Items (${itemCount})</div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;border-bottom:2px solid #eee;">Item</th>
                  <th style="text-align:center;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;border-bottom:2px solid #eee;">Qty</th>
                  <th style="text-align:right;padding:8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#aaa;border-bottom:2px solid #eee;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Breakdown -->
          <div style="padding:12px 32px 28px;">
            <table style="width:100%;max-width:280px;margin-left:auto;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#888;">Subtotal</td>
                <td style="padding:6px 0;text-align:right;color:#111;">${fmtMoney(currency, computedSubtotal)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#888;">Shipping${orderData.shippingMethod ? "" : " fee"}</td>
                <td style="padding:6px 0;text-align:right;color:#111;">
                  ${shippingFee > 0 ? fmtMoney(currency, shippingFee) : "—"}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 0;border-top:2px solid #eee;color:#111;font-weight:700;font-size:15px;">Total Paid</td>
                <td style="padding:12px 0 0;border-top:2px solid #eee;text-align:right;color:#111;font-weight:700;font-size:18px;white-space:nowrap;">${fmtMoney(currency, grandTotal)}</td>
              </tr>
            </table>
          </div>

          <!-- Payment ref + footer -->
          <div style="background:#faf9f7;padding:16px 32px;text-align:center;">
            <div style="font-size:12px;color:#999;">Payment reference: ${escapeHtml(paymentRef)}</div>
          </div>

        </div>
      </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Order email sent:", {
      messageId: info.messageId,
      to: storeEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Order Email Error:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
    });

    return {
      success: false,
      message: error?.message || "Order email failed.",
    };
  }
}

export async function sendLowStockNotification({
  printName,
  remainingStock,
  threshold,
}: {
  printName: string;
  remainingStock: number;
  threshold: number;
}) {
  try {
    const transporter = getTransporter();
    const senderEmail = getSenderEmail();
    const storeEmail = getStoreEmail();

    await transporter.verify();

    const isOutOfStock = remainingStock <= 0;

    const subject = isOutOfStock
      ? `Out of Stock Alert: ${printName}`
      : `Low Stock Alert: ${printName}`;

    const mailOptions = {
      from: `"Dahriola Store" <${senderEmail}>`,
      to: storeEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; line-height: 1.5;">
          <h2 style="border-bottom: 2px solid #000; padding-bottom: 10px;">
            ${isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert"}
          </h2>

          <p><strong>Print / Material:</strong> ${escapeHtml(printName)}</p>
          <p><strong>Remaining outfits available:</strong> ${Number(
            remainingStock
          )}</p>
          <p><strong>Low stock threshold:</strong> ${Number(threshold)}</p>

          <p style="margin-top: 20px;">
            Please update this print/material stock quantity in Sanity if more fabric is available.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("Low stock email sent:", {
      messageId: info.messageId,
      to: storeEmail,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Low Stock Email Error:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      command: error?.command,
      response: error?.response,
      responseCode: error?.responseCode,
    });

    return {
      success: false,
      message: error?.message || "Low stock email failed.",
    };
  }
}

export async function sendNewsletterWelcome({
  name,
  email,
  code,
}: {
  name: string;
  email: string;
  code: string;
}) {
  try {
    const transporter = getTransporter();
    const senderEmail = getSenderEmail();
    const firstName = String(name || "").trim().split(" ")[0];

    const info = await transporter.sendMail({
      from: `"Dahriola" <${senderEmail}>`,
      to: email,
      subject: "Welcome to Dahriola — your 10% off code",
      html: `
        <div style="font-family: Arial, sans-serif; color: #111; max-width: 520px; margin: 0 auto;">
          <h2 style="margin-bottom: 8px;">Welcome${firstName ? `, ${escapeHtml(firstName)}` : ""}</h2>
          <p>Thank you for joining the Dahriola family. Here is 10% off your first order:</p>

          <div style="border: 1px solid #111; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${escapeHtml(code)}</span>
          </div>

          <p>Enter the code at checkout to apply your discount.</p>
          <p style="margin-top: 24px; color: #777; font-size: 12px;">
            Expect exclusive previews, birthday surprises and early access.
          </p>
        </div>
      `,
    });

    console.log("Newsletter welcome email sent:", {
      messageId: info.messageId,
      to: email,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Newsletter Welcome Email Error:", {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      response: error?.response,
    });

    return {
      success: false,
      message: error?.message || "Newsletter welcome email failed.",
    };
  }
}

// ── Event emails ────────────────────────────────────────────────────────────

type RsvpRecipient = {
  name: string;
  email: string;
  guests?: number;
  ticketCode: string;
};

function checkInUrl(ticketCode: string) {
  return `${SITE_URL}/events/check-in?code=${encodeURIComponent(ticketCode)}`;
}

// Festive wrapper shared by all event emails. `christmas` adds the red/green/gold treatment.
function eventEmailShell(event: EventSummary, inner: string) {
  const festive = event.theme !== "default";
  const accent = festive ? "#9E1B32" : "#111111";
  const band = festive
    ? `<div style="background:#0F3D2E;color:#E8C77A;text-align:center;padding:10px 0;font-size:12px;letter-spacing:6px;">&#10052; &nbsp; DAHRIOLA &nbsp; &#10052;</div>`
    : `<div style="background:#111;color:#fff;text-align:center;padding:10px 0;font-size:12px;letter-spacing:6px;">DAHRIOLA</div>`;

  return `
    <div style="background:${festive ? "#F7F2EA" : "#FAFAFA"};padding:24px 0;">
      <div style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${festive ? "#E8C77A" : "#e5e5e5"};">
        ${band}
        ${event.flyerUrl ? `<img src="${event.flyerUrl}?w=1120&fit=max" alt="${escapeHtml(event.title)}" style="display:block;width:100%;height:auto;" />` : ""}
        <div style="padding:28px 28px 8px;">
          ${inner}
        </div>
        <div style="padding:0 28px 28px;">
          <table role="presentation" style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;margin-top:8px;">
            <tr><td style="padding:8px 0;color:#777;width:90px;">When</td><td style="padding:8px 0;">${escapeHtml(formatEventWhen(event))}</td></tr>
            <tr><td style="padding:8px 0;color:#777;">Where</td><td style="padding:8px 0;">${escapeHtml(eventLocation(event) || "Lagos — venue to be announced")}${event.mapLink ? ` &middot; <a href="${event.mapLink}" style="color:${accent};">Map</a>` : ""}</td></tr>
          </table>
          <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:13px;">
            <a href="${googleCalendarUrl(event)}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;padding:12px 18px;margin:0 8px 8px 0;">Add to Google Calendar</a>
            <a href="${eventUrl(event.slug)}" style="display:inline-block;border:1px solid ${accent};color:${accent};text-decoration:none;padding:11px 18px;margin:0 0 8px;">Event page</a>
          </p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#777;margin:8px 0 0;">Using Apple Calendar or Outlook? Open the attached invite (.ics).</p>
        </div>
      </div>
    </div>
  `;
}

async function eventAttachments(event: EventSummary, recipient: RsvpRecipient) {
  const qr = await QRCode.toBuffer(checkInUrl(recipient.ticketCode), { width: 360, margin: 1 });
  return {
    qrHtml: `
      <div style="text-align:center;border:1px dashed #E8C77A;padding:18px;margin:20px 0;">
        <p style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;color:#777;margin:0 0 10px;">YOUR TICKET</p>
        <img src="cid:ticket-qr" alt="Ticket QR code" width="180" height="180" style="display:inline-block;" />
        <p style="font-family:Arial,sans-serif;font-size:22px;letter-spacing:4px;font-weight:bold;margin:10px 0 0;">${escapeHtml(recipient.ticketCode)}</p>
        <p style="font-family:Arial,sans-serif;font-size:12px;color:#777;margin:6px 0 0;">Show this at the door${recipient.guests ? ` &middot; admits you + ${Number(recipient.guests)}` : ""}</p>
      </div>`,
    attachments: [{ filename: "ticket.png", content: qr, cid: "ticket-qr" }],
    icalEvent: {
      filename: "dahriola-event.ics",
      method: "PUBLISH",
      content: buildIcs(event, { name: recipient.name, email: recipient.email }),
    },
  };
}

export async function sendRsvpConfirmation(event: EventSummary, recipient: RsvpRecipient) {
  try {
    const transporter = getTransporter();
    const firstName = String(recipient.name || "").trim().split(" ")[0];
    const { qrHtml, attachments, icalEvent } = await eventAttachments(event, recipient);

    const inner = `
      <h1 style="font-weight:normal;font-size:28px;margin:0 0 12px;">You're on the list${firstName ? `, ${escapeHtml(firstName)}` : ""}!</h1>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;margin:0;">
        Thank you for registering for <strong>${escapeHtml(event.title)}</strong>. We can't wait to celebrate the season with you.
      </p>
      ${qrHtml}
    `;

    await transporter.sendMail({
      from: `"Dahriola" <${getSenderEmail()}>`,
      to: recipient.email,
      subject: `You're registered: ${event.title}`,
      html: eventEmailShell(event, inner),
      attachments,
      icalEvent,
    });

    return { success: true };
  } catch (error: any) {
    console.error("RSVP Confirmation Email Error:", error?.message || error);
    return { success: false, message: error?.message || "RSVP email failed." };
  }
}

export async function sendEventReminder(
  event: EventSummary,
  recipient: RsvpRecipient,
  kind: "48h" | "24h"
) {
  try {
    const transporter = getTransporter();
    const firstName = String(recipient.name || "").trim().split(" ")[0];
    const { qrHtml, attachments, icalEvent } = await eventAttachments(event, recipient);
    const headline = kind === "48h" ? "Two days to go!" : "See you tomorrow!";

    const inner = `
      <h1 style="font-weight:normal;font-size:28px;margin:0 0 12px;">${headline}</h1>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;margin:0;">
        Hi${firstName ? ` ${escapeHtml(firstName)}` : ""}, this is a friendly reminder that <strong>${escapeHtml(event.title)}</strong> is ${kind === "48h" ? "in two days" : "tomorrow"}. Keep this email handy — your ticket is below.
      </p>
      ${qrHtml}
    `;

    await transporter.sendMail({
      from: `"Dahriola" <${getSenderEmail()}>`,
      to: recipient.email,
      subject: `${headline} ${event.title}`,
      html: eventEmailShell(event, inner),
      attachments,
      icalEvent,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Event Reminder Email Error:", error?.message || error);
    return { success: false, message: error?.message || "Reminder email failed." };
  }
}
