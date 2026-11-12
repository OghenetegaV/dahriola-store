// Checkouts where someone entered their email but didn't pay. Used for one
// reminder email; marked recovered when they complete an order.
const abandonedCart = {
  name: 'abandonedCart',
  title: 'Abandoned Checkouts',
  type: 'document',
  readOnly: true,
  fields: [
    { name: 'email', title: 'Email', type: 'string' },
    { name: 'name', title: 'Name', type: 'string' },
    { name: 'subtotal', title: 'Cart Value (NGN)', type: 'number' },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'productId', title: 'Product ID', type: 'string', hidden: true },
            { name: 'name', title: 'Item', type: 'string' },
            { name: 'quantity', title: 'Qty', type: 'number' },
            { name: 'size', title: 'Size', type: 'string' },
            { name: 'selectedPrintId', type: 'string', hidden: true },
            { name: 'selectedPrintName', title: 'Print', type: 'string' },
            { name: 'heightLength', title: 'Height / Length', type: 'string' },
            { name: 'gender', title: 'Fit', type: 'string' },
            { name: 'notes', title: 'Notes', type: 'string' },
          ],
          preview: { select: { title: 'name', subtitle: 'size' } },
        },
      ],
    },
    { name: 'createdAt', title: 'Started', type: 'datetime' },
    { name: 'updatedAt', title: 'Last Activity', type: 'datetime' },
    { name: 'reminderSentAt', title: 'Reminder Sent', type: 'datetime' },
    { name: 'recoveredAt', title: 'Completed Order', type: 'datetime' },
  ],
  orderings: [{ title: 'Latest activity', name: 'updatedDesc', by: [{ field: 'updatedAt', direction: 'desc' }] }],
  preview: {
    select: { email: 'email', value: 'subtotal', recovered: 'recoveredAt', reminded: 'reminderSentAt' },
    prepare({ email, value, recovered, reminded }: { email?: string; value?: number; recovered?: string; reminded?: string }) {
      const state = recovered ? '✅ Completed' : reminded ? '📧 Reminded' : '⏳ Waiting';
      return { title: email || 'Unknown', subtitle: `₦${Number(value || 0).toLocaleString()} · ${state}` };
    },
  },
};

export default abandonedCart;
