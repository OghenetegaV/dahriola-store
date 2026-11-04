"use server";

import { randomInt } from "crypto";
import { writeClient } from "@/src/lib/sanityWrite";
import { appendRow } from "@/src/lib/googleSheets";
import { EVENT_SUMMARY_FIELDS, type EventSummary } from "@/src/lib/events";
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
  | { success: true; ticketCode: string; alreadyRegistered?: boolean }
  | { success: false; message: string };

export async function submitRsvp(input: RsvpInput): Promise<RsvpResult> {
  const name = String(input.name || "").trim();
  const email = String(input.email || "").trim().toLowerCase();
  const phone = String(input.phone || "").trim();
  const source = String(input.source || "").trim();

  if (!name) return { success: false, message: "Please enter your name." };
  if (!EMAIL_REGEX.test(email)) return { success: false, message: "Please enter a valid email address." };
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error("submitRsvp: SANITY_API_WRITE_TOKEN is not set");
    return { success: false, message: "RSVP is unavailable right now. Please try again later." };
  }

  try {
    const event: EventSummary | null = await writeClient.fetch(
      `*[_type == "event" && _id == $id][0]{${EVENT_SUMMARY_FIELDS}}`,
      { id: input.eventId }
    );

    if (!event) return { success: false, message: "This event could not be found." };
    if (!event.rsvpOpen || new Date(event.endDate) < new Date()) {
      return { success: false, message: "RSVPs for this event are closed." };
    }

    const maxGuests = Math.max(0, event.maxGuests ?? 1);
    const guests = Math.min(Math.max(0, Math.floor(Number(input.guests) || 0)), maxGuests);

    const existing = await writeClient.fetch(
      `*[_type == "rsvp" && event._ref == $eventId && lower(email) == $email][0]{ name, guests, ticketCode }`,
      { eventId: event._id, email }
    );

    // Already registered: resend their ticket rather than creating a duplicate
    if (existing) {
      await sendRsvpConfirmation(event, {
        name: existing.name || name,
        email,
        guests: existing.guests,
        ticketCode: existing.ticketCode,
      });
      return { success: true, ticketCode: existing.ticketCode, alreadyRegistered: true };
    }

    if (event.capacity) {
      const taken: number[] = await writeClient.fetch(
        `*[_type == "rsvp" && event._ref == $eventId].guests`,
        { eventId: event._id }
      );
      const headcount = taken.reduce((sum, g) => sum + 1 + (Number(g) || 0), 0);
      if (headcount + 1 + guests > event.capacity) {
        return { success: false, message: "Sorry, this event is now full." };
      }
    }

    const ticketCode = makeTicketCode();
    const createdAt = new Date().toISOString();

    await writeClient.create({
      _type: "rsvp",
      event: { _type: "reference", _ref: event._id },
      name,
      email,
      phone,
      guests,
      source,
      marketingOptIn: !!input.marketingOptIn,
      ticketCode,
      checkedIn: false,
      createdAt,
    });

    // The RSVP is saved — Sheet and email failures are logged but don't fail it
    try {
      await appendRow(
        SHEET_HEADERS,
        {
          Name: name,
          Email: email,
          Phone: phone,
          "Plus-ones": guests,
          "How they heard": source,
          "Marketing opt-in": input.marketingOptIn ? "Yes" : "No",
          "Ticket Code": ticketCode,
          "Registered At": createdAt,
        },
        `RSVP – ${event.title}`.slice(0, 99),
        // Optional separate spreadsheet for RSVPs; falls back to the newsletter one
        process.env.RSVP_SHEET_ID
      );
    } catch (sheetErr: any) {
      console.error("RSVP sheet append failed:", sheetErr?.message || sheetErr);
    }

    await sendRsvpConfirmation(event, { name, email, guests, ticketCode });

    return { success: true, ticketCode };
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
  const rows: { guests?: number; checkedIn?: boolean }[] = await writeClient.fetch(
    `*[_type == "rsvp" && event._ref == $eventId]{ guests, checkedIn }`,
    { eventId }
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

  const ticket = await writeClient.fetch(
    `*[_type == "rsvp" && ticketCode == $code] | order(createdAt desc)[0]{
      _id, name, email, guests, ticketCode, checkedIn, checkedInAt,
      "eventId": event._ref, "eventTitle": event->title
    }`,
    { code: ticketCode }
  );

  if (!ticket) return { success: false, message: `No ticket found for ${ticketCode}.` };

  return {
    success: true,
    ticket: { ...ticket, guests: Number(ticket.guests) || 0, checkedIn: !!ticket.checkedIn },
    stats: await eventStats(ticket.eventId),
  };
}

export async function checkInTicket(code: string, passcode: string): Promise<TicketLookup> {
  const found = await lookupTicket(code, passcode);
  if (!found.success || found.ticket.checkedIn) return found;

  const checkedInAt = new Date().toISOString();
  await writeClient.patch(found.ticket._id).set({ checkedIn: true, checkedInAt }).commit();

  return lookupTicket(code, passcode);
}
