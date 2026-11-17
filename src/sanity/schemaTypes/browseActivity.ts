// Products a known contact looked at (only with their consent), and where they
// are in the browse follow-up emails. Read-only in Studio.
const browseActivity = {
  name: 'browseActivity',
  title: 'Browsing (Personalised Emails)',
  type: 'document',
  readOnly: true,
  fields: [
    { name: 'email', title: 'Email', type: 'string' },
    {
      name: 'views',
      title: 'Recently viewed',
      type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'productId', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'count', type: 'number' },
        { name: 'lastAt', type: 'datetime' },
      ], preview: { select: { title: 'name', subtitle: 'lastAt' } } }],
    },
    { name: 'lastViewedAt', title: 'Last viewed', type: 'datetime' },
    { name: 'lastEngagedAt', title: 'Last clicked an email', type: 'datetime' },
    { name: 'sequenceStartedAt', title: 'Follow-ups started', type: 'datetime' },
    { name: 'step', title: 'Follow-up emails sent', type: 'number' },
    { name: 'lastStepAt', title: 'Last follow-up sent', type: 'datetime' },
    { name: 'convertedAt', title: 'Bought', type: 'datetime' },
  ],
  orderings: [{ title: 'Latest activity', name: 'lastDesc', by: [{ field: 'lastViewedAt', direction: 'desc' }] }],
  preview: {
    select: { email: 'email', step: 'step', bought: 'convertedAt' },
    prepare({ email, step, bought }: { email?: string; step?: number; bought?: string }) {
      return { title: email || 'Unknown', subtitle: bought ? '✅ Bought' : `${step || 0} of 5 follow-ups sent` };
    },
  },
};

export default browseActivity;
