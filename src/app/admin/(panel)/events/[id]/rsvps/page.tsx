import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { db, fetchAll, unwrap } from "@/src/lib/supabase/admin";
import { formatDateTime } from "@/src/lib/admin/format";
import { EmptyState, FilterTabs, PageHeader, SearchForm, StatCard, Table, Td } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import RsvpActions from "./RsvpActions";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "RSVPs" };

type Rsvp = {
  id: string;
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
};

export default async function RsvpsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; show?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const q = String(sp.q || "").trim().toLowerCase().slice(0, 80);
  const show = sp.show === "in" || sp.show === "out" ? sp.show : "all";

  const event = unwrap(
    await db().from("events").select("id, title, capacity, end_date").eq("id", id).maybeSingle(),
    "Loading the event"
  ) as { id: string; title: string; capacity: number | null; end_date: string } | null;
  if (!event) notFound();

  const all = await fetchAll<Rsvp>(
    (from, to) =>
      db()
        .from("rsvps")
        .select("id, name, email, phone, guests, source, marketing_opt_in, ticket_code, checked_in, checked_in_at, created_at")
        .eq("event_id", id)
        .order("created_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to),
    "Loading RSVPs"
  );

  const people = (rows: Rsvp[]) => rows.reduce((n, r) => n + 1 + (Number(r.guests) || 0), 0);
  const arrived = all.filter((r) => r.checked_in);
  const rsvps = all
    .filter((r) => (show === "in" ? r.checked_in : show === "out" ? !r.checked_in : true))
    .filter((r) => !q || [r.name, r.email, r.phone, r.ticket_code].some((v) => String(v || "").toLowerCase().includes(q)));

  const href = (value: string) => {
    const p = new URLSearchParams();
    if (value !== "all") p.set("show", value);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/admin/events/${id}/rsvps${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        back={{ href: `/admin/events/${id}`, label: event.title }}
        title="RSVPs"
        description={`Everyone registered for ${event.title}. At the door, staff can also scan tickets at dahriola.com/events/check-in.`}
        action={
          <a
            href={`/admin/export/rsvps?event=${encodeURIComponent(id)}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            <Download size={15} /> Download as spreadsheet
          </a>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Registrations" value={all.length} />
        <StatCard label="People expected" value={people(all)} hint={event.capacity ? `Capacity ${event.capacity}` : "Including plus-ones"} />
        <StatCard label="Checked in" value={people(arrived)} hint={people(all) ? `${Math.round((people(arrived) / people(all)) * 100)}% of those expected` : undefined} />
        <StatCard label="Agreed to emails" value={all.filter((r) => r.marketing_opt_in).length} />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterTabs
          tabs={[
            { value: "all", label: "Everyone" },
            { value: "in", label: "Checked in" },
            { value: "out", label: "Not yet arrived" },
          ]}
          current={show}
          hrefFor={href}
        />
        <SearchForm placeholder="Search name, email or ticket code" defaultValue={sp.q} hidden={{ show: show === "all" ? undefined : show }} />
      </div>

      <Card padded={false}>
        {rsvps.length === 0 ? (
          <EmptyState title={all.length ? "No one matches" : "No RSVPs yet"} text={all.length ? "Try a different search or filter." : "Registrations will appear here as people sign up."} />
        ) : (
          <Table head={["Guest", "Phone", "Plus-ones", "Ticket", "Registered", "At the door"]}>
            {rsvps.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <Td>
                  <span className="block font-medium text-neutral-900">{r.name || "—"}</span>
                  <span className="block text-xs text-neutral-500">
                    {r.email}
                    {r.source ? ` · heard via ${r.source}` : ""}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">{r.phone || "—"}</Td>
                <Td className="tabular-nums">{r.guests ? `+${r.guests}` : "—"}</Td>
                <Td>
                  <span className="font-mono text-[13px] tracking-wide">{r.ticket_code}</span>
                </Td>
                <Td className="whitespace-nowrap text-neutral-500">{formatDateTime(r.created_at)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    {r.checked_in && <Badge tone="green">In{r.checked_in_at ? ` · ${formatDateTime(r.checked_in_at).split(", ").pop()}` : ""}</Badge>}
                    <RsvpActions id={r.id} checkedIn={r.checked_in} name={r.name || r.email || "this guest"} />
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
