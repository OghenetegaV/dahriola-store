// Cookie consent, shared by the banner and Google Analytics.
export const CONSENT_KEY = "dahriola_cookie_consent";
export const OPEN_CONSENT_EVENT = "dahriola:open-cookie-settings";

export type ConsentChoice = { analytics: boolean; decidedAt: string };

export function readConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? (JSON.parse(raw) as ConsentChoice) : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean) {
  const choice: ConsentChoice = { analytics, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
  } catch {}
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  w.gtag?.("consent", "update", { analytics_storage: analytics ? "granted" : "denied" });
  return choice;
}

/** Opens the cookie banner again (e.g. from a "Cookie settings" link). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
