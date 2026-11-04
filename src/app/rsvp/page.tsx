// Short shareable link: dahriola.com/rsvp → the next upcoming event's page
import { redirect } from "next/navigation";
import { client } from "@/src/lib/sanity";

export const dynamic = "force-dynamic";

export default async function RsvpRedirect() {
  const slug: string | null = await client.fetch(
    `coalesce(
      *[_type == "event" && showPopup == true && dateTime(endDate) > dateTime(now())] | order(startDate asc)[0].slug.current,
      *[_type == "event" && dateTime(endDate) > dateTime(now())] | order(startDate asc)[0].slug.current
    )`
  );

  redirect(slug ? `/events/${slug}` : "/");
}
