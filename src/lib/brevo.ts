// Server-only Brevo (formerly Sendinblue) client. Every call is a no-op until
// BREVO_API_KEY is set, so the site works the same without it. This is the only
// file that talks to Brevo — switching to Mailchimp later means replacing it.
//
// Env:
//   BREVO_API_KEY            API key (Brevo → Settings → SMTP & API → API keys)
//   BREVO_SENDER_EMAIL       a sender verified in Brevo, e.g. hello@dahriola.com
//   BREVO_LIST_NEWSLETTER    list ID numbers (Brevo → Contacts → Lists), optional
//   BREVO_LIST_CUSTOMERS
//   BREVO_LIST_EVENTS

const API = "https://api.brevo.com/v3";

export function brevoConfigured() {
  return !!process.env.BREVO_API_KEY;
}

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "api-key": process.env.BREVO_API_KEY || "",
      "content-type": "application/json",
      accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

function listId(name: "NEWSLETTER" | "CUSTOMERS" | "EVENTS") {
  const n = Number(process.env[`BREVO_LIST_${name}`]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Contact attributes the site keeps up to date in Brevo. */
export type BrevoAttributes = Partial<{
  FIRSTNAME: string;
  LASTNAME: string;
  BIRTH_MONTH: number;
  BIRTH_YEAR: number;
  SIGNUP_SOURCE: string;
  FIRST_ORDER_DATE: string; // YYYY-MM-DD
  LAST_ORDER_DATE: string;
  ORDER_COUNT: number;
  TOTAL_SPENT: number; // NGN
  VIP: boolean;
  LAST_EVENT: string;
  HAS_WISHLIST: boolean;
}>;

const ATTRIBUTE_TYPES: Record<keyof BrevoAttributes, "text" | "float" | "date" | "boolean"> = {
  FIRSTNAME: "text",
  LASTNAME: "text",
  BIRTH_MONTH: "float",
  BIRTH_YEAR: "float",
  SIGNUP_SOURCE: "text",
  FIRST_ORDER_DATE: "date",
  LAST_ORDER_DATE: "date",
  ORDER_COUNT: "float",
  TOTAL_SPENT: "float",
  VIP: "boolean",
  LAST_EVENT: "text",
  HAS_WISHLIST: "boolean",
};

let attributesEnsured = false;
/** Creates the custom contact attributes in Brevo if they don't exist yet. */
export async function ensureBrevoAttributes() {
  if (!brevoConfigured() || attributesEnsured) return;
  for (const [name, type] of Object.entries(ATTRIBUTE_TYPES)) {
    if (name === "FIRSTNAME" || name === "LASTNAME") continue; // built in
    // 400 "already exists" is fine
    await call("POST", `/contacts/attributes/normal/${name}`, { type });
  }
  attributesEnsured = true;
}

export async function upsertContact(
  email: string,
  attributes: BrevoAttributes,
  lists: ("NEWSLETTER" | "CUSTOMERS" | "EVENTS")[] = [],
  opts: { resubscribe?: boolean } = {}
) {
  if (!brevoConfigured() || !email) return false;
  try {
    await ensureBrevoAttributes();
    const clean = Object.fromEntries(Object.entries(attributes).filter(([, v]) => v !== undefined && v !== ""));
    const listIds = lists.map(listId).filter((n): n is number => n !== null);
    const res = await call("POST", "/contacts", {
      email: email.trim().toLowerCase(),
      attributes: clean,
      listIds: listIds.length ? listIds : undefined,
      updateEnabled: true,
      ...(opts.resubscribe ? { emailBlacklisted: false } : {}),
    });
    if (!res.ok) console.error("Brevo upsertContact failed:", res.status, res.data);
    return res.ok;
  } catch (err) {
    console.error("Brevo upsertContact error:", err);
    return false;
  }
}

/** Marks a contact as unsubscribed in Brevo so campaigns skip them too. */
export async function blacklistContact(email: string) {
  if (!brevoConfigured()) return false;
  const res = await call("POST", "/contacts", {
    email: email.trim().toLowerCase(),
    emailBlacklisted: true,
    updateEnabled: true,
  });
  return res.ok;
}

/** Sends one email through Brevo. Returns false if Brevo isn't set up or fails. */
export async function sendBrevoEmail(opts: { to: string; name?: string; subject: string; html: string; tags?: string[] }) {
  const sender = process.env.BREVO_SENDER_EMAIL;
  if (!brevoConfigured() || !sender) return false;
  try {
    const res = await call("POST", "/smtp/email", {
      sender: { email: sender, name: "DAHRIOLA" },
      to: [{ email: opts.to, name: opts.name || undefined }],
      subject: opts.subject,
      htmlContent: opts.html,
      tags: opts.tags,
    });
    if (!res.ok) console.error("Brevo send failed:", res.status, res.data);
    return res.ok;
  } catch (err) {
    console.error("Brevo send error:", err);
    return false;
  }
}
