// src/sanity/schemaTypes/order.ts
// Adds marketing-consent fields (emailOptIn / textOptIn) so the client can see
// who agreed to receive news & offers — filter the Orders list by these to pull
// a marketing list. Everything else matches the full order record.

export default {
  name: 'order',
  title: 'Orders',
  type: 'document',

  groups: [
    { name: 'status', title: 'Status', default: true },
    { name: 'customer', title: 'Customer' },
    { name: 'delivery', title: 'Delivery' },
    { name: 'items', title: 'Items' },
    { name: 'payment', title: 'Payment & Totals' },
    { name: 'marketing', title: 'Marketing' },
  ],

  fields: [
    // ── Status ──
    { name: 'delivered', title: 'Delivered', type: 'boolean', initialValue: false, group: 'status',
      description: 'Tick once this order has been delivered to the customer.' },
    { name: 'orderNumber', title: 'Order Number', type: 'string', readOnly: true, group: 'status' },
    { name: 'createdAt', title: 'Order Date', type: 'datetime', readOnly: true, group: 'status' },

    // ── Customer ──
    { name: 'customerName', title: 'Customer Name', type: 'string', group: 'customer' },
    { name: 'customerEmail', title: 'Customer Email', type: 'string', group: 'customer' },
    { name: 'customerPhone', title: 'Customer Phone', type: 'string', group: 'customer' },

    // ── Delivery ──
    { name: 'shippingAddress', title: 'Shipping Address', type: 'text', group: 'delivery' },
    { name: 'shippingMethod', title: 'Shipping Method', type: 'string', group: 'delivery',
      description: 'Courier + service selected at checkout.' },

    // ── Items ──
    {
      name: 'items',
      title: 'Ordered Items',
      type: 'array',
      group: 'items',
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
            select: { title: 'name', size: 'size', qty: 'quantity', print: 'selectedPrintName' },
            prepare({ title, size, qty, print }: any) {
              return {
                title: title || 'Item',
                subtitle: [size && `Size: ${size}`, qty && `Qty: ${qty}`, print && `Print: ${print}`]
                  .filter(Boolean).join(' • '),
              };
            },
          },
        },
      ],
    },

    // ── Payment & totals ──
    { name: 'currency', title: 'Currency', type: 'string', group: 'payment' },
    { name: 'subtotal', title: 'Subtotal', type: 'number', group: 'payment' },
    { name: 'shippingFee', title: 'Shipping Fee', type: 'number', group: 'payment' },
    { name: 'discountCode', title: 'Discount Code', type: 'string', group: 'payment' },
    { name: 'discountAmount', title: 'Discount Amount', type: 'number', group: 'payment' },
    { name: 'totalAmount', title: 'Total Paid', type: 'number', group: 'payment' },
    { name: 'paymentReference', title: 'Payment Reference', type: 'string', readOnly: true, group: 'payment' },
    { name: 'paymentVerified', title: 'Payment Verified', type: 'boolean', readOnly: true, initialValue: false, group: 'payment' },

    // ── Marketing consent ──
    {
      name: 'emailOptIn',
      title: 'Opted in to Email offers',
      type: 'boolean',
      description: 'Customer ticked "Email me with news and offers" at checkout.',
      initialValue: false,
      group: 'marketing',
    },
    {
      name: 'textOptIn',
      title: 'Opted in to SMS/Text offers',
      type: 'boolean',
      description: 'Customer ticked "Text me with news and offers" at checkout.',
      initialValue: false,
      group: 'marketing',
    },
  ],

  orderings: [
    { title: 'Newest first', name: 'createdAtDesc', by: [{ field: 'createdAt', direction: 'desc' }] },
    { title: 'Undelivered first', name: 'deliveredAsc',
      by: [{ field: 'delivered', direction: 'asc' }, { field: 'createdAt', direction: 'desc' }] },
    { title: 'Email opt-ins first', name: 'emailOptInDesc',
      by: [{ field: 'emailOptIn', direction: 'desc' }, { field: 'createdAt', direction: 'desc' }] },
  ],

  preview: {
    select: {
      name: 'customerName', order: 'orderNumber', total: 'totalAmount',
      currency: 'currency', delivered: 'delivered', verified: 'paymentVerified', email: 'emailOptIn',
    },
    prepare({ name, order, total, currency, delivered, verified, email }: any) {
      const money = total != null ? `${currency || 'NGN'} ${Number(total).toLocaleString()}` : '';
      const flags = [
        delivered ? '✅ Delivered' : '📦 Pending',
        verified === false ? '⚠️ Unverified' : null,
        email ? '📧 Opt-in' : null,
      ].filter(Boolean).join('  ');
      return {
        title: `${name || 'Customer'} — ${money}`.trim(),
        subtitle: [order, flags].filter(Boolean).join('   ·   '),
      };
    },
  },
};
