import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortableText } from "@portabletext/react";
import { CalendarDays, MapPin } from "lucide-react";
import { client } from "@/src/lib/sanity";
import EventCountdown from "@/src/components/EventCountdown";
import RsvpForm from "@/src/components/RsvpForm";
import {
  EVENT_SUMMARY_FIELDS,
  type EventSummary,
  eventLocation,
  eventUrl,
  formatEventDate,
  formatEventTime,
} from "@/src/lib/events";

export const dynamic = "force-dynamic";

type EventPageData = EventSummary & { description?: any[] };

async function getEvent(slug: string): Promise<EventPageData | null> {
  return client.fetch(
    `*[_type == "event" && slug.current == $slug][0]{${EVENT_SUMMARY_FIELDS}, description}`,
    { slug }
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found" };

  const description = `${event.tagline || event.title} — ${formatEventDate(event.startDate)}. RSVP now.`;
  const images = event.flyerUrl ? [{ url: `${event.flyerUrl}?w=1200&h=630&fit=crop` }] : ["/og-image.jpg"];

  return {
    title: event.title,
    description,
    openGraph: { title: event.title, description, url: eventUrl(event.slug), images },
    twitter: { card: "summary_large_image", title: event.title, description, images },
  };
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const festive = event.theme !== "default";
  const isPast = new Date(event.endDate) < new Date();
  const location = eventLocation(event);

  return (
    <div className={`${festive ? "theme-christmas" : "bg-white text-black"} relative overflow-hidden min-h-screen pt-32 pb-24`}>
      {festive && <div className="snowfall" aria-hidden="true" />}

      <div className="relative max-w-6xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-12 items-start">
        {event.flyerUrl && (
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${event.flyerUrl}?w=1200&fit=max&auto=format`}
              alt={`${event.title} flyer`}
              className="w-full h-auto"
            />
          </div>
        )}

        <div className="relative">
          <span className="text-[10px] tracking-[0.4em] uppercase festive-accent">
            {festive ? "A DAHRIOLA Christmas" : "DAHRIOLA Events"}
          </span>
          <h1 className="mt-5 font-display text-4xl md:text-5xl leading-tight">{event.title}</h1>
          {event.tagline && <p className="mt-4 text-lg opacity-90">{event.tagline}</p>}

          <div className="mt-8 space-y-3 text-sm">
            <p className="flex items-start gap-3">
              <CalendarDays size={16} className="mt-0.5 shrink-0 festive-accent" />
              <span>
                {formatEventDate(event.startDate)}
                <br />
                {formatEventTime(event.startDate)} – {formatEventTime(event.endDate)}
              </span>
            </p>
            {location && (
              <p className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 festive-accent" />
                <span>
                  {location}
                  {event.mapLink && (
                    <>
                      {" · "}
                      <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                        Open map
                      </a>
                    </>
                  )}
                </span>
              </p>
            )}
          </div>

          {!isPast && <EventCountdown target={event.startDate} className="mt-8" />}

          {event.description && (
            <div className="mt-8 text-sm leading-relaxed opacity-90 space-y-4">
              <PortableText value={event.description} />
            </div>
          )}

          <div className="mt-10 pt-8 border-t border-current/20">
            {isPast ? (
              <p className="text-sm uppercase tracking-[0.25em]">This event has ended. Thank you to everyone who came.</p>
            ) : (
              <>
                <h2 className="font-display text-2xl mb-6">Reserve your spot</h2>
                <RsvpForm event={event} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
