import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { notFound } from "next/navigation";
import { client } from "@/src/lib/sanity";
import UpcomingEvent from "@/src/components/events/EventPage";
import EventRecap from "@/src/components/events/EventRecap";
import {
  EVENT_RECAP_FIELDS,
  EVENT_SUMMARY_FIELDS,
  type EventRecap as EventRecapData,
  eventUrl,
  formatEventDateRange,
  isEventPast,
} from "@/src/lib/events";

export const dynamic = "force-dynamic";

async function getEvent(slug: string): Promise<EventRecapData | null> {
  return client.fetch(`*[_type == "event" && slug.current == $slug][0]{${EVENT_SUMMARY_FIELDS}, ${EVENT_RECAP_FIELDS}}`, {
    slug,
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event not found" };

  const past = isEventPast(event);
  const description = past
    ? `Photos, videos and highlights from ${event.title} — ${formatEventDateRange(event)}.`
    : `${event.tagline || event.title} — ${formatEventDateRange(event)}. RSVP now.`;
  const cover = past ? event.gallery[0]?.url || event.flyerUrl : event.flyerUrl;
  const images = cover ? [{ url: `${cover}?w=1200&h=630&fit=crop` }] : ["/og-image.jpg"];

  return {
    title: past ? `${event.title} — Recap` : event.title,
    description,
    openGraph: { title: event.title, description, url: eventUrl(event.slug), images },
    twitter: { card: "summary_large_image", title: event.title, description, images },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  // Once the event is over, the page becomes its recap
  if (isEventPast(event)) return <EventRecap event={event} />;

  return <UpcomingEvent event={event} description={event.description as PortableTextBlock[] | undefined} />;
}
