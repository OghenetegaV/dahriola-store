import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/src/lib/eventsData";
import UpcomingEvent from "@/src/components/events/EventPage";
import EventRecap from "@/src/components/events/EventRecap";
import {
  type EventRecap as EventRecapData,
  eventUrl,
  formatEventDateRange,
  isEventPast,
} from "@/src/lib/events";
import { imageUrl } from "@/src/lib/images";

export const dynamic = "force-dynamic";

async function getEvent(slug: string): Promise<EventRecapData | null> {
  return getEventBySlug(slug);
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
  const images = cover ? [{ url: imageUrl(cover, { width: 1200, height: 630 }) }] : ["/og-image.jpg"];

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

  return <UpcomingEvent event={event} description={event.description} />;
}
