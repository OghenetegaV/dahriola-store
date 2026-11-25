import Link from "next/link";
import { Download } from "lucide-react";
import { canEmail, listCustomers } from "@/src/lib/admin/customers";
import { PAGE_SIZE, pageNumber } from "@/src/lib/admin/data";
import { formatDate, naira } from "@/src/lib/admin/format";
import { EmptyState, FilterTabs, PageHeader, Pagination, SearchForm, StatCard, Table, Td } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; show?: string; page?: string }> }) {
  await requireAdmin();
  const params = await searchParams;
  const q = String(params.q || "").trim().toLowerCase().slice(0, 80);
  const show = ["emails", "repeat"].includes(params.show || "") ? params.show! : "all";
  const page = pageNumber(params.page);

  const all = await listCustomers();
  const filtered = all
    .filter((c) => (show === "emails" ? canEmail(c) : show === "repeat" ? c.orders > 1 : true))
    .filter((c) => !q || c.email.includes(q) || c.name.toLowerCase().includes(q) || c.phone.includes(q));
  const customers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const href = (next: { show?: string; page?: number }) => {
    const sp = new URLSearchParams();
    const s = next.show ?? show;
    if (s !== "all") sp.set("show", s);
    if (q) sp.set("q", q);
    if (next.page && next.page > 1) sp.set("page", String(next.page));
    const qs = sp.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  };
  const repeat = all.filter((c) => c.orders > 1).length;
  const emailable = all.filter(canEmail).length;

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has paid for an order."
        action={
          <a
            href={`/admin/export/customers${show === "emails" ? "?show=emails" : ""}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <Download size={15} /> Download as spreadsheet
          </a>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Customers" value={all.length} />
        <StatCard label="Ordered more than once" value={repeat} hint={all.length ? `${Math.round((repeat / all.length) * 100)}% of customers` : undefined} />
        <StatCard label="Agreed to email offers" value={emailable} hint="And haven't unsubscribed" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          tabs={[
            { value: "all", label: "All" },
            { value: "repeat", label: "Repeat customers" },
            { value: "emails", label: "Agreed to emails" },
          ]}
          current={show}
          hrefFor={(value) => href({ show: value })}
        />
        <SearchForm placeholder="Search name, email or phone" defaultValue={params.q} hidden={{ show: show === "all" ? undefined : show }} />
      </div>

      <Card padded={false}>
        {customers.length === 0 ? (
          <EmptyState title={all.length ? "No customers match" : "No customers yet"} text={all.length ? "Try a different search or filter." : "They'll appear here after their first paid order."} />
        ) : (
          <>
            <Table head={["Customer", "Phone", "Orders", "Total spent", "Last order", "Emails"]}>
              {customers.map((c) => (
                <tr key={c.email} className="hover:bg-neutral-50">
                  <Td>
                    <Link href={`/admin/orders?q=${encodeURIComponent(c.email)}`} className="block">
                      <span className="block font-medium text-neutral-900 hover:underline">{c.name || c.email}</span>
                      <span className="block text-xs text-neutral-500">{c.email}</span>
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">{c.phone || "—"}</Td>
                  <Td className="tabular-nums">{c.orders}</Td>
                  <Td className="whitespace-nowrap tabular-nums">{naira(c.spent)}</Td>
                  <Td className="whitespace-nowrap text-neutral-500">{formatDate(c.lastOrder)}</Td>
                  <Td>{c.unsubscribed ? <Badge tone="red">Unsubscribed</Badge> : c.emailOptIn ? <Badge tone="green">Agreed</Badge> : <Badge>Not agreed</Badge>}</Td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} hrefFor={(p) => href({ page: p })} />
          </>
        )}
      </Card>
    </>
  );
}
