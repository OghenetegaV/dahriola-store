import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/src/lib/supabase/admin";
import { OPEN_STATUSES, PAGE_SIZE, effectiveStatus, pageNumber, searchTerm, type OrderRow } from "@/src/lib/admin/data";
import { STATUS_TONES, formatDateTime, naira } from "@/src/lib/admin/format";
import { statusLabel } from "@/src/lib/orderSteps";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchForm, Table, Td } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Orders" };

const TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "To work on" },
  { value: "shipped", label: "On the way" },
  { value: "delivered", label: "Delivered" },
  { value: "unverified", label: "Payment unconfirmed" },
  { value: "cancelled", label: "Cancelled" },
];

type Row = Pick<
  OrderRow,
  "id" | "order_number" | "customer_name" | "customer_email" | "total_amount" | "status" | "delivered" | "payment_verified" | "is_gift" | "items" | "created_at"
>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const status = TABS.some((t) => t.value === params.status) ? params.status! : "all";
  const q = searchTerm(params.q);
  const page = pageNumber(params.page);

  let query = db()
    .from("orders")
    .select("id, order_number, customer_name, customer_email, total_amount, status, delivered, payment_verified, is_gift, items, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (status === "open") query = query.in("status", OPEN_STATUSES);
  else if (status === "shipped") query = query.in("status", ["shipped", "out_for_delivery"]);
  else if (status === "delivered") query = query.eq("delivered", true);
  else if (status === "cancelled") query = query.eq("status", "cancelled");
  else if (status === "unverified") query = query.eq("payment_verified", false);
  if (q) query = query.or(["order_number", "customer_name", "customer_email", "customer_phone"].map((column) => `${column}.ilike."%${q}%"`).join(","));

  const { data, count, error } = await query;
  if (error) throw new Error(`Loading orders failed: ${error.message}`);
  const orders = (data || []) as Row[];

  const href = (next: { status?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = next.status ?? status;
    if (s !== "all") sp.set("status", s);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    return `/admin/orders${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Orders"
        description="Open an order to update where it's up to. The customer is emailed automatically."
        action={
          // A file download, not a page, so a plain link is right here
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a
            href="/admin/export/orders"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <Download size={15} /> Download as spreadsheet
          </a>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs tabs={TABS} current={status} hrefFor={(value) => href({ status: value })} />
        <SearchForm placeholder="Search name, email or order number" defaultValue={q} hidden={{ status: status === "all" ? undefined : status }} />
      </div>

      <Card padded={false}>
        {orders.length === 0 ? (
          <EmptyState
            title={q ? "No orders match that search" : "No orders here"}
            text={q ? "Check the spelling, or try the customer's email address." : "Orders will appear here as customers check out."}
          />
        ) : (
          <>
            <Table head={["Order", "Customer", "Items", "Total", "Status", "Placed"]}>
              {orders.map((o) => {
                const s = effectiveStatus(o);
                const pieces = (o.items || []).reduce((n, i) => n + (Number(i.quantity) || 1), 0);
                return (
                  <tr key={o.id} className="hover:bg-neutral-50">
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="whitespace-nowrap font-medium text-neutral-900 hover:underline">
                        {o.order_number}
                      </Link>
                    </Td>
                    <Td>
                      <span className="block text-neutral-900">
                        {o.customer_name || "—"} {o.is_gift && <Badge tone="violet">Gift</Badge>}
                      </span>
                      <span className="block text-xs text-neutral-500">{o.customer_email}</span>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {pieces} item{pieces === 1 ? "" : "s"}
                    </Td>
                    <Td className="whitespace-nowrap tabular-nums">{naira(o.total_amount)}</Td>
                    <Td>
                      <span className="flex flex-wrap gap-1.5">
                        <Badge tone={STATUS_TONES[s]}>{statusLabel(s)}</Badge>
                        {!o.payment_verified && <Badge tone="red">Payment unconfirmed</Badge>}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-neutral-500">{formatDateTime(o.created_at)}</Td>
                  </tr>
                );
              })}
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={count || 0} hrefFor={(p) => href({ page: p })} />
          </>
        )}
      </Card>
    </>
  );
}
