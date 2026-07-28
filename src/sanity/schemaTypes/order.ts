// src/sanity/schemaTypes/order.ts
// Updated:
// - item fields now match exactly what CheckoutClient writes (name, price,
//   quantity, size, selectedPrintName, notes) — this is why orders looked
//   blank/absent before: writes with unknown field names don't render.
// - added `paymentVerified` (written by checkout) and a `delivered` toggle
//   the client can tick when an order has shipped/arrived.
// - added a list preview + ordering so the Orders list is readable at a glance.

export default {
  name: 'order',
  title: 'Orders',
  type: 'document',
  fields: [
    {
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      readOnly: true,
    },
    {
      name: 'delivered',
      title: 'Delivered',
      type: 'boolean',
      description: 'Tick once this order has been delivered to the customer.',
      initialValue: false,
    },
    {
      name: 'paymentVerified',
      title: 'Payment Verified',
      type: 'boolean',
      description: 'Auto-set at checkout. True = Paystack confirmed the charge.',
      readOnly: true,
      initialValue: false,
    },
    {
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
    },
    {
      name: 'customerEmail',
      title: 'Customer Email',
      type: 'string',
    },
    {
      name: 'shippingAddress',
      title: 'Shipping Address',
      type: 'text',
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
    },
    {
      name: 'totalAmount',
      title: 'Total Amount',
      type: 'number',
    },
    {
      name: 'items',
      title: 'Ordered Items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Item Name', type: 'string' },
            { name: 'price', title: 'Price', type: 'number' },
            { name: 'quantity', title: 'Quantity', type: 'number' },
            { name: 'size', title: 'Size', type: 'string' },
            { name: 'selectedPrintName', title: 'Print / Material', type: 'string' },
            { name: 'notes', title: 'Notes', type: 'text' },
          ],
          preview: {
            select: { title: 'name', subtitle: 'size', qty: 'quantity' },
            prepare({ title, subtitle, qty }: { title?: string; subtitle?: string; qty?: number }) {
              return {
                title: title || 'Item',
                subtitle: [subtitle && `Size: ${subtitle}`, qty && `Qty: ${qty}`]
                  .filter(Boolean)
                  .join(' • '),
              };
            },
          },
        },
      ],
    },
    {
      name: 'createdAt',
      title: 'Order Date',
      type: 'datetime',
      readOnly: true,
    },
  ],

  // Newest first in the Studio, with a Delivered/Pending grouping option.
  orderings: [
    {
      title: 'Newest first',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Undelivered first',
      name: 'deliveredAsc',
      by: [
        { field: 'delivered', direction: 'asc' },
        { field: 'createdAt', direction: 'desc' },
      ],
    },
  ],

  preview: {
    select: {
      name: 'customerName',
      order: 'orderNumber',
      total: 'totalAmount',
      currency: 'currency',
      delivered: 'delivered',
      verified: 'paymentVerified',
    },
    prepare({
      name,
      order,
      total,
      currency,
      delivered,
      verified,
    }: {
      name?: string;
      order?: string;
      total?: number;
      currency?: string;
      delivered?: boolean;
      verified?: boolean;
    }) {
      const money =
        total != null ? `${currency || 'NGN'} ${Number(total).toLocaleString()}` : '';
      const flags = [
        delivered ? '✅ Delivered' : '📦 Pending',
        verified === false ? '⚠️ Unverified' : null,
      ]
        .filter(Boolean)
        .join('  ');
      return {
        title: `${name || 'Customer'} — ${money}`.trim(),
        subtitle: [order, flags].filter(Boolean).join('   ·   '),
      };
    },
  },
};
