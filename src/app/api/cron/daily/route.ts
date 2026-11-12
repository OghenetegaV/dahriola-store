// Daily scheduled job (Vercel Cron, see vercel.json — Hobby plan runs it once a day).
// Each task is independent so one failure doesn't stop the others.
import { NextResponse } from "next/server";
import { writeClient } from "@/src/lib/sanityWrite";
import {
  EVENT_RECAP_FIELDS,
  EVENT_SUMMARY_FIELDS,
  EVENT_TZ,
  type EventRecap,
  type EventSummary,
} from "@/src/lib/events";
import { sendEventReminder } from "@/src/app/actions/email";
import { sendEventFollowUpEmail } from "@/src/lib/mailer";
import { getMarketingSettings } from "@/src/lib/marketing";
import { Budget, runAnniversaries, runBackInStock, runBirthdays, runReviewRequests } from "@/src/lib/automations";
import { runAbandonedCarts } from "@/src/lib/abandonedCarts";
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

// After an event, once the owner ticks "Send follow-up emails?": a thank-you to
// everyone who checked in and a "we missed you" to everyone else who registered.
async function sendEventFollowUps(budget: Budget) {
  const events: EventRecap[] = await writeClient.fetch(
    `*[_type == "event" && followUpsEnabled == true && dateTime(endDate) < dateTime(now())]{${EVENT_SUMMARY_FIELDS}, ${EVENT_RECAP_FIELDS}}`
  );

  const summary: Record<string, { attended: number; missed: number; failed: number; remaining: number }> = {};

  for (const event of events) {
    if (budget.left <= 0) break;
    const rsvps: { _id: string; name: string; email: string; checkedIn?: boolean }[] = await writeClient.fetch(
      `*[_type == "rsvp" && event._ref == $eventId && !defined(followUpSentAt) && defined(email)] | order(createdAt asc)[0...${budget.left}]{ _id, name, email, checkedIn }`,
      { eventId: event._id }
    );

    const stats = { attended: 0, missed: 0, failed: 0, remaining: 0 };
    for (const rsvp of rsvps) {
      if (!budget.take()) break;
      const kind = rsvp.checkedIn ? "attended" : "missed";
      const ok = await sendEventFollowUpEmail(event, rsvp, kind);
      if (ok) {
        await writeClient
          .patch(rsvp._id)
          .set({ followUpSentAt: new Date().toISOString(), followUpType: kind })
          .commit();
        stats[kind]++;
      } else {
        stats.failed++;
      }
    }
    stats.remaining = await writeClient.fetch(
      `count(*[_type == "rsvp" && event._ref == $eventId && !defined(followUpSentAt) && defined(email)])`,
      { eventId: event._id }
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

  // Safety net for order status emails (normally sent instantly by the Sanity webhook)
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
