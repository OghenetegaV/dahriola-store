import { CalendarDays } from 'lucide-react'

export default {
  name: 'event',
  title: 'Events',
  type: 'document',
  icon: CalendarDays,

  groups: [
    { name: 'details', title: 'Details', default: true },
    { name: 'promotion', title: 'Promotion' },
    { name: 'recap', title: 'Recap (after the event)' },
  ],

  fields: [
    // ── Details ──
    { name: 'title', title: 'Event Title', type: 'string', group: 'details',
      validation: (Rule: any) => Rule.required() },
    { name: 'slug', title: 'Link (slug)', type: 'slug', group: 'details',
      options: { source: 'title' }, validation: (Rule: any) => Rule.required(),
      description: 'Event page will be dahriola.com/events/<slug>' },
    { name: 'tagline', title: 'Pop-up Headline', type: 'string', group: 'details',
      initialValue: 'Something exciting is coming to Lagos!' },
    { name: 'startDate', title: 'Starts', type: 'datetime', group: 'details',
      description: 'First day + opening time (Lagos time). For a multi-day event, e.g. 19 Dec 10:00 am.',
      validation: (Rule: any) => Rule.required(),
      options: { timeStep: 15 } },
    { name: 'endDate', title: 'Ends', type: 'datetime', group: 'details',
      description: 'Last day + closing time. e.g. 20 Dec 8:00 pm → shown as "19 – 20 December, 10am – 8pm daily".',
      validation: (Rule: any) => Rule.required().min(Rule.valueOfField('startDate')),
      options: { timeStep: 15 } },
    { name: 'venueName', title: 'Venue Name', type: 'string', group: 'details' },
    { name: 'venueAddress', title: 'Venue Address', type: 'text', rows: 2, group: 'details' },
    { name: 'mapLink', title: 'Google Maps Link', type: 'url', group: 'details' },
    { name: 'flyer', title: 'Flyer', type: 'image', group: 'details', options: { hotspot: true } },
    { name: 'description', title: 'Description', type: 'array', of: [{ type: 'block' }], group: 'details' },
    { name: 'capacity', title: 'Capacity (people)', type: 'number', group: 'details',
      description: 'Optional. RSVPs close automatically when this many people (including guests) have registered.' },
    { name: 'maxGuests', title: 'Plus-ones allowed per RSVP', type: 'number', group: 'details', initialValue: 1,
      validation: (Rule: any) => Rule.min(0).max(10) },

    // ── Promotion ──
    { name: 'rsvpOpen', title: 'RSVP open?', type: 'boolean', group: 'promotion', initialValue: true },
    { name: 'showPopup', title: 'Show site pop-up?', type: 'boolean', group: 'promotion', initialValue: false,
      description: 'Replaces the 10% newsletter pop-up while on. Only one event should have this on at a time.' },
    // Retired: events now always use the main DAHRIOLA look. Kept so old data still loads.
    { name: 'theme', title: 'Theme', type: 'string', group: 'promotion', initialValue: 'default', hidden: true },

    // ── Recap ──
    { name: 'gallery', title: 'Gallery', type: 'array', group: 'recap',
      of: [{ type: 'image', options: { hotspot: true }, fields: [{ name: 'caption', title: 'Caption', type: 'string' }] }] },
    { name: 'videos', title: 'Video Links (YouTube / Instagram / TikTok)', type: 'array', of: [{ type: 'url' }], group: 'recap',
      description: 'Paste the link to a post or video. Best for longer videos.' },
    { name: 'videoFiles', title: 'Video Clips (upload)', type: 'array', group: 'recap',
      description: 'Short clips (under ~50MB each). For longer videos, post them on YouTube/Instagram and add the link above.',
      of: [{ type: 'file', options: { accept: 'video/*' }, fields: [{ name: 'caption', title: 'Caption', type: 'string' }] }] },
    { name: 'recap', title: 'Recap Story', type: 'array', of: [{ type: 'block' }], group: 'recap' },
    { name: 'featuredProducts', title: 'Shop the Look', type: 'array', group: 'recap',
      of: [{ type: 'reference', to: [{ type: 'product' }] }] },
    { name: 'followUpsEnabled', title: 'Send follow-up emails?', type: 'boolean', group: 'recap', initialValue: false,
      description: 'Turn on once the gallery and recap are ready. At the next daily run (8am Lagos time), everyone who checked in gets a thank-you email, and everyone who registered but did not come gets a "we missed you" email. Each person is only emailed once.' },
    { name: 'attendeeCode', title: 'Attendee Offer Code', type: 'string', group: 'recap',
      description: 'Optional coupon code included in the follow-up emails (create it under Coupons first).' },
  ],

  orderings: [{ title: 'Date, newest', name: 'startDesc', by: [{ field: 'startDate', direction: 'desc' }] }],

  preview: {
    select: { title: 'title', date: 'startDate', media: 'flyer', popup: 'showPopup' },
    prepare({ title, date, media, popup }: any) {
      const when = date ? new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Lagos' }) : 'No date'
      return { title, subtitle: `${when}${popup ? ' · pop-up on' : ''}`, media }
    },
  },
}
