import { Ticket } from 'lucide-react'

export default {
  name: 'rsvp',
  title: 'RSVPs',
  type: 'document',
  icon: Ticket,

  fields: [
    { name: 'event', title: 'Event', type: 'reference', to: [{ type: 'event' }], readOnly: true },
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'phone', title: 'Phone', type: 'string' },
    { name: 'guests', title: 'Plus-ones', type: 'number', initialValue: 0 },
    { name: 'source', title: 'How they heard', type: 'string' },
    { name: 'marketingOptIn', title: 'Agreed to marketing emails', type: 'boolean', readOnly: true },
    { name: 'ticketCode', title: 'Ticket Code', type: 'string', readOnly: true },
    { name: 'checkedIn', title: 'Checked in', type: 'boolean', initialValue: false },
    { name: 'checkedInAt', title: 'Checked in at', type: 'datetime', readOnly: true },
    { name: 'reminder48SentAt', title: '2-day reminder sent', type: 'datetime', readOnly: true },
    { name: 'reminder24SentAt', title: '1-day reminder sent', type: 'datetime', readOnly: true },
    { name: 'followUpSentAt', title: 'Follow-up sent', type: 'datetime', readOnly: true },
    { name: 'createdAt', title: 'Registered', type: 'datetime', readOnly: true },
  ],

  orderings: [{ title: 'Newest', name: 'createdDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],

  preview: {
    select: { name: 'name', email: 'email', event: 'event.title', checkedIn: 'checkedIn', guests: 'guests' },
    prepare({ name, email, event, checkedIn, guests }: any) {
      return {
        title: `${name || email}${guests ? ` +${guests}` : ''}`,
        subtitle: `${event || ''}${checkedIn ? ' · checked in' : ''}`,
      }
    },
  },
}
