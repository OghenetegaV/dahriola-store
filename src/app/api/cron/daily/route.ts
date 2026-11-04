// Daily scheduled job (Vercel Cron, see vercel.json — Hobby plan runs it once a day).
// Each task is independent so one failure doesn't stop the others.
import { NextResponse } from "next/server";
import { writeClient } from "@/src/lib/sanityWrite";
import { EVENT_SUMMARY_FIELDS, EVENT_TZ, type EventSummary } from "@/src/lib/events";
import { sendEventReminder } from "@/src/app/actions/email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Calendar date in Lagos as YYYY-MM-DD
function lagosDate(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: EVENT_TZ });
}

function daysBetween(fromYmd: string, toYmd: string) {
  return Math.round((Date.parse(toYmd) - Date.parse(fromYmd)) / 86_400_000);
}

// "Two days to go" goes out two Lagos calendar days before the event,
// "See you tomorrow" the day before — so the wording is always accurate.
async function sendEventReminders(now: Date) {
  const events: EventSummary[] = await writeClient.fetch(
    `*[_type == "event" && dateTime(startDate) > dateTime(now())]{${EVENT_SUMMARY_FIELDS}}`
  );

  const summary: Record<string, { sent: number; failed: number }> = {};

  for (const event of events) {
    const daysOut = daysBetween(lagosDate(now), lagosDate(new Date(event.startDate)));
    const kind = daysOut === 2 ? "48h" : daysOut === 1 ? "24h" : null;
    if (!kind) continue;

    const sentField = kind === "48h" ? "reminder48SentAt" : "reminder24SentAt";
    const rsvps: { _id: string; name: string; email: string; guests?: number; ticketCode: string }[] =
      await writeClient.fetch(
        `*[_type == "rsvp" && event._ref == $eventId && !defined(${sentField})]{ _id, name, email, guests, ticketCode }`,
        { eventId: event._id }
      );

    const stats = { sent: 0, failed: 0 };
    for (const rsvp of rsvps) {
      const res = await sendEventReminder(event, rsvp, kind);
      if (res.success) {
        await writeClient.patch(rsvp._id).set({ [sentField]: new Date().toISOString() }).commit();
        stats.sent++;
      } else {
        stats.failed++;
      }
    }
    summary[`${event.title} (${kind})`] = stats;
  }

  return summary;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, unknown> = {};

  try {
    results.eventReminders = await sendEventReminders(now);
  } catch (error: any) {
    console.error("Cron: event reminders failed:", error?.message || error);
    results.eventReminders = { error: error?.message || "failed" };
  }

  console.log("Daily cron results:", JSON.stringify(results));
  return NextResponse.json({ ok: true, ranAt: now.toISOString(), results });
}
