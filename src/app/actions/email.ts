"use server";

import nodemailer from "nodemailer";

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

export async function sendOrderNotification(orderData: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  totalAmount: number;
  currency: string;
  shippingAddress: string;
}) {
  try {
    const transporter = getTransporter();
    const senderEmail = getSenderEmail();
    const storeEmail = getStoreEmail();

    await transporter.verify();

    const itemsHtml = orderData.items
      .map((item) => {
        const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);

        return `
          <tr>
            <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
              <strong>${escapeHtml(item.name)}</strong>
              <br />
              <span style="font-size: 13px; color: #666;">Size: ${escapeHtml(
                item.size
              )}</span>
              ${
                item.selectedPrintName
                  ? `<br /><span style="font-size: 13px; color: #666;">Print: ${escapeHtml(
                      item.selectedPrintName
                    )}</span>`
                  : ""
              }
              ${
                item.notes
                  ? `<br /><span style="font-size: 13px; color: #666;">Notes: ${escapeHtml(
                      item.notes
                    )}</span>`
                  : ""
              }
            </td>

            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center;">
              ${Number(item.quantity || 1)}
            </td>

            <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right;">
              ${escapeHtml(orderData.currency)} ${itemTotal.toLocaleString()}
            </td>
          </tr>
        `;
      })
      .join("");

    const mailOptions = {
      from: `"Dahriola Store" <${senderEmail}>`,
      to: storeEmail,
      replyTo: orderData.customerEmail,
      subject: `New Order Received: ${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; color: #333; line-height: 1.5;">
          <h2 style="text-transform: lowercase; border-bottom: 2px solid #000; padding-bottom: 10px;">
            New Order Notification
          </h2>

          <p><strong>Order Number:</strong> ${escapeHtml(
            orderData.orderNumber
          )}</p>
          <p><strong>Customer:</strong> ${escapeHtml(
            orderData.customerName
          )}</p>
          <p><strong>Email:</strong> ${escapeHtml(
            orderData.customerEmail
          )}</p>
          <p><strong>Delivery Address:</strong> ${escapeHtml(
            orderData.shippingAddress
          )}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #f9f9f9;">
                <th style="text-align: left; padding: 10px;">Item</th>
                <th style="padding: 10px;">Qty</th>
                <th style="text-align: right; padding: 10px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: right; font-size: 18px;">
            <strong>Total Paid: ${escapeHtml(
              orderData.currency
            )} ${Number(orderData.totalAmount || 0).toLocaleString()}</strong>
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