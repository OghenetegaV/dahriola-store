// Server-only helpers for tamper-proof values handed to the browser and back.
// Import only from server actions / API routes.
import crypto from "crypto";

function secret() {
  const s =
    process.env.CHECKOUT_SIGNING_SECRET ||
    process.env.PAYSTACK_SECRET_KEY ||
    process.env.SANITY_API_WRITE_TOKEN;
  if (!s) throw new Error("No signing secret configured");
  return s;
}

export function hmac(payload: string) {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a || "");
  const bb = Buffer.from(b || "");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function randomId(length: number) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// ---- Shipping rates ----
// A rate is signed when the server fetches it, so the browser can't lower the
// amount before paying. Valid for 3 hours.
export type SignedRate = {
  id: string;
  amount: number; // NGN
  service_name: string;
  carrier_name: string;
  delivery_time: string;
  carrier_logo?: string;
  rate_id?: string;
  exp: number;
  sig: string;
};

const RATE_TTL_MS = 3 * 60 * 60 * 1000;

/** Ties a rate to where it ships, so a cheap Lagos rate can't be reused for London. */
export function addressKey(country?: string, state?: string, city?: string) {
  const norm = (v?: string) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
  return `${norm(country)}|${norm(state)}|${norm(city)}`;
}

function ratePayload(r: { id: string; amount: number; exp: number }, addrKey: string) {
  return `rate|${r.id}|${Number(r.amount)}|${r.exp}|${addrKey}`;
}

export function signRate<T extends { id: string; amount: number }>(rate: T, addrKey: string): T & { exp: number; sig: string } {
  const exp = Date.now() + RATE_TTL_MS;
  return { ...rate, exp, sig: hmac(ratePayload({ id: rate.id, amount: rate.amount, exp }, addrKey)) };
}

export function verifyRate(
  rate: { id: string; amount: number; exp: number; sig: string } | null | undefined,
  addrKey: string
) {
  if (!rate?.sig || !rate.id) return { valid: false, expired: false, signatureOk: false };
  const signatureOk = safeEqual(rate.sig, hmac(ratePayload(rate, addrKey)));
  return { valid: signatureOk && rate.exp > Date.now(), expired: signatureOk && rate.exp <= Date.now(), signatureOk };
}
