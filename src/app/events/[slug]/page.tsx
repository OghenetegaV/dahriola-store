import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/react";
import { notFound } from "next/navigation";
import { client } from "@/src/lib/sanity";
import EventExperience from "@/src/components/events/EventExperience";
import { EVENT_SUMMARY_FIELDS, type EventSummary, eventUrl, formatEventDateRange } from "@/src/lib/events";

export const dynamic = "force-dynamic";

type EventPageData = EventSummary & { description?: PortableTextBlock[] };

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

  const description = `${event.tagline || event.title} — ${formatEventDateRange(event)}. RSVP now.`;
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

  const isPast = new Date(event.endDate) < new Date();

  return <EventExperience event={event} description={event.description} isPast={isPast} />;
}
