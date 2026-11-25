"use server";

import { randomInt } from "crypto";
import { db, fetchAll, lc, isSupabaseConfigured, unwrap } from "@/src/lib/supabase/admin";
import { getEventSummaryById } from "@/src/lib/eventsData";
import { appendRow } from "@/src/lib/googleSheets";
import { trackBrevoEvent, upsertContact } from "@/src/lib/brevo";
import { identityToken } from "@/src/lib/identity";
import { optBackIn } from "@/src/lib/marketing";
import type { EventSummary } from "@/src/lib/events";
import { sendRsvpConfirmation } from "@/src/app/actions/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TICKET_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

const SHEET_HEADERS = [
  "Name",
  "Email",
  "Phone",
  "Plus-ones",
  "How they heard",
  "Marketing opt-in",
  "Ticket Code",
  "Registered At",
];

function makeTicketCode() {
  let code = "";
  for (let i = 0; i < 6; i++) code += TICKET_ALPHABET[randomInt(TICKET_ALPHABET.length)];
  return code;
}

export type RsvpInput = {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  guests?: number;
  source?: string;
  marketingOptIn?: boolean;
};

export type RsvpResult =
  | { success: true; ticketCode: string; alreadyRegistered?: boolean; did?: string }
  | { success: false; message: string };

export async function submitRsvp(input: RsvpInput): Promise<RsvpResult> {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const phone = String(input.phone || "").trim();
  const source = String(input.source || "").trim();

  if (!name) return { success: false, message: "Please enter your name." };
  if (!EMAIL_REGEX.test(email)) return { success: false, message: "Please enter a valid email address." };
  if (!isSupabaseConfigured()) {
    console.error("submitRsvp: Supabase is not configured");
    return { success: false, message: "RSVP is unavailable right now. Please try again later." };
  }

  try {
    const event: EventSummary | null = await getEventSummaryById(String(input.eventId || ""));

    if (!event) return { success: false, message: "This event could not be found." };
    if (!event.rsvpOpen || new Date(event.endDate) < new Date()) {
      return { success: false, message: "RSVPs for this event are closed." };
    }

    const maxGuests = Math.max(0, event.maxGuests ?? 1);
    const guests = Math.min(Math.max(0, Math.floor(Number(input.guests) || 0)), maxGuests);

    const existing = unwrap(
      await db()
        .from("rsvps")
        .select("name, guests, ticketCode:ticket_code")
        .eq("event_id", event._id)
        .eq("email_lc", lc(email))
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      "Checking for an existing RSVP"
    ) as { name: string | null; guests: number; ticketCode: string } | null;

    // Already registered: resend their ticket rather than creating a duplicate
    if (existing) {
      await sendRsvpConfirmation(event, {
        name: existing.name || name,
        email,
        guests: existing.guests,
        ticketCode: existing.ticketCode,
      });
      return { success: true, ticketCode: existing.ticketCode, alreadyRegistered: true, did: identityToken(email) };
    }

    if (event.capacity) {
      const taken = await fetchAll<{ guests: number | null }>(
        (from, to) => db().from("rsvps").select("guests").eq("event_id", event._id).order("id", { ascending: true }).range(from, to),
        "Counting RSVPs"
      );
      const headcount = taken.reduce((sum, r) => sum + 1 + (Number(r.guests) || 0), 0);
      if (headcount + 1 + guests > event.capacity) {
        return { success: false, message: "Sorry, this event is now full." };
      }
    }

    const ticketCode = makeTicketCode();
    const createdAt = new Date().toISOString();

    unwrap(
      await db().from("rsvps").insert({
        event_id: event._id,
        name,
        email,
        phone,
        guests,
        source,
        marketing_opt_in: !!input.marketingOptIn,
        ticket_code: ticketCode,
        checked_in: false,
        created_at: createdAt,
      }),
      "Saving the RSVP"
    );

    // The RSVP is saved — Sheet and email failures are logged but don't fail it
    // Always written to the main (newsletter) spreadsheet; also copied to a
    // separate RSVP spreadsheet when RSVP_SHEET_ID is set (e.g. to share with
    // event staff without exposing subscriber emails).
    const row = {
      Name: name,
      Email: email,
      Phone: phone,
      "Plus-ones": guests,
      "How they heard": source,
      "Marketing opt-in": input.marketingOptIn ? "Yes" : "No",
      "Ticket Code": ticketCode,
      "Registered At": createdAt,
    };
    const tab = `RSVP – ${event.title}`.slice(0, 99);
    const rsvpSheetId = process.env.RSVP_SHEET_ID?.trim();
    const targets: (string | undefined)[] = [undefined];
    if (rsvpSheetId && rsvpSheetId !== process.env.GOOGLE_SHEET_ID?.trim()) {
      targets.push(rsvpSheetId);
    }

    const results = await Promise.allSettled(
      targets.map((sheetId) => appendRow(SHEET_HEADERS, row, tab, sheetId))
    );
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `RSVP sheet append failed (${i === 0 ? "main sheet" : "RSVP sheet"}):`,
          r.reason?.message || r.reason
        );
      }
    });

    await sendRsvpConfirmation(event, { name, email, guests, ticketCode });
    await trackBrevoEvent(email, "rsvp_registered", {
      event_title: event.title,
      event_date: event.startDate,
      guests,
      source,
      marketing_opt_in: !!input.marketingOptIn,
    });

    if (input.marketingOptIn) {
      try {
        await optBackIn(email);
        const [first, ...rest] = name.split(/\s+/);
        await upsertContact(
          email,
          { FIRSTNAME: first || undefined, LASTNAME: rest.join(" ") || undefined, LAST_EVENT: event.title, SIGNUP_SOURCE: `RSVP: ${event.title}` },
          ["EVENTS"],
          { resubscribe: true }
        );
      } catch (err) {
        console.error("RSVP marketing sync failed:", err);
      }
    }

    return { success: true, ticketCode, did: identityToken(email) };
  } catch (error: any) {
    console.error("submitRsvp error:", error?.message || error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
}

// ── Door check-in (staff only) ──────────────────────────────────────────────

function passcodeOk(passcode: string) {
  const expected = process.env.EVENT_CHECKIN_PASSCODE?.trim();
  return !!expected && passcode.trim() === expected;
}

export type TicketLookup =
  | {
      success: true;
      ticket: {
        _id: string;
        name: string;
        email: string;
        guests: number;
        ticketCode: string;
        checkedIn: boolean;
        checkedInAt?: string;
        eventTitle: string;
      };
      stats: { registered: number; checkedIn: number };
    }
  | { success: false; message: string };

async function eventStats(eventId: string) {
  const rows = await fetchAll<{ guests?: number; checkedIn?: boolean }>(
    (from, to) => db().from("rsvps").select("guests, checkedIn:checked_in").eq("event_id", eventId).order("id", { ascending: true }).range(from, to),
    "Loading RSVPs"
  );
  return rows.reduce(
    (acc, r) => {
      const people = 1 + (Number(r.guests) || 0);
      acc.registered += people;
      if (r.checkedIn) acc.checkedIn += people;
      return acc;
    },
    { registered: 0, checkedIn: 0 }
  );
}

export async function lookupTicket(code: string, passcode: string): Promise<TicketLookup> {
  if (!passcodeOk(passcode)) return { success: false, message: "Incorrect staff passcode." };

  const ticketCode = String(code || "").trim().toUpperCase();
  if (!ticketCode) return { success: false, message: "Enter a ticket code." };

  const row = unwrap(
    await db()
      .from("rsvps")
      .select("_id:id, name, email, guests, ticketCode:ticket_code, checkedIn:checked_in, checkedInAt:checked_in_at, eventId:event_id, event:events(title)")
      .eq("ticket_code", ticketCode)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    "Ticket lookup"
  ) as unknown as {
    _id: string;
    name: string | null;
    email: string | null;
    guests: number | null;
    ticketCode: string;
    checkedIn: boolean;
    checkedInAt: string | null;
    eventId: string;
    event: { title: string } | null;
  } | null;

  if (!row) return { success: false, message: `No ticket found for ${ticketCode}.` };

  return {
    success: true,
    ticket: {
      _id: row._id,
      name: row.name || "",
      email: row.email || "",
      guests: Number(row.guests) || 0,
      ticketCode: row.ticketCode,
      checkedIn: !!row.checkedIn,
      checkedInAt: row.checkedInAt || undefined,
      eventTitle: row.event?.title || "",
    },
    stats: await eventStats(row.eventId),
  };
}

export async function checkInTicket(code: string, passcode: string): Promise<TicketLookup> {
  const found = await lookupTicket(code, passcode);
  if (!found.success || found.ticket.checkedIn) return found;

  const checkedInAt = new Date().toISOString();
  unwrap(
    await db().from("rsvps").update({ checked_in: true, checked_in_at: checkedInAt }).eq("id", found.ticket._id),
    "Checking in"
  );
  await trackBrevoEvent(found.ticket.email, "event_attended", {
    event_title: found.ticket.eventTitle,
    guests: found.ticket.guests,
  });

  return lookupTicket(code, passcode);
}
