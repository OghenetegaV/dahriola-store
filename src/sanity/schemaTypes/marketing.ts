// Marketing automation: settings the owner controls, plus the records the
// website keeps so nobody is emailed twice or after unsubscribing.

export const marketingSettings = {
  name: 'marketingSettings',
  title: 'Marketing Settings',
  type: 'document',
  fields: [
    { name: 'birthdayEnabled', title: 'Birthday emails', type: 'boolean', initialValue: true,
      description: 'On the 1st of each month, newsletter subscribers with a birthday that month get a personal code (and their wishlist, if they have shared one).' },
    { name: 'birthdayDiscount', title: 'Birthday discount (%)', type: 'number', initialValue: 15,
      validation: (Rule: any) => Rule.min(1).max(90) },

    { name: 'anniversaryEnabled', title: 'First-order anniversary emails', type: 'boolean', initialValue: true,
      description: "One year after a customer's first order (only customers who agreed to marketing emails)." },
    { name: 'anniversaryDiscount', title: 'Anniversary discount (%)', type: 'number', initialValue: 10,
      validation: (Rule: any) => Rule.min(1).max(90) },

    { name: 'codeValidDays', title: 'Personal codes are valid for (days)', type: 'number', initialValue: 30,
      validation: (Rule: any) => Rule.min(1).max(365) },

    { name: 'reviewRequestsEnabled', title: 'Review requests', type: 'boolean', initialValue: true,
      description: 'Emailed a few days after you tick "Delivered" on an order.' },
    { name: 'reviewRequestDelayDays', title: 'Days after delivery', type: 'number', initialValue: 5,
      validation: (Rule: any) => Rule.min(1).max(60) },

    { name: 'backInStockEnabled', title: 'Back-in-stock alerts', type: 'boolean', initialValue: true,
      description: 'Shows "Notify me" on sold-out prints and emails people when the print is back.' },

    { name: 'receiptsEnabled', title: 'Order receipts to customers', type: 'boolean', initialValue: true,
      description: 'A thank-you email with the order details, sent right after payment.' },

    { name: 'shippingEmailsEnabled', title: 'Order status emails', type: 'boolean', initialValue: true,
      description: 'Emails the customer when you change an order\'s status (in production, shipped, delivered…).' },

    { name: 'abandonedCartEnabled', title: 'Abandoned-checkout reminders', type: 'boolean', initialValue: true,
      description: 'One reminder to people who entered their email at checkout but did not pay (sent the next morning).' },
    { name: 'abandonedCartDiscount', title: 'Reminder discount (%)', type: 'number', initialValue: 0,
      description: 'Optional. 0 = no code. Above 0, the reminder includes a personal one-use code.',
      validation: (Rule: any) => Rule.min(0).max(50) },
  ],
  preview: { prepare: () => ({ title: 'Marketing Settings' }) },
};

export const stockAlert = {
  name: 'stockAlert',
  title: 'Back-in-Stock Requests',
  type: 'document',
  fields: [
    { name: 'email', title: 'Email', type: 'string', readOnly: true },
    { name: 'product', title: 'Product', type: 'reference', to: [{ type: 'product' }], readOnly: true },
    { name: 'print', title: 'Print', type: 'reference', to: [{ type: 'print' }], readOnly: true },
    { name: 'createdAt', title: 'Requested', type: 'datetime', readOnly: true },
    { name: 'notifiedAt', title: 'Emailed', type: 'datetime', readOnly: true },
  ],
  orderings: [{ title: 'Newest', name: 'createdDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],
  preview: {
    select: { email: 'email', product: 'product.name', print: 'print.name', notified: 'notifiedAt' },
    prepare({ email, product, print, notified }: { email?: string; product?: string; print?: string; notified?: string }) {
      return { title: `${product || 'Product'} · ${print || 'print'}`, subtitle: `${email || ''}${notified ? ' · emailed' : ' · waiting'}` };
    },
  },
};

export const marketingLog = {
  name: 'marketingLog',
  title: 'Marketing Emails Sent',
  type: 'document',
  readOnly: true,
  fields: [
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'kind', title: 'Email', type: 'string' },
    { name: 'key', title: 'Key', type: 'string', description: 'e.g. birthday-2026 — stops the same email going out twice.' },
    { name: 'couponCode', title: 'Code Included', type: 'string' },
    { name: 'sentAt', title: 'Sent', type: 'datetime' },
  ],
  orderings: [{ title: 'Newest', name: 'sentDesc', by: [{ field: 'sentAt', direction: 'desc' }] }],
  preview: { select: { title: 'email', subtitle: 'key' } },
};

export const marketingOptOut = {
  name: 'marketingOptOut',
  title: 'Unsubscribed',
  type: 'document',
  fields: [
    { name: 'email', title: 'Email', type: 'string', readOnly: true },
    { name: 'createdAt', title: 'Unsubscribed On', type: 'datetime', readOnly: true },
  ],
  preview: { select: { title: 'email', subtitle: 'createdAt' } },
};
