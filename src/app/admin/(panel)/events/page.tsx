import Link from "next/link";
import { Download, Plus, Users } from "lucide-react";
import { db, fetchAll, unwrap } from "@/src/lib/supabase/admin";
import { formatEventDateRange } from "@/src/lib/events";
import { imageUrl } from "@/src/lib/images";
import { EmptyState, PageHeader } from "@/src/components/admin/blocks";
import { Badge, Card } from "@/src/components/admin/ui";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Events & RSVPs" };

type Row = {
  id: string;
  title: string;
  slug: string;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  flyer_url: string | null;
  rsvp_open: boolean;
  show_popup: boolean;
  capacity: number | null;
};

const primaryLink = "inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-700";

export default async function EventsPage() {
  await requireAdmin();
  const [events, rsvps] = await Promise.all([
    db()
      .from("events")
      .select("id, title, slug, start_date, end_date, venue_name, flyer_url, rsvp_open, show_popup, capacity")
      .order("start_date", { ascending: false })
      .then((r) => unwrap(r, "Loading events") as Row[]),
    fetchAll<{ event_id: string; guests: number | null; checked_in: boolean }>(
      (from, to) => db().from("rsvps").select("event_id, guests, checked_in").order("id", { ascending: true }).range(from, to),
      "Loading RSVPs"
    ),
  ]);

  const stats = new Map<string, { people: number; arrived: number }>();
  for (const r of rsvps) {
    const s = stats.get(r.event_id) || { people: 0, arrived: 0 };
    const people = 1 + (Number(r.guests) || 0);
    s.people += people;
    if (r.checked_in) s.arrived += people;
    stats.set(r.event_id, s);
  }
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Events & RSVPs"
        description="Pop-ups and launches. Each event gets its own page with an RSVP form, and turns into a photo recap afterwards."
        action={
          <Link href="/admin/events/new" className={primaryLink}>
            <Plus size={16} /> Add event
          </Link>
        }
      />

      <Card padded={false}>
        {events.length === 0 ? (
          <EmptyState
            title="No events yet"
            text="Add your first event to start collecting RSVPs."
            action={
              <Link href="/admin/events/new" className={primaryLink}>
                <Plus size={16} /> Add event
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-100">
            {events.map((e) => {
              const past = new Date(e.end_date) < now;
              const s = stats.get(e.id) || { people: 0, arrived: 0 };
              return (
                <li key={e.id} className="flex flex-col gap-3 px-5 py-4 hover:bg-neutral-50 lg:flex-row lg:items-center">
                  <Link href={`/admin/events/${e.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {e.flyer_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl(e.flyer_url, { width: 120, height: 160 })} alt="" className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{e.title}</span>
                        {past ? <Badge>Finished</Badge> : <Badge tone="green">Upcoming</Badge>}
                        {!past && e.show_popup && <Badge tone="violet">Pop-up on</Badge>}
                        {!past && !e.rsvp_open && <Badge tone="amber">RSVPs closed</Badge>}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-neutral-500">
                        {formatEventDateRange({ startDate: e.start_date, endDate: e.end_date }, { weekday: false })}
                        {e.venue_name ? ` · ${e.venue_name}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[13px] text-neutral-600">
                      <span className="block font-medium tabular-nums text-neutral-900">
                        {s.people}
                        {e.capacity ? ` / ${e.capacity}` : ""} coming
                      </span>
                      {past && <span className="block tabular-nums">{s.arrived} came</span>}
                    </span>
                  </Link>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      href={`/admin/events/${e.id}/rsvps`}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3.5 text-[13px] font-medium text-neutral-800 hover:border-neutral-500"
                    >
                      <Users size={15} /> Guest list
                    </Link>
                    {/* A file download, so a plain link (not next/link) is right here */}
                    <a
                      href={`/admin/export/rsvps?event=${encodeURIComponent(e.id)}`}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-beryl px-3.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-neutral-900"
                    >
                      <Download size={15} /> Download spreadsheet
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
