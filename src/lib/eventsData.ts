// Server-only event reads. Types and formatting helpers live in events.ts,
// which is safe for client components.
import "server-only";
import { db, isSupabaseConfigured, unwrap } from "@/src/lib/supabase/admin";
import { productsByIds } from "@/src/lib/catalog";
import type { EventRecap, EventSummary, RecapImage, RecapVideoFile } from "@/src/lib/events";

const SUMMARY = `_id:id, title, slug, tagline, startDate:start_date, endDate:end_date, venueName:venue_name,
  venueAddress:venue_address, mapLink:map_link, flyerUrl:flyer_url, theme, rsvpOpen:rsvp_open, capacity, maxGuests:max_guests`;

const RECAP = `${SUMMARY}, description, recap, attendeeCode:attendee_code, gallery, videos, videoFiles:video_files,
  featuredProductIds:featured_product_ids, _updatedAt:updated_at`;

type RecapRow = EventSummary & {
  description?: string | null;
  recap?: string | null;
  attendeeCode?: string | null;
  gallery?: RecapImage[] | null;
  videos?: string[] | null;
  videoFiles?: RecapVideoFile[] | null;
  featuredProductIds?: string[] | null;
};

async function toRecap(row: RecapRow): Promise<EventRecap> {
  const { featuredProductIds, ...rest } = row;
  const products = await productsByIds(featuredProductIds || []);
  return {
    ...rest,
    attendeeCode: rest.attendeeCode || undefined,
    gallery: Array.isArray(rest.gallery) ? rest.gallery.filter((g) => g?.url) : [],
    videos: Array.isArray(rest.videos) ? rest.videos.filter(Boolean) : [],
    videoFiles: Array.isArray(rest.videoFiles) ? rest.videoFiles.filter((v) => v?.url) : [],
    featuredProducts: products.map((p) => ({ _id: p._id, name: p.name, slug: p.slug, priceNGN: p.priceNGN, image: p.images[0] })),
  };
}

const nowIso = () => new Date().toISOString();

/** The event currently promoted with the site pop-up (not yet finished). */
export async function getActiveEvent(): Promise<EventSummary | null> {
  if (!isSupabaseConfigured()) return null;
  return unwrap(
    await db()
      .from("events")
      .select(SUMMARY)
      .eq("show_popup", true)
      .gt("end_date", nowIso())
      .order("start_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    "Loading the active event"
  ) as EventSummary | null;
}

/** Slug of the next event to send dahriola.com/rsvp to. */
export async function getNextEventSlug(): Promise<string | null> {
  const active = await getActiveEvent();
  if (active?.slug) return active.slug;
  if (!isSupabaseConfigured()) return null;
  const next = unwrap(
    await db().from("events").select("slug").gt("end_date", nowIso()).order("start_date", { ascending: true }).limit(1).maybeSingle(),
    "Loading the next event"
  ) as { slug: string } | null;
  return next?.slug || null;
}

export async function getEventSummaryById(id: string): Promise<EventSummary | null> {
  return unwrap(await db().from("events").select(SUMMARY).eq("id", id).maybeSingle(), "Loading the event") as EventSummary | null;
}

export async function getEventBySlug(slug: string): Promise<EventRecap | null> {
  if (!isSupabaseConfigured()) return null;
  const row = unwrap(await db().from("events").select(RECAP).eq("slug", slug).maybeSingle(), "Loading the event") as RecapRow | null;
  return row ? toRecap(row) : null;
}

export type ListedEvent = EventSummary & { cover?: string; photoCount?: number; _updatedAt?: string };

/** All events for the /events page, newest first. */
export async function listEvents(): Promise<ListedEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const rows = unwrap(
    await db().from("events").select(`${SUMMARY}, gallery, _updatedAt:updated_at`).order("start_date", { ascending: false }),
    "Loading events"
  ) as (EventSummary & { gallery?: RecapImage[] | null; _updatedAt?: string })[];
  return rows.map(({ gallery, ...event }) => ({
    ...event,
    cover: gallery?.[0]?.url || event.flyerUrl || undefined,
    photoCount: Array.isArray(gallery) ? gallery.length : 0,
  }));
}

/** Events that haven't started yet (for reminders). */
export async function listUpcomingEvents(): Promise<EventSummary[]> {
  return unwrap(await db().from("events").select(SUMMARY).gt("start_date", nowIso()), "Loading upcoming events") as EventSummary[];
}

/** Finished events whose follow-up emails have been switched on. */
export async function listFollowUpEvents(): Promise<EventRecap[]> {
  const rows = unwrap(
    await db().from("events").select(RECAP).eq("follow_ups_enabled", true).lt("end_date", nowIso()),
    "Loading events for follow-ups"
  ) as RecapRow[];
  return Promise.all(rows.map(toRecap));
}
