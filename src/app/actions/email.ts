"use server";

import nodemailer from "nodemailer";

function getTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

function getStoreEmail() {
  return process.env.STORE_NOTIFICATION_EMAIL || "info.dahriola@gmail.com";
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
  const transporter = getTransporter();

  const itemsHtml = orderData.items
    .map((item) => {
      const itemTotal = Number(item.price || 0) * Number(item.quantity || 1);

      return `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong>
            <br />
            <span style="font-size: 13px; color: #666;">Size: ${item.size}</span>
            ${
              item.selectedPrintName
                ? `<br /><span style="font-size: 13px; color: #666;">Print: ${item.selectedPrintName}</span>`
                : ""
            }
            ${
              item.notes
                ? `<br /><span style="font-size: 13px; color: #666;">Notes: ${item.notes}</span>`
                : ""
            }
          </td>

          <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>

          <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right;">
            ${orderData.currency} ${itemTotal.toLocaleString()}
          </td>
        </tr>
      `;
    })
    .join("");

  const mailOptions = {
    from: `"Dahriola Store" <${process.env.GMAIL_USER}>`,
    to: getStoreEmail(),
    subject: `New Order Received: ${orderData.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; color: #333; line-height: 1.5;">
        <h2 style="text-transform: lowercase; border-bottom: 2px solid #000; padding-bottom: 10px;">
          New Order Notification
        </h2>

        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
        <p><strong>Customer:</strong> ${orderData.customerName}</p>
        <p><strong>Email:</strong> ${orderData.customerEmail}</p>
        <p><strong>Delivery Address:</strong> ${orderData.shippingAddress}</p>
        
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
          <strong>Total Paid: ${orderData.currency} ${Number(orderData.totalAmount || 0).toLocaleString()}</strong>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Order Email Error:", error);
    return { success: false };
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
  const transporter = getTransporter();

  const isOutOfStock = remainingStock <= 0;

  const subject = isOutOfStock
    ? `Out of Stock Alert: ${printName}`
    : `Low Stock Alert: ${printName}`;

  const mailOptions = {
    from: `"Dahriola Store" <${process.env.GMAIL_USER}>`,
    to: getStoreEmail(),
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; line-height: 1.5;">
        <h2 style="border-bottom: 2px solid #000; padding-bottom: 10px;">
          ${isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert"}
        </h2>

        <p><strong>Print / Material:</strong> ${printName}</p>
        <p><strong>Remaining outfits available:</strong> ${remainingStock}</p>
        <p><strong>Low stock threshold:</strong> ${threshold}</p>

        <p style="margin-top: 20px;">
          Please update this print/material stock quantity in Sanity if more fabric is available.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Low Stock Email Error:", error);
    return { success: false };
  }
}