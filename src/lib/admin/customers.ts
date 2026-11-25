// Customers aren't stored separately: they are worked out from paid orders.
import "server-only";
import { db, fetchAll } from "@/src/lib/supabase/admin";

export type Customer = {
  email: string;
  name: string;
  phone: string;
  orders: number;
  spent: number;
  firstOrder: string;
  lastOrder: string;
  emailOptIn: boolean;
  textOptIn: boolean;
  unsubscribed: boolean;
};

type Row = {
  customer_email: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  total_amount: number | null;
  created_at: string;
  email_opt_in: boolean;
  text_opt_in: boolean;
};

/** Everyone who has paid for an order, biggest spenders first. */
export async function listCustomers(): Promise<Customer[]> {
  const [rows, optOuts] = await Promise.all([
    fetchAll<Row>(
      (from, to) =>
        db()
          .from("orders")
          .select("customer_email, customer_name, customer_phone, total_amount, created_at, email_opt_in, text_opt_in")
          .eq("payment_verified", true)
          .not("customer_email", "is", null)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      "Loading customers"
    ),
    fetchAll<{ email: string }>(
      (from, to) => db().from("marketing_opt_outs").select("email").order("email", { ascending: true }).range(from, to),
      "Loading unsubscribes"
    ),
  ]);
  const unsubscribed = new Set(optOuts.map((o) => o.email.toLowerCase()));

  const byEmail = new Map<string, Customer>();
  for (const o of rows) {
    const email = String(o.customer_email || "").trim().toLowerCase();
    if (!email) continue;
    const c = byEmail.get(email);
    if (!c) {
      byEmail.set(email, {
        email,
        name: o.customer_name || "",
        phone: o.customer_phone || "",
        orders: 1,
        spent: Number(o.total_amount) || 0,
        firstOrder: o.created_at,
        lastOrder: o.created_at,
        emailOptIn: o.email_opt_in,
        textOptIn: o.text_opt_in,
        unsubscribed: unsubscribed.has(email),
      });
    } else {
      c.orders++;
      c.spent += Number(o.total_amount) || 0;
      c.lastOrder = o.created_at;
      // latest details win
      c.name = o.customer_name || c.name;
      c.phone = o.customer_phone || c.phone;
      c.emailOptIn = c.emailOptIn || o.email_opt_in;
      c.textOptIn = c.textOptIn || o.text_opt_in;
    }
  }
  return [...byEmail.values()].sort((a, b) => b.spent - a.spent);
}

/** May be sent marketing emails: agreed at checkout and hasn't unsubscribed since. */
export const canEmail = (c: Customer) => c.emailOptIn && !c.unsubscribed;
