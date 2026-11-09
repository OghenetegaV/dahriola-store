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

// ---- Multi-day events ----
// startDate = first day's opening time, endDate = last day's closing time.
// e.g. 19 Dec 10:00 → 20 Dec 20:00 means "19–20 December, 10am–8pm daily".
type EventRange = Pick<EventSummary, "startDate" | "endDate">;
const DAY_MS = 86_400_000;

function lagosParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return { year: get("year"), month: get("month"), day: get("day"), weekday: get("weekday") };
}

/** Length of one day's opening (e.g. 10 hours), or the whole event if it's under a day. */
function dailyDurationMs(event: EventRange) {
  const total = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
  if (total < DAY_MS) return Math.max(total, 0);
  return total % DAY_MS || DAY_MS;
}

/** Number of days the event runs (1 for a single-day event). */
export function eventDayCount(event: EventRange) {
  const total = new Date(event.endDate).getTime() - new Date(event.startDate).getTime();
  if (total < DAY_MS) return 1;
  return Math.round((total - dailyDurationMs(event)) / DAY_MS) + 1;
}

/** "Saturday 19 – Sunday 20 December 2026" (or a single date for one-day events). */
export function formatEventDateRange(event: EventRange, opts: { year?: boolean; weekday?: boolean } = {}) {
  const { year = true, weekday = true } = opts;
  const a = lagosParts(event.startDate);
  const wd = (p: typeof a) => (weekday ? `${p.weekday} ` : "");
  const y = (p: typeof a) => (year ? ` ${p.year}` : "");
  if (eventDayCount(event) === 1) {
    return `${wd(a)}${a.day} ${a.month}${y(a)}`;
  }
  const b = lagosParts(event.endDate);
  if (a.year === b.year && a.month === b.month) {
    return `${wd(a)}${a.day} – ${wd(b)}${b.day} ${b.month}${y(b)}`;
  }
  if (a.year === b.year) {
    return `${wd(a)}${a.day} ${a.month} – ${wd(b)}${b.day} ${b.month}${y(b)}`;
  }
  return `${wd(a)}${a.day} ${a.month} ${a.year} – ${wd(b)}${b.day} ${b.month} ${b.year}`;
}

/** "10:00 am – 8:00 pm daily" (no "daily" for one-day events). */
export function formatEventHours(event: EventRange) {
  const close = new Date(new Date(event.startDate).getTime() + dailyDurationMs(event)).toISOString();
  const hours = `${formatEventTime(event.startDate)} – ${formatEventTime(close)}`;
  return eventDayCount(event) > 1 ? `${hours} daily` : hours;
}

export function formatEventWhen(event: EventRange) {
  return `${formatEventDateRange(event)}, ${formatEventHours(event)}`;
}

/** First day's block plus how many daily repeats — used for calendar invites. */
function calendarBlock(event: EventRange) {
  const start = event.startDate;
  const end = new Date(new Date(start).getTime() + dailyDurationMs(event)).toISOString();
  return { start, end, days: eventDayCount(event) };
}

export function eventLocation(event: Pick<EventSummary, "venueName" | "venueAddress">) {
  return [event.venueName, event.venueAddress].filter(Boolean).join(", ");
}

// 20261212T140000Z
function toCalendarStamp(iso: string) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(event: EventSummary) {
  const block = calendarBlock(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarStamp(block.start)}/${toCalendarStamp(block.end)}`,
    details: `${event.tagline || ""}\n\nEvent details: ${eventUrl(event.slug)}`.trim(),
    location: eventLocation(event),
  });
  if (block.days > 1) params.set("recur", `RRULE:FREQ=DAILY;COUNT=${block.days}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// iCalendar invite (Apple Calendar, Outlook, Google import)
export function buildIcs(event: EventSummary, attendee?: { name: string; email: string }) {
  const block = calendarBlock(event);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DAHRIOLA//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event._id}@dahriola.com`,
    `DTSTAMP:${toCalendarStamp(new Date().toISOString())}`,
    `DTSTART:${toCalendarStamp(block.start)}`,
    `DTEND:${toCalendarStamp(block.end)}`,
    ...(block.days > 1 ? [`RRULE:FREQ=DAILY;COUNT=${block.days}`] : []),
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
