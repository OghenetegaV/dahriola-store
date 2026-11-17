// Browser side of the visitor ID (see src/lib/identity.ts).
import { readConsent } from "@/src/lib/consent";

const KEY = "dahriola_did";

export function getIdentity(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setIdentity(token?: string | null) {
  if (!token) return;
  try {
    localStorage.setItem(KEY, token);
  } catch {}
}

/** True when the visitor allowed personalised emails in the cookie banner. */
export function personalisationAllowed() {
  return readConsent()?.marketing === true;
}
