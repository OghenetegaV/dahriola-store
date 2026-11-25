import { notFound } from "next/navigation";
import { COUNT, countRows, db, unwrap } from "@/src/lib/supabase/admin";
import { toLagosInput } from "@/src/lib/admin/format";
import { PageHeader } from "@/src/components/admin/blocks";
import type { GalleryInput, VideoFileInput } from "@/src/app/admin/actions/events";
import EventForm from "../EventForm";
import { loadEventOptions } from "../options";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Event" };

type EventRow = {
  id: string;
  title: string;
  slug: string;
  tagline: string | null;
  start_date: string;
  end_date: string;
  venue_name: string | null;
  venue_address: string | null;
  map_link: string | null;
  flyer_url: string | null;
  description: string | null;
  capacity: number | null;
  max_guests: number | null;
  rsvp_open: boolean;
  show_popup: boolean;
  gallery: GalleryInput[] | null;
  videos: string[] | null;
  video_files: VideoFileInput[] | null;
  recap: string | null;
  featured_product_ids: string[] | null;
  follow_ups_enabled: boolean;
  attendee_code: string | null;
  updated_at: string;
};

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [event, options, rsvpCount] = await Promise.all([
    db().from("events").select("*").eq("id", id).maybeSingle().then((r) => unwrap(r, "Loading the event") as EventRow | null),
    loadEventOptions(),
    countRows(db().from("rsvps").select("*", COUNT).eq("event_id", id)),
  ]);
  if (!event) notFound();

  return (
    <>
      <PageHeader back={{ href: "/admin/events", label: "All events" }} title={event.title} />
      <EventForm
        key={`${event.id}-${event.updated_at}`}
        {...options}
        rsvpCount={rsvpCount}
        finished={new Date(event.end_date) < new Date()}
        initial={{
          id: event.id,
          title: event.title,
          slug: event.slug,
          tagline: event.tagline || "",
          startDate: toLagosInput(event.start_date),
          endDate: toLagosInput(event.end_date),
          venueName: event.venue_name || "",
          venueAddress: event.venue_address || "",
          mapLink: event.map_link || "",
          flyerUrl: event.flyer_url,
          description: event.description || "",
          capacity: event.capacity === null ? "" : String(event.capacity),
          maxGuests: String(event.max_guests ?? 1),
          rsvpOpen: event.rsvp_open,
          showPopup: event.show_popup,
          gallery: (event.gallery || []).map((g) => ({ url: g.url, width: g.width, height: g.height, caption: g.caption || "" })),
          videos: event.videos || [],
          videoFiles: (event.video_files || []).map((v) => ({ url: v.url, mimeType: v.mimeType, caption: v.caption || "" })),
          recap: event.recap || "",
          featuredProductIds: event.featured_product_ids || [],
          followUpsEnabled: event.follow_ups_enabled,
          attendeeCode: event.attendee_code || "",
        }}
      />
    </>
  );
}
