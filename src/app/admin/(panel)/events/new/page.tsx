import { PageHeader } from "@/src/components/admin/blocks";
import EventForm from "../EventForm";
import { loadEventOptions } from "../options";
import { requireAdmin } from "@/src/lib/admin/auth";

export const metadata = { title: "Add event" };

export default async function NewEventPage() {
  await requireAdmin();
  const options = await loadEventOptions();
  return (
    <>
      <PageHeader back={{ href: "/admin/events", label: "All events" }} title="Add an event" />
      <EventForm
        {...options}
        initial={{
          title: "",
          slug: "",
          tagline: "Something exciting is coming to Lagos!",
          startDate: "",
          endDate: "",
          venueName: "",
          venueAddress: "",
          mapLink: "",
          flyerUrl: null,
          description: "",
          capacity: "",
          maxGuests: "1",
          rsvpOpen: true,
          showPopup: false,
          gallery: [],
          videos: [],
          videoFiles: [],
          recap: "",
          featuredProductIds: [],
          followUpsEnabled: false,
          attendeeCode: "",
        }}
      />
    </>
  );
}
