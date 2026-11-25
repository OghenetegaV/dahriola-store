"use server";

// Events, their recap content and the RSVP list.
import { db, unwrap } from "@/src/lib/supabase/admin";
import { UserError, adminAction, numberOrNull, refreshShop, text, textOrNull } from "@/src/lib/admin/action";
import { fromLagosInput, slugify } from "@/src/lib/admin/format";
import { trackBrevoEvent } from "@/src/lib/brevo";

const isUrl = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

export type GalleryInput = { url: string; width?: number; height?: number; caption?: string };
export type VideoFileInput = { url: string; mimeType?: string; caption?: string };

export type EventInput = {
  id?: string;
  title: string;
  slug?: string;
  tagline?: string;
  /** datetime-local values, typed in Lagos time */
  startDate: string;
  endDate: string;
  venueName?: string;
  venueAddress?: string;
  mapLink?: string;
  flyerUrl?: string | null;
  description?: string;
  capacity?: number | string | null;
  maxGuests?: number | string | null;
  rsvpOpen: boolean;
  showPopup: boolean;
  gallery: GalleryInput[];
  videos: string[];
  videoFiles: VideoFileInput[];
  recap?: string;
  featuredProductIds: string[];
  followUpsEnabled: boolean;
  attendeeCode?: string;
};

export async function saveEvent(input: EventInput) {
  return adminAction<{ id: string }>(async () => {
    const title = text(input.title, 160);
    if (!title) throw new UserError("Give the event a title.");
    const slug = slugify(input.slug || title);
    if (!slug) throw new UserError("The page link needs at least one letter or number.");
    if (slug === "check-in") throw new UserError("\"check-in\" is used by the door check-in page. Please pick another link.");

    const start = fromLagosInput(input.startDate);
    const end = fromLagosInput(input.endDate);
    if (!start || !end) throw new UserError("Add the start and end date and time.");
    if (new Date(end) <= new Date(start)) throw new UserError("The event has to end after it starts.");

    const mapLink = text(input.mapLink, 600);
    if (mapLink && !isUrl(mapLink)) throw new UserError("The map link should start with https://");
    const capacity = numberOrNull(input.capacity);
    if (capacity !== null && (capacity < 1 || !Number.isInteger(capacity))) throw new UserError("Capacity should be a whole number of people.");
    const maxGuests = numberOrNull(input.maxGuests) ?? 1;
    if (maxGuests < 0 || maxGuests > 10 || !Number.isInteger(maxGuests)) throw new UserError("Plus-ones should be between 0 and 10.");

    const videos = (Array.isArray(input.videos) ? input.videos : []).map((v) => text(v, 600)).filter(Boolean);
    if (videos.some((v) => !isUrl(v))) throw new UserError("Video links should start with https://");

    const attendeeCode = text(input.attendeeCode, 40).toUpperCase();
    if (attendeeCode) {
      const exists = unwrap(await db().from("coupons").select("id").eq("code", attendeeCode).maybeSingle(), "Checking the code");
      if (!exists) throw new UserError(`There's no discount code called ${attendeeCode}. Create it under Discount codes first.`);
    }

    const values = {
      title,
      slug,
      tagline: textOrNull(input.tagline, 200),
      start_date: start,
      end_date: end,
      venue_name: textOrNull(input.venueName, 160),
      venue_address: textOrNull(input.venueAddress, 400),
      map_link: mapLink || null,
      flyer_url: isUrl(input.flyerUrl) ? input.flyerUrl : null,
      description: textOrNull(input.description, 8000),
      capacity,
      max_guests: maxGuests,
      rsvp_open: !!input.rsvpOpen,
      show_popup: !!input.showPopup,
      gallery: (Array.isArray(input.gallery) ? input.gallery : [])
        .filter((g) => isUrl(g?.url))
        .slice(0, 300)
        .map((g) => ({
          url: g.url,
          width: Number(g.width) || undefined,
          height: Number(g.height) || undefined,
          caption: text(g.caption, 200) || undefined,
        })),
      videos,
      video_files: (Array.isArray(input.videoFiles) ? input.videoFiles : [])
        .filter((v) => isUrl(v?.url))
        .slice(0, 30)
        .map((v) => ({ url: v.url, mimeType: text(v.mimeType, 60) || undefined, caption: text(v.caption, 200) || undefined })),
      recap: textOrNull(input.recap, 8000),
      featured_product_ids: [...new Set((Array.isArray(input.featuredProductIds) ? input.featuredProductIds : []).map((p) => text(p, 100)).filter(Boolean))],
      follow_ups_enabled: !!input.followUpsEnabled,
      attendee_code: attendeeCode || null,
    };

    let id = text(input.id, 100);
    if (id) {
      unwrap(await db().from("events").update(values).eq("id", id), "Saving the event");
    } else {
      const row = unwrap(await db().from("events").insert(values).select("id").single(), "Creating the event") as { id: string };
      id = row.id;
    }
    // Only one event can own the site pop-up at a time
    if (values.show_popup) {
      unwrap(await db().from("events").update({ show_popup: false }).neq("id", id).eq("show_popup", true), "Updating the pop-up");
    }

    refreshShop();
    return { id };
  });
}

export async function deleteEvent(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("events").delete().eq("id", id), "Deleting the event");
    refreshShop();
  });
}

export async function setRsvpCheckedIn(id: string, checkedIn: boolean) {
  return adminAction(async () => {
    const rows = unwrap(
      await db()
        .from("rsvps")
        .update({ checked_in: !!checkedIn, checked_in_at: checkedIn ? new Date().toISOString() : null })
        .eq("id", id)
        .select("email, guests, event:events(title)"),
      "Updating the RSVP"
    ) as unknown as { email: string | null; guests: number | null; event: { title: string } | null }[];
    const rsvp = rows[0];
    if (checkedIn && rsvp?.email) {
      await trackBrevoEvent(rsvp.email, "event_attended", { event_title: rsvp.event?.title || "", guests: Number(rsvp.guests) || 0 });
    }
  });
}

export async function deleteRsvp(id: string) {
  return adminAction(async () => {
    unwrap(await db().from("rsvps").delete().eq("id", id), "Removing the RSVP");
  });
}
