// Short shareable link: dahriola.com/rsvp → the next upcoming event's page
import { redirect } from "next/navigation";
import { getNextEventSlug } from "@/src/lib/eventsData";

export const dynamic = "force-dynamic";

export default async function RsvpRedirect() {
  const slug = await getNextEventSlug();

  redirect(slug ? `/events/${slug}` : "/");
}
