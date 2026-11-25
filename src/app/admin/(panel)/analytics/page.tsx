import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/src/lib/admin/auth";
import { db, fetchAll } from "@/src/lib/supabase/admin";
import type { OrderRow } from "@/src/lib/admin/data";
import { naira } from "@/src/lib/admin/format";
import { GA_ID } from "@/src/lib/analytics";
import { FilterTabs, PageHeader, StatCard } from "@/src/components/admin/blocks";
import { Card } from "@/src/components/admin/ui";

export const metadata = { title: "Analytics" };

const GOOGLE_ANALYTICS_URL = "https://analytics.google.com/analytics/web/";
const DAY = 86_400_000;

const PERIODS = [
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "365", label: "Last 12 months", days: 365 },
  { value: "all", label: "All time", days: 0 },
];

type Row = Pick<
  OrderRow,
  "total_amount" | "discount_amount" | "discount_code" | "customer_email" | "items" | "status" | "payment_verified" | "is_gift" | "created_at"
>;
type CartRow = { created_at: string; recovered_at: string | null };

const lagosMonth = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }).slice(0, 7);
const monthLabel = (key: string) => new Date(`${key}-15T12:00:00Z`).toLocaleDateString("en-GB", { month: "short" });
const money = (rows: Row[]) => rows.reduce((n, o) => n + (Number(o.total_amount) || 0), 0);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Adds up a number per label and returns the biggest first. */
function tally(entries: [string, number, number][]) {
  const map = new Map<string, { units: number; revenue: number }>();
  for (const [label, units, revenue] of entries) {
    const key = label.trim();
    if (!key) continue;
    const row = map.get(key) || { units: 0, revenue: 0 };
    row.units += units;
    row.revenue += revenue;
    map.set(key, row);
  }
  return [...map.entries()].map(([label, v]) => ({ label, ...v })).sort((a, b) => b.units - a.units || b.revenue - a.revenue);
}

function RankList({ rows, empty, showRevenue = true }: { rows: { label: string; units: number; revenue: number }[]; empty: string; showRevenue?: boolean }) {
  if (!rows.length) return <p className="text-sm text-neutral-500">{empty}</p>;
  const top = rows[0].units || 1;
  return (
    <ul className="space-y-3">
      {rows.slice(0, 8).map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-neutral-800">{r.label}</span>
            <span className="shrink-0 tabular-nums text-neutral-500">
              {r.units} sold{showRevenue ? ` · ${naira(r.revenue)}` : ""}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-brand-beryl" style={{ width: `${Math.max(3, (r.units / top) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  await requireAdmin();
  const { period: raw } = await searchParams;
  const period = PERIODS.find((p) => p.value === raw) || PERIODS[0];

  const [orders, carts] = await Promise.all([
    fetchAll<Row>(
      (from, to) =>
        db()
          .from("orders")
          .select("total_amount, discount_amount, discount_code, customer_email, items, status, payment_verified, is_gift, created_at")
          .order("created_at", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to),
      "Loading orders"
    ),
    fetchAll<CartRow>(
      (from, to) => db().from("abandoned_carts").select("created_at, recovered_at").order("created_at", { ascending: true }).order("id", { ascending: true }).range(from, to),
      "Loading checkouts"
    ),
  ]);

  const now = new Date().getTime();
  const start = period.days ? now - period.days * DAY : 0;
  const prevStart = period.days ? start - period.days * DAY : 0;
  const time = (iso: string) => new Date(iso).getTime();

  // "Sales" always means orders whose payment is confirmed and that weren't cancelled
  const paid = orders.filter((o) => o.payment_verified && o.status !== "cancelled");
  const current = paid.filter((o) => time(o.created_at) >= start);
  const previous = period.days ? paid.filter((o) => time(o.created_at) >= prevStart && time(o.created_at) < start) : [];
  const unconfirmed = orders.filter((o) => !o.payment_verified && o.status !== "cancelled" && time(o.created_at) >= start);

  const sales = money(current);
  const change = money(previous) > 0 ? Math.round(((sales - money(previous)) / money(previous)) * 100) : null;
  const average = current.length ? sales / current.length : 0;

  // Customers: someone is "returning" if they had a paid order before this one
  const email = (o: Row) => (o.customer_email || "").trim().toLowerCase();
  const firstOrderAt = new Map<string, number>();
  for (const o of paid) if (email(o) && !firstOrderAt.has(email(o))) firstOrderAt.set(email(o), time(o.created_at));
  const buyers = new Set(current.map(email).filter(Boolean));
  const returning = [...buyers].filter((e) => {
    const first = firstOrderAt.get(e) || 0;
    return first < start || current.filter((o) => email(o) === e).length > 1;
  }).length;

  const items = current.flatMap((o) => o.items || []);
  const lines = items.map((i) => ({ ...i, units: Number(i.quantity) || 1, revenue: (Number(i.price) || 0) * (Number(i.quantity) || 1) }));
  const products = tally(lines.map((i) => [i.name || "", i.units, i.revenue]));
  const prints = tally(lines.map((i) => [i.selectedPrintName || "", i.units, i.revenue]));
  const sizes = tally(lines.map((i) => [i.size || "", i.units, i.revenue]));
  const unitsSold = lines.reduce((n, i) => n + i.units, 0);

  const withCode = current.filter((o) => (o.discount_code || "").trim());
  const codes = tally(withCode.map((o) => [String(o.discount_code).trim().toUpperCase(), 1, Number(o.discount_amount) || 0]));
  const discountGiven = current.reduce((n, o) => n + (Number(o.discount_amount) || 0), 0);
  const gifts = current.filter((o) => o.is_gift).length;

  const cartsInPeriod = carts.filter((c) => time(c.created_at) >= start);
  const recovered = cartsInPeriod.filter((c) => c.recovered_at).length;

  // Sales per month, last 12 months (always shown, whatever period is picked)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(15);
    d.setUTCMonth(d.getUTCMonth() - (11 - i));
    return lagosMonth(d);
  });
  const byMonth = new Map(months.map((m) => [m, { total: 0, count: 0 }]));
  for (const o of paid) {
    const slot = byMonth.get(lagosMonth(new Date(o.created_at)));
    if (slot) {
      slot.total += Number(o.total_amount) || 0;
      slot.count += 1;
    }
  }
  const peak = Math.max(1, ...[...byMonth.values()].map((m) => m.total));
  const yearTotal = [...byMonth.values()].reduce((n, m) => n + m.total, 0);

  const periodWords = period.days ? period.label.toLowerCase() : "all time";
  const gaLink = (
    <a
      href={GOOGLE_ANALYTICS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700"
    >
      Open Google Analytics <ExternalLink size={15} />
    </a>
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        description="A summary of how the shop is doing: sales, best sellers and customers. Visitor numbers live in Google Analytics."
        action={gaLink}
      />

      <div className="mb-5">
        <FilterTabs tabs={PERIODS} current={period.value} hrefFor={(v) => (v === "30" ? "/admin/analytics" : `/admin/analytics?period=${v}`)} />
      </div>

      {/* Plain-language summary */}
      <div className="mb-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm leading-6 text-neutral-700">
        {current.length === 0 ? (
          <>No confirmed sales in this period ({periodWords}) yet.</>
        ) : (
          <>
            In this period ({periodWords}) the shop made <strong className="text-neutral-900">{naira(sales)}</strong> from{" "}
            <strong className="text-neutral-900">{plural(current.length, "paid order")}</strong>
            {change !== null && (
              <>
                , {change >= 0 ? "up" : "down"} {Math.abs(change)}% on the period before
              </>
            )}
            . {plural(buyers.size, "customer")} bought {plural(unitsSold, "item")}
            {products[0] && (
              <>
                , and the best seller was <strong className="text-neutral-900">{products[0].label}</strong>
              </>
            )}
            .
          </>
        )}
      </div>

      {unconfirmed.length > 0 && (
        <Link
          href="/admin/orders?status=unverified"
          className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-5 py-3.5 text-sm text-amber-900 hover:bg-amber-100"
        >
          <span>
            <strong>{plural(unconfirmed.length, "order")}</strong> worth <strong>{naira(money(unconfirmed))}</strong> {unconfirmed.length === 1 ? "is" : "are"} not
            counted here because the payment hasn&apos;t been confirmed. Confirm the ones that were paid and they&apos;ll be added.
          </span>
          <ArrowRight size={16} className="shrink-0" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Sales"
          value={naira(sales)}
          hint={change === null ? periodWords : `${change >= 0 ? "Up" : "Down"} ${Math.abs(change)}% on the period before`}
        />
        <StatCard label="Paid orders" value={current.length} hint={period.days ? `${previous.length} in the period before` : `${plural(unitsSold, "item")} sold`} />
        <StatCard label="Average order" value={naira(average)} hint={current.length ? `${(unitsSold / current.length).toFixed(1)} items per order` : "No orders yet"} />
        <StatCard
          label="Customers"
          value={buyers.size}
          hint={buyers.size ? `${returning} returning, ${buyers.size - returning} new` : "No customers yet"}
          href="/admin/customers"
        />
      </div>

      <Card title="Sales by month" description={`Paid orders over the last 12 months, ${naira(yearTotal)} in total`} className="mt-6">
        {yearTotal === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">No confirmed sales in the last 12 months yet.</p>
        ) : (
          <>
            <div className="flex h-44 items-end gap-2" role="img" aria-label={`Monthly sales for the last 12 months, totalling ${naira(yearTotal)}`}>
              {months.map((m) => {
                const v = byMonth.get(m)!;
                return (
                  <div key={m} className="group relative flex h-full flex-1 items-end">
                    <div
                      className={`w-full rounded-t ${v.total ? "bg-brand-beryl group-hover:bg-neutral-900" : "bg-neutral-200"}`}
                      style={{ height: v.total ? `${Math.max(4, (v.total / peak) * 100)}%` : "2px" }}
                    />
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white group-hover:block">
                      {monthLabel(m)} {m.slice(0, 4)} · {naira(v.total)} · {plural(v.count, "order")}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2 text-center text-[11px] text-neutral-400">
              {months.map((m) => (
                <span key={m} className="flex-1">
                  {monthLabel(m)}
                </span>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Best sellers" description="Products sold in this period">
          <RankList rows={products} empty="Nothing sold in this period yet." />
        </Card>
        <Card title="Most-chosen prints" description="Which prints customers picked">
          <RankList rows={prints} empty="No prints chosen in this period yet." showRevenue={false} />
        </Card>
        <Card title="Sizes" description="Which sizes sell most">
          <RankList rows={sizes} empty="No sizes recorded in this period yet." showRevenue={false} />
        </Card>

        <Card title="Discounts, gifts and checkouts">
          <dl className="divide-y divide-neutral-100 text-sm">
            {[
              ["Orders that used a discount code", `${withCode.length} of ${current.length}`],
              ["Total discount given", naira(discountGiven)],
              ["Most-used code", codes[0] ? `${codes[0].label} (${plural(codes[0].units, "order")})` : "None"],
              ["Gift orders", String(gifts)],
              ["Checkouts started but not finished", String(cartsInPeriod.length - recovered)],
              ["Abandoned checkouts that came back and bought", String(recovered)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                <dt className="text-neutral-600">{label}</dt>
                <dd className="shrink-0 font-medium tabular-nums text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="Website visitors" description="How many people visit, where they come from and which pages they look at" className="mt-6">
        <p className="max-w-2xl text-sm leading-6 text-neutral-600">
          This page only knows about orders. Visitor numbers are collected by Google Analytics: open it to see how many people came to the site, whether they
          found it through Instagram, Google or a link, and which products they viewed.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {gaLink}
          {GA_ID ? (
            <span className="text-xs text-neutral-500">
              Choose the property with ID <span className="font-mono text-neutral-700">{GA_ID}</span>, signed in with the Google account that owns it.
            </span>
          ) : (
            <span className="text-xs text-amber-700">Google Analytics isn&apos;t connected to the site yet. Ask your developer to add the tracking ID.</span>
          )}
        </div>
      </Card>
    </>
  );
}
