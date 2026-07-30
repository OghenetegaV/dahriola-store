// src/sanity/schemaTypes/order.ts
// Full order record — everything the client needs on one page.
// Fields are grouped so the Studio form reads top-to-bottom: status → customer
// → delivery → items → payment breakdown.

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
  ],

  fields: [
    // ── Status ──────────────────────────────────────────────
    {
      name: 'delivered',
      title: 'Delivered',
      type: 'boolean',
      description: 'Tick once this order has been delivered to the customer.',
      initialValue: false,
      group: 'status',
    },
    {
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      readOnly: true,
      group: 'status',
    },
    {
      name: 'createdAt',
      title: 'Order Date',
      type: 'datetime',
      readOnly: true,
      group: 'status',
    },

    // ── Customer ────────────────────────────────────────────
    {
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      group: 'customer',
    },
    {
      name: 'customerEmail',
      title: 'Customer Email',
      type: 'string',
      group: 'customer',
    },
    {
      name: 'customerPhone',
      title: 'Customer Phone',
      type: 'string',
      group: 'customer',
    },

    // ── Delivery ────────────────────────────────────────────
    {
      name: 'shippingAddress',
      title: 'Shipping Address',
      type: 'text',
      group: 'delivery',
    },
    {
      name: 'shippingMethod',
      title: 'Shipping Method',
      type: 'string',
      description: 'Courier + service selected at checkout (e.g. DHL Domestic Express).',
      group: 'delivery',
    },

    // ── Items ───────────────────────────────────────────────
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
                subtitle: [
                  size && `Size: ${size}`,
                  qty && `Qty: ${qty}`,
                  print && `Print: ${print}`,
                ].filter(Boolean).join(' • '),
              };
            },
          },
        },
      ],
    },

    // ── Payment & totals ────────────────────────────────────
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      group: 'payment',
    },
    {
      name: 'subtotal',
      title: 'Subtotal',
      type: 'number',
      group: 'payment',
    },
    {
      name: 'shippingFee',
      title: 'Shipping Fee',
      type: 'number',
      group: 'payment',
    },
    {
      name: 'discountCode',
      title: 'Discount Code',
      type: 'string',
      group: 'payment',
    },
    {
      name: 'discountAmount',
      title: 'Discount Amount',
      type: 'number',
      group: 'payment',
    },
    {
      name: 'totalAmount',
      title: 'Total Paid',
      type: 'number',
      group: 'payment',
    },
    {
      name: 'paymentReference',
      title: 'Payment Reference',
      type: 'string',
      description: 'Paystack transaction reference.',
      readOnly: true,
      group: 'payment',
    },
    {
      name: 'paymentVerified',
      title: 'Payment Verified',
      type: 'boolean',
      description: 'Auto-set at checkout. True = Paystack confirmed the charge.',
      readOnly: true,
      initialValue: false,
      group: 'payment',
    },
  ],

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
    prepare({ name, order, total, currency, delivered, verified }: any) {
      const money = total != null ? `${currency || 'NGN'} ${Number(total).toLocaleString()}` : '';
      const flags = [
        delivered ? '✅ Delivered' : '📦 Pending',
        verified === false ? '⚠️ Unverified' : null,
      ].filter(Boolean).join('  ');
      return {
        title: `${name || 'Customer'} — ${money}`.trim(),
        subtitle: [order, flags].filter(Boolean).join('   ·   '),
      };
    },
  },
};
