import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Camera, MapPin } from "lucide-react";
import { client } from "@/src/lib/sanity";
import EventCountdown from "@/src/components/EventCountdown";
import {
  EVENTS_LIST_QUERY,
  type EventSummary,
  eventLocation,
  formatEventDateRange,
  formatEventHours,
  isEventPast,
} from "@/src/lib/events";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
  description: "DAHRIOLA pop-ups, launches and gatherings in Lagos. RSVP for what's next and relive the moments from past events.",
};

type ListedEvent = EventSummary & { cover?: string; photoCount?: number };

export default async function EventsPage() {
  const events: ListedEvent[] = await client.fetch(EVENTS_LIST_QUERY);
  const now = new Date();
  const upcoming = events.filter((e) => !isEventPast(e, now)).reverse(); // soonest first
  const past = events.filter((e) => isEventPast(e, now));

  return (
    <div className="event-experience relative min-h-screen overflow-hidden pt-32 pb-28">

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <header className="text-center">
          <p className="text-[10px] uppercase tracking-[0.45em] text-brand-beryl">DAHRIOLA</p>
          <h1 className="mt-4 font-display text-5xl tracking-[-0.04em] md:text-7xl">Events</h1>
          <p className="mx-auto mt-5 max-w-xl text-sm md:text-base text-neutral-500">
            Pop-ups, launches and gatherings. Come see the collection up close, and celebrate with us.
          </p>
        </header>

        {/* Upcoming */}
        <section className="mt-16">
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-brand-beryl">Coming up</h2>
          {upcoming.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              Nothing announced just yet. Join our newsletter to hear first about our next event.
            </p>
          ) : (
            <div className="mt-6 space-y-8">
              {upcoming.map((event) => (
                <Link
                  key={event._id}
                  href={`/events/${event.slug}`}
                  className="detail-card group grid overflow-hidden rounded-3xl md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                >
                  {event.flyerUrl && (
                    <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[420px] overflow-hidden bg-neutral-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${event.flyerUrl}?w=900&fit=max&auto=format`}
                        alt={`${event.title} flyer`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-7 md:p-10">
                    <h3 className="font-display text-3xl tracking-[-0.03em] md:text-4xl">{event.title}</h3>
                    {event.tagline && <p className="mt-3 text-neutral-600">{event.tagline}</p>}
                    <div className="mt-6 space-y-2 text-sm text-neutral-600">
                      <p className="flex items-start gap-2">
                        <CalendarDays size={16} className="mt-0.5 shrink-0 text-brand-beryl" />
                        {formatEventDateRange(event)} · {formatEventHours(event)}
                      </p>
                      {eventLocation(event) && (
                        <p className="flex items-start gap-2">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-brand-beryl" />
                          {eventLocation(event)}
                        </p>
                      )}
                    </div>
                    <EventCountdown target={event.startDate} variant="flip" className="mt-7 max-w-md" />
                    <span className="mt-8 inline-flex h-12 items-center gap-2 self-start rounded-full bg-neutral-950 px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
                      {event.rsvpOpen ? "RSVP now" : "View event"}
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Past */}
        {past.length > 0 && (
          <section className="mt-20">
            <h2 className="text-[11px] uppercase tracking-[0.4em] text-brand-beryl">Past events</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <Link key={event._id} href={`/events/${event.slug}`} className="detail-card group overflow-hidden rounded-3xl">
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                    {event.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${event.cover}?w=800&h=600&fit=crop&auto=format`}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    {!!event.photoCount && (
                      <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur">
                        <Camera size={12} /> {event.photoCount} photos
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-brand-beryl">
                      {formatEventDateRange(event, { weekday: false })}
                    </p>
                    <h3 className="mt-2 font-display text-2xl">{event.title}</h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-neutral-600 group-hover:text-brand-beryl">
                      View recap <ArrowRight size={13} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
