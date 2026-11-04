// Shared event helpers — safe to import from both server and client code.

export const SITE_URL = "https://dahriola.com";
export const EVENT_TZ = "Africa/Lagos";

export type EventSummary = {
  _id: string;
  title: string;
  slug: string;
  tagline?: string;
  startDate: string;
  endDate: string;
  venueName?: string;
  venueAddress?: string;
  mapLink?: string;
  flyerUrl?: string;
  theme?: "christmas" | "default";
  rsvpOpen?: boolean;
  capacity?: number;
  maxGuests?: number;
};

// GROQ projection that produces an EventSummary
export const EVENT_SUMMARY_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  tagline,
  startDate,
  endDate,
  venueName,
  venueAddress,
  mapLink,
  "flyerUrl": flyer.asset->url,
  theme,
  rsvpOpen,
  capacity,
  maxGuests
`;

// The event currently promoted with the site pop-up (not yet finished)
export const ACTIVE_EVENT_QUERY = `*[_type == "event" && showPopup == true && dateTime(endDate) > dateTime(now())] | order(startDate asc)[0]{${EVENT_SUMMARY_FIELDS}}`;

export function eventUrl(slug: string) {
  return `${SITE_URL}/events/${slug}`;
}

export function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: EVENT_TZ,
  });
}

export function formatEventTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: EVENT_TZ,
  });
}

export function formatEventWhen(event: Pick<EventSummary, "startDate" | "endDate">) {
  return `${formatEventDate(event.startDate)}, ${formatEventTime(event.startDate)} – ${formatEventTime(event.endDate)}`;
}

export function eventLocation(event: Pick<EventSummary, "venueName" | "venueAddress">) {
  return [event.venueName, event.venueAddress].filter(Boolean).join(", ");
}

// 20261212T140000Z
function toCalendarStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(event: EventSummary) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarStamp(event.startDate)}/${toCalendarStamp(event.endDate)}`,
    details: `${event.tagline || ""}\n\nEvent details: ${eventUrl(event.slug)}`.trim(),
    location: eventLocation(event),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// iCalendar invite (Apple Calendar, Outlook, Google import)
export function buildIcs(event: EventSummary, attendee?: { name: string; email: string }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DAHRIOLA//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event._id}@dahriola.com`,
    `DTSTAMP:${toCalendarStamp(new Date().toISOString())}`,
    `DTSTART:${toCalendarStamp(event.startDate)}`,
    `DTEND:${toCalendarStamp(event.endDate)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`${event.tagline || ""}\n\n${eventUrl(event.slug)}`.trim())}`,
    `LOCATION:${escapeIcs(eventLocation(event))}`,
    `URL:${eventUrl(event.slug)}`,
    ...(attendee ? [`ATTENDEE;CN=${escapeIcs(attendee.name)}:mailto:${attendee.email}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(event.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
