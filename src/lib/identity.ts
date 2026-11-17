// Server-only: a signed, opaque visitor ID tied to an email address.
// Put on links in our emails (?did=…) and handed back after sign-up, RSVP or
// checkout, so a known contact's browsing can personalise their emails —
// only if they allowed "Personalised emails" in the cookie banner.
import { hmac, safeEqual } from "@/src/lib/signing";

const b64url = (s: string) => Buffer.from(s, "utf-8").toString("base64url");
const fromB64url = (s: string) => Buffer.from(s, "base64url").toString("utf-8");

export function identityToken(email: string) {
  const e = String(email || "").trim().toLowerCase();
  if (!e) return "";
  return `${b64url(e)}.${hmac(`identity|${e}`).slice(0, 24)}`;
}

export function emailFromIdentity(token: string): string | null {
  const [payload, sig] = String(token || "").split(".");
  if (!payload || !sig) return null;
  try {
    const email = fromB64url(payload);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && safeEqual(hmac(`identity|${email}`).slice(0, 24), sig) ? email : null;
  } catch {
    return null;
  }
}
