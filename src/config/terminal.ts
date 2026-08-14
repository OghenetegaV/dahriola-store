// src/config/terminal.ts
// One-time configuration for Terminal Africa (TShip). Fill these after your
// account + pickup address are set up (see SETUP.md). Until they are, the
// checkout automatically uses the DHL fallback.

export const TERMINAL = {
  BASE: "https://api.terminal.africa/v1",

  // Dahriola's pickup (sender) address code — from creating/validating the
  // Ibadan pickup address once (returns an "AD-xxxx" code). See SETUP.md.
  PICKUP_ADDRESS_ID: process.env.TERMINAL_PICKUP_ADDRESS_ID || "",

  // Per-item billable weight in KG (agreed: 0.6kg per garment).
  DEFAULT_ITEM_WEIGHT_KG: 0.6,

  // Default parcel packaging id, if you created one in the dashboard (optional).
  PACKAGING_ID: process.env.TERMINAL_PACKAGING_ID || "",

  // Sender contact (for the pickup address, if creating on the fly).
  SENDER_NAME: process.env.TERMINAL_SENDER_NAME || "Dahriola",
  SENDER_PHONE: process.env.TERMINAL_SENDER_PHONE || "",
  SENDER_EMAIL: process.env.TERMINAL_SENDER_EMAIL || "info.dahriola@gmail.com",
};

export function terminalConfigured(): boolean {
  return !!process.env.TERMINAL_SECRET_KEY && !!TERMINAL.PICKUP_ADDRESS_ID;
}
