// Daily scheduled job (Vercel Cron, see vercel.json — Hobby plan runs it once a day).
// Each task is independent so one failure doesn't stop the others.
import { NextResponse } from "next/server";
import { COUNT, countRows, db, fetchAll, unwrap } from "@/src/lib/supabase/admin";
import { EVENT_TZ } from "@/src/lib/events";
import { listFollowUpEvents, listUpcomingEvents } from "@/src/lib/eventsData";
import { sendEventReminder } from "@/src/app/actions/email";
import { sendEventFollowUpEmail } from "@/src/lib/mailer";
import { getMarketingSettings } from "@/src/lib/marketing";
import { Budget, runAnniversaries, runBackInStock, runBirthdays, runReviewRequests } from "@/src/lib/automations";
import { runAbandonedCarts } from "@/src/lib/abandonedCarts";
import { runBrowseSequences } from "@/src/lib/browseSequences";
import { processOrderStatusUpdates } from "@/src/lib/orderStatus";

// Gmail allows ~500 emails a day (Brevo's free plan 300); leave room for
// orders, RSVPs and gift emails. Anything over goes out on the next run.
const FOLLOW_UP_DAILY_LIMIT = 200;
const MARKETING_DAILY_LIMIT = 150;
// Stop starting new emails after this long, to finish inside Vercel's limit
const TIME_LIMIT_MS = 240_000;

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  const events = await listUpcomingEvents();

  const summary: Record<string, { sent: number; failed: number }> = {};

  for (const event of events) {
    const daysOut = daysBetween(lagosDate(now), lagosDate(new Date(event.startDate)));
    const kind = daysOut === 2 ? "48h" : daysOut === 1 ? "24h" : null;
    if (!kind) continue;

    const sentField = kind === "48h" ? "reminder48_sent_at" : "reminder24_sent_at";
    // Read the whole list first: rows drop out of this filter as they are marked sent
    const rsvps = await fetchAll<{ _id: string; name: string; email: string; guests?: number; ticketCode: string }>(
      (from, to) =>
        db()
          .from("rsvps")
          .select("_id:id, name, email, guests, ticketCode:ticket_code")
          .eq("event_id", event._id)
          .is(sentField, null)
          .not("email", "is", null)
          .order("id", { ascending: true })
          .range(from, to),
      "Loading RSVPs for reminders"
    );

    const stats = { sent: 0, failed: 0 };
    for (const rsvp of rsvps) {
      const res = await sendEventReminder(event, rsvp, kind);
      if (res.success) {
        unwrap(
          await db().from("rsvps").update({ [sentField]: new Date().toISOString() }).eq("id", rsvp._id),
          "Recording the reminder"
        );
        stats.sent++;
      } else {
        stats.failed++;
      }
    }
    summary[`${event.title} (${kind})`] = stats;
  }

  return summary;
}

// After an event, once the owner ticks "Send follow-up emails?": a thank-you to
// everyone who checked in and a "we missed you" to everyone else who registered.
async function sendEventFollowUps(budget: Budget) {
  const events = await listFollowUpEvents();

  const summary: Record<string, { attended: number; missed: number; failed: number; remaining: number }> = {};

  for (const event of events) {
    if (budget.left <= 0) break;
    const rsvps = unwrap(
      await db()
        .from("rsvps")
        .select("_id:id, name, email, checkedIn:checked_in")
        .eq("event_id", event._id)
        .is("follow_up_sent_at", null)
        .not("email", "is", null)
        .order("created_at", { ascending: true })
        .limit(Math.max(1, budget.left)),
      "Loading RSVPs for follow-ups"
    ) as { _id: string; name: string; email: string; checkedIn?: boolean }[];

    const stats = { attended: 0, missed: 0, failed: 0, remaining: 0 };
    for (const rsvp of rsvps) {
      if (!budget.take()) break;
      const kind = rsvp.checkedIn ? "attended" : "missed";
      const ok = await sendEventFollowUpEmail(event, rsvp, kind);
      if (ok) {
        unwrap(
          await db()
            .from("rsvps")
            .update({ follow_up_sent_at: new Date().toISOString(), follow_up_type: kind })
            .eq("id", rsvp._id),
          "Recording the follow-up"
        );
        stats[kind]++;
      } else {
        stats.failed++;
      }
    }
    stats.remaining = await countRows(
      db().from("rsvps").select("*", COUNT).eq("event_id", event._id).is("follow_up_sent_at", null).not("email", "is", null)
    );
    summary[event.title] = stats;
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

  const deadline = now.getTime() + TIME_LIMIT_MS;

  // Safety net for order status emails (normally sent as soon as an order is saved in the dashboard)
  try {
    results.orderStatusEmails = await processOrderStatusUpdates();
  } catch (error) {
    console.error("Cron: order status emails failed:", error);
    results.orderStatusEmails = { error: error instanceof Error ? error.message : "failed" };
  }

  try {
    results.eventFollowUps = await sendEventFollowUps(new Budget(FOLLOW_UP_DAILY_LIMIT, deadline));
  } catch (error: any) {
    console.error("Cron: event follow-ups failed:", error?.message || error);
    results.eventFollowUps = { error: error?.message || "failed" };
  }

  // Marketing automations share one allowance
  try {
    const settings = await getMarketingSettings();
    const budget = new Budget(MARKETING_DAILY_LIMIT, deadline);
    const tasks = {
      backInStock: () => runBackInStock(settings, budget), // people asked for these — first
      abandonedCarts: () => runAbandonedCarts(settings, budget),
      browseFollowUps: () => runBrowseSequences(settings, budget),
      reviewRequests: () => runReviewRequests(settings, budget),
      birthdays: () => runBirthdays(settings, budget),
      anniversaries: () => runAnniversaries(settings, budget),
    };
    for (const [name, task] of Object.entries(tasks)) {
      try {
        results[name] = await task();
      } catch (error) {
        console.error(`Cron: ${name} failed:`, error);
        results[name] = { error: error instanceof Error ? error.message : "failed" };
      }
    }
  } catch (error) {
    console.error("Cron: marketing settings failed:", error);
  }

  console.log("Daily cron results:", JSON.stringify(results));
  return NextResponse.json({ ok: true, ranAt: now.toISOString(), results });
}
