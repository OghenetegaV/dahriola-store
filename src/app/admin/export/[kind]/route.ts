// Spreadsheet downloads (CSV, opens in Excel / Google Sheets / Numbers).
import { NextResponse } from "next/server";
import { getAdmin } from "@/src/lib/admin/auth";
import { db, fetchAll } from "@/src/lib/supabase/admin";
import { canEmail, listCustomers } from "@/src/lib/admin/customers";
import { effectiveStatus, type OrderRow } from "@/src/lib/admin/data";
import { formatDateTime, toCsv } from "@/src/lib/admin/format";
import { statusLabel } from "@/src/lib/orderSteps";

export const dynamic = "force-dynamic";

const yesNo = (v: unknown) => (v ? "Yes" : "No");

function file(name: string, csv: string) {
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dahriola-${name}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  const { kind } = await params;
  const url = new URL(req.url);

  if (kind === "orders") {
    const orders = await fetchAll<OrderRow>(
      (from, to) => db().from("orders").select("*").order("created_at", { ascending: false }).order("id", { ascending: true }).range(from, to),
      "Loading orders"
    );
    return file(
      "orders",
      toCsv(
        ["Order", "Placed", "Status", "Paid", "Customer", "Email", "Phone", "Items", "Subtotal", "Discount code", "Discount", "Shipping", "Total", "Shipping method", "Address", "Courier", "Tracking number", "Gift for", "Email offers", "Text offers"],
        orders.map((o) => [
          o.order_number,
          formatDateTime(o.created_at),
          statusLabel(effectiveStatus(o)),
          yesNo(o.payment_verified),
          o.customer_name,
          o.customer_email,
          o.customer_phone,
          (o.items || [])
            .map((i) => [`${i.quantity || 1} × ${i.name}`, i.size && `size ${i.size}`, i.selectedPrintName, i.heightLength && `H/L ${i.heightLength}`, i.gender].filter(Boolean).join(", "))
            .join(" | "),
          o.subtotal,
          o.discount_code,
          o.discount_amount,
          o.shipping_fee,
          o.total_amount,
          o.shipping_method,
          o.shipping_address,
          o.courier,
          o.tracking_number,
          o.is_gift ? o.gift_recipient : "",
          yesNo(o.email_opt_in),
          yesNo(o.text_opt_in),
        ])
      )
    );
  }

  if (kind === "customers") {
    const all = await listCustomers();
    const customers = url.searchParams.get("show") === "emails" ? all.filter(canEmail) : all;
    return file(
      url.searchParams.get("show") === "emails" ? "email-list" : "customers",
      toCsv(
        ["Name", "Email", "Phone", "Orders", "Total spent (NGN)", "First order", "Last order", "Agreed to email offers", "Agreed to text offers", "Unsubscribed"],
        customers.map((c) => [c.name, c.email, c.phone, c.orders, Math.round(c.spent), formatDateTime(c.firstOrder), formatDateTime(c.lastOrder), yesNo(c.emailOptIn), yesNo(c.textOptIn), yesNo(c.unsubscribed)])
      )
    );
  }

  if (kind === "rsvps") {
    const eventId = url.searchParams.get("event") || "";
    const rsvps = await fetchAll<{
      name: string | null;
      email: string | null;
      phone: string | null;
      guests: number;
      source: string | null;
      marketing_opt_in: boolean;
      ticket_code: string | null;
      checked_in: boolean;
      checked_in_at: string | null;
      created_at: string;
    }>(
      (from, to) =>
        db().from("rsvps").select("*").eq("event_id", eventId).order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, to),
      "Loading RSVPs"
    );
    return file(
      "rsvps",
      toCsv(
        ["Name", "Email", "Phone", "Plus-ones", "How they heard", "Agreed to emails", "Ticket code", "Checked in", "Checked in at", "Registered"],
        rsvps.map((r) => [r.name, r.email, r.phone, r.guests, r.source, yesNo(r.marketing_opt_in), r.ticket_code, yesNo(r.checked_in), r.checked_in_at ? formatDateTime(r.checked_in_at) : "", formatDateTime(r.created_at)])
      )
    );
  }

  return NextResponse.json({ error: "Unknown download." }, { status: 404 });
}
