"use server";

import nodemailer from "nodemailer";

export async function sendOrderNotification(orderData: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  totalAmount: number;
  currency: string;
  shippingAddress: string;
}) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const itemsHtml = orderData.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} (Size: ${item.size})</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${orderData.currency} ${item.price}</td>
    </tr>
  `
    )
    .join("");

  const mailOptions = {
    from: `"Dahriola Store" <${process.env.GMAIL_USER}>`,
    to: "info.dahriola@gmail.com",
    subject: `New Order Received: ${orderData.orderNumber}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; color: #333;">
        <h2 style="text-transform: lowercase; border-bottom: 2px solid #000; padding-bottom: 10px;">New Order Notification</h2>
        <p><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerEmail})</p>
        <p><strong>Delivery Address:</strong> ${orderData.shippingAddress}</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background: #f9f9f9;">
              <th style="text-align: left; padding: 10px;">Item</th>
              <th style="padding: 10px;">Qty</th>
              <th style="text-align: right; padding: 10px;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 18px;">
          <strong>Total Paid: ${orderData.currency} ${orderData.totalAmount}</strong>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Email Error:", error);
    return { success: false };
  }
}