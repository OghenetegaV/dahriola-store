// What's new in the store, for the bell in the dashboard: recent orders,
// reviews waiting for approval and RSVPs.
import "server-only";
import { db, unwrap } from "@/src/lib/supabase/admin";
import { naira } from "@/src/lib/admin/format";

export type ActivityItem = {
  id: string;
  kind: "order" | "review" | "rsvp";
  title: string;
  detail: string;
  href: string;
  at: string;
};

const DAYS_BACK = 14;
const PER_KIND = 15;

export async function getActivity(): Promise<ActivityItem[]> {
  const since = new Date(new Date().getTime() - DAYS_BACK * 86_400_000).toISOString();
  try {
    const [orders, reviews, rsvps] = await Promise.all([
      db()
        .from("orders")
        .select("id, order_number, customer_name, total_amount, is_gift, created_at")
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(PER_KIND)
        .then((r) => unwrap(r, "Loading new orders") as { id: string; order_number: string; customer_name: string | null; total_amount: number | null; is_gift: boolean; created_at: string }[]),
      db()
        .from("reviews")
        .select("id, name, rating, created_at, product:products(name)")
        .eq("approved", false)
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(PER_KIND)
        .then((r) => unwrap(r, "Loading new reviews") as unknown as { id: string; name: string; rating: number; created_at: string; product: { name: string } | null }[]),
      db()
        .from("rsvps")
        .select("id, name, guests, event_id, created_at, event:events(title)")
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(PER_KIND)
        .then((r) => unwrap(r, "Loading new RSVPs") as unknown as { id: string; name: string | null; guests: number | null; event_id: string; created_at: string; event: { title: string } | null }[]),
    ]);

    const items: ActivityItem[] = [
      ...orders.map((o) => ({
        id: `order-${o.id}`,
        kind: "order" as const,
        title: o.is_gift ? "New gift order" : "New order",
        detail: `${o.customer_name || "A customer"} · ${naira(o.total_amount)}`,
        href: `/admin/orders/${o.id}`,
        at: o.created_at,
      })),
      ...reviews.map((r) => ({
        id: `review-${r.id}`,
        kind: "review" as const,
        title: "Review waiting for your approval",
        detail: `${r.name} gave ${r.rating} star${r.rating === 1 ? "" : "s"}${r.product ? ` to ${r.product.name}` : ""}`,
        href: "/admin/reviews",
        at: r.created_at,
      })),
      ...rsvps.map((r) => ({
        id: `rsvp-${r.id}`,
        kind: "rsvp" as const,
        title: "New RSVP",
        detail: `${r.name || "Someone"}${r.guests ? ` +${r.guests}` : ""}${r.event ? ` · ${r.event.title}` : ""}`,
        href: `/admin/events/${r.event_id}/rsvps`,
        at: r.created_at,
      })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
  } catch (err) {
    console.error("Dashboard activity failed:", err);
    return [];
  }
}
