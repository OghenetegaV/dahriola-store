import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { COUNT, countRows, db, fetchAll, unwrap } from "@/src/lib/supabase/admin";
import { OPEN_STATUSES, effectiveStatus, isLowStock, listPrints, type OrderRow } from "@/src/lib/admin/data";
import { STATUS_TONES, formatDate, naira, timeAgo } from "@/src/lib/admin/format";
import { statusLabel } from "@/src/lib/orderSteps";
import { EmptyState, PageHeader, StatCard, Table, Td } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";

export const metadata = { title: "Home" };

const DAY = 86_400_000;
const lagosDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

type SalesRow = Pick<OrderRow, "total_amount" | "created_at" | "payment_verified" | "status">;

export default async function DashboardHome() {
  const admin = await requireAdmin();
  const now = new Date();
  const since = new Date(now.getTime() - 60 * DAY).toISOString();

  const [recentSales, latest, openCount, unverified, pendingReviews, prints, nextEvent] = await Promise.all([
    fetchAll<SalesRow>(
      (from, to) =>
        db()
          .from("orders")
          .select("total_amount, created_at, payment_verified, status")
          .gt("created_at", since)
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      "Loading sales"
    ),
    db()
      .from("orders")
      .select("id, order_number, customer_name, total_amount, status, delivered, payment_verified, is_gift, created_at")
      .order("created_at", { ascending: false })
      .limit(8)
      .then((r) => unwrap(r, "Loading orders") as Pick<OrderRow, "id" | "order_number" | "customer_name" | "total_amount" | "status" | "delivered" | "payment_verified" | "is_gift" | "created_at">[]),
    countRows(db().from("orders").select("*", COUNT).in("status", OPEN_STATUSES)),
    countRows(db().from("orders").select("*", COUNT).eq("payment_verified", false)),
    countRows(db().from("reviews").select("*", COUNT).eq("approved", false)),
    listPrints(),
    db()
      .from("events")
      .select("id, title, start_date")
      .gt("end_date", now.toISOString())
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((r) => unwrap(r, "Loading events") as { id: string; title: string; start_date: string } | null),
  ]);

  const paid = recentSales.filter((o) => o.payment_verified && o.status !== "cancelled");
  const inWindow = (o: SalesRow, from: number, to: number) => {
    const t = new Date(o.created_at).getTime();
    return t >= from && t < to;
  };
  const sum = (rows: SalesRow[]) => rows.reduce((n, o) => n + (Number(o.total_amount) || 0), 0);
  const t = now.getTime();
  const last30 = paid.filter((o) => inWindow(o, t - 30 * DAY, t + 1));
  const prev30 = paid.filter((o) => inWindow(o, t - 60 * DAY, t - 30 * DAY));
  const last7 = paid.filter((o) => inWindow(o, t - 7 * DAY, t + 1));
  const change = sum(prev30) > 0 ? Math.round(((sum(last30) - sum(prev30)) / sum(prev30)) * 100) : null;

  // Sales per Lagos calendar day for the last 30 days
  const days = Array.from({ length: 30 }, (_, i) => lagosDay(new Date(t - (29 - i) * DAY)));
  const byDay = new Map(days.map((d) => [d, 0]));
  for (const o of last30) {
    const key = lagosDay(new Date(o.created_at));
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + (Number(o.total_amount) || 0));
  }
  const peak = Math.max(1, ...byDay.values());

  const lowStock = prints.filter(isLowStock).sort((a, b) => a.stock_quantity - b.stock_quantity);
  const rsvpCount = nextEvent ? await countRows(db().from("rsvps").select("*", COUNT).eq("event_id", nextEvent.id)) : 0;
  const firstName = (admin.name || "").trim().split(/\s+/)[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Here's what's happening in your store."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sales, last 30 days"
          value={naira(sum(last30))}
          hint={change === null ? `${last30.length} paid orders` : `${change >= 0 ? "Up" : "Down"} ${Math.abs(change)}% on the 30 days before`}
        />
        <StatCard label="Sales, last 7 days" value={naira(sum(last7))} hint={`${last7.length} paid order${last7.length === 1 ? "" : "s"}`} />
        <StatCard
          label="Orders to work on"
          value={openCount}
          hint="Received, in production or ready to ship"
          href="/admin/orders?status=open"
          tone={openCount > 0 ? "alert" : undefined}
        />
        <StatCard
          label="Prints running low"
          value={lowStock.length}
          hint={lowStock.length ? "Tap to update stock" : "All prints are well stocked"}
          href="/admin/prints?show=low"
          tone={lowStock.length > 0 ? "alert" : undefined}
        />
      </div>

      {(unverified > 0 || pendingReviews > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {unverified > 0 && (
            <Link href="/admin/orders?status=unverified" className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 text-sm text-amber-900 hover:bg-amber-100">
              <span>
                <strong>{unverified}</strong> payment{unverified === 1 ? "" : "s"} couldn&apos;t be confirmed automatically
              </span>
              <ArrowRight size={16} />
            </Link>
          )}
          {pendingReviews > 0 && (
            <Link href="/admin/reviews" className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-sm text-neutral-800 hover:border-neutral-400">
              <span>
                <strong>{pendingReviews}</strong> review{pendingReviews === 1 ? "" : "s"} waiting for your approval
              </span>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card title="Sales by day" description="Paid orders over the last 30 days" className="lg:col-span-2">
          {sum(last30) === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-500">No paid orders in the last 30 days yet.</p>
          ) : (
            <div>
              <div className="flex h-40 items-end gap-[3px]" role="img" aria-label={`Daily sales for the last 30 days, totalling ${naira(sum(last30))}`}>
                {days.map((d) => {
                  const value = byDay.get(d) || 0;
                  return (
                    <div key={d} className="group relative flex h-full flex-1 items-end">
                      <div
                        className={`w-full rounded-t-[3px] ${value ? "bg-brand-beryl group-hover:bg-neutral-900" : "bg-neutral-200"}`}
                        style={{ height: value ? `${Math.max(4, (value / peak) * 100)}%` : "2px" }}
                      />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white group-hover:block">
                        {formatDate(`${d}T12:00:00+01:00`)} · {naira(value)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-neutral-400">
                <span>{formatDate(`${days[0]}T12:00:00+01:00`)}</span>
                <span>Today</span>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Low stock" action={<Link href="/admin/prints" className="text-[13px] font-medium text-brand-beryl hover:underline">All prints</Link>}>
            {lowStock.length === 0 ? (
              <p className="text-sm text-neutral-500">Nothing is running low.</p>
            ) : (
              <ul className="space-y-2.5">
                {lowStock.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-neutral-800">{p.name}</span>
                    <Badge tone={p.stock_quantity === 0 ? "red" : "amber"}>{p.stock_quantity === 0 ? "Sold out" : `${p.stock_quantity} left`}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {nextEvent && (
            <Card title="Next event">
              <Link href={`/admin/events/${nextEvent.id}`} className="block text-sm hover:underline">
                <span className="font-medium text-neutral-900">{nextEvent.title}</span>
                <span className="mt-0.5 block text-neutral-500">
                  {formatDate(nextEvent.start_date)} · {rsvpCount} RSVP{rsvpCount === 1 ? "" : "s"}
                </span>
              </Link>
            </Card>
          )}
        </div>
      </div>

      <Card
        title="Latest orders"
        className="mt-6"
        padded={false}
        action={<Link href="/admin/orders" className="text-[13px] font-medium text-brand-beryl hover:underline">See all orders</Link>}
      >
        {latest.length === 0 ? (
          <EmptyState title="No orders yet" text="New orders will show up here as soon as customers check out." />
        ) : (
          <Table head={["Order", "Customer", "Total", "Status", "Placed"]}>
            {latest.map((o) => {
              const status = effectiveStatus(o);
              return (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="whitespace-nowrap font-medium text-neutral-900 hover:underline">
                      {o.order_number}
                    </Link>
                  </Td>
                  <Td>
                    {o.customer_name || "—"} {o.is_gift && <Badge tone="violet">Gift</Badge>}
                  </Td>
                  <Td className="tabular-nums">{naira(o.total_amount)}</Td>
                  <Td>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge tone={STATUS_TONES[status]}>{statusLabel(status)}</Badge>
                      {!o.payment_verified && <Badge tone="red">Payment unconfirmed</Badge>}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-neutral-500">{timeAgo(o.created_at)}</Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>
    </>
  );
}
