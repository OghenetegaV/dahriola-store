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
    { name: 'gift', title: 'Gift' },
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
            { name: 'heightLength', title: 'Height / Length', type: 'string' },
            { name: 'gender', title: 'Gender', type: 'string' },
            { name: 'notes', title: 'Notes', type: 'text' },
          ],
          preview: {
            select: { title: 'name', size: 'size', qty: 'quantity', print: 'selectedPrintName', hl: 'heightLength', gender: 'gender' },
            prepare({ title, size, qty, print, hl, gender }: any) {
              return {
                title: title || 'Item',
                subtitle: [
                  size && `Size: ${size}`,
                  qty && `Qty: ${qty}`,
                  hl && `H/L: ${hl}`,
                  gender && `Gender: ${gender}`,
                  print && `Print: ${print}`,
                ].filter(Boolean).join(' • '),
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
    { name: 'totalAmount', title: 'Order Total', type: 'number', group: 'payment',
      description: 'Worked out by the server from current prices, coupon and shipping (NGN).' },
    { name: 'amountPaid', title: 'Amount Paid (Paystack)', type: 'number', readOnly: true, group: 'payment',
      description: 'What Paystack confirms was actually charged, in NGN.' },
    { name: 'displayCurrency', title: 'Shopper Viewed Prices In', type: 'string', readOnly: true, group: 'payment' },
    { name: 'displayTotal', title: 'Total Shown To Shopper', type: 'number', readOnly: true, group: 'payment' },
    { name: 'paymentReference', title: 'Payment Reference', type: 'string', readOnly: true, group: 'payment' },
    { name: 'paymentVerified', title: 'Payment Verified', type: 'boolean', readOnly: true, initialValue: false, group: 'payment',
      description: 'Ticked when Paystack confirms the payment and the amount matches the order total.' },
    { name: 'verificationNote', title: 'Verification Note', type: 'string', readOnly: true, group: 'payment',
      description: 'Why a payment could not be verified — check it in the Paystack dashboard.' },

    // ── Gift ──
    { name: 'isGift', title: 'Gift Order', type: 'boolean', readOnly: true, group: 'gift' },
    { name: 'giftRecipient', title: 'Gift For', type: 'string', readOnly: true, group: 'gift' },
    { name: 'giftDeliverToOwner', title: "Delivered To Recipient's Saved Address", type: 'boolean', readOnly: true, group: 'gift' },
    { name: 'giftMessage', title: 'Gift Message', type: 'text', readOnly: true, group: 'gift' },
    { name: 'giftListId', title: 'Shared List ID', type: 'string', readOnly: true, group: 'gift' },

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
      gift: 'isGift',
    },
    prepare({ name, order, total, currency, delivered, verified, email, gift }: any) {
      const money = total != null ? `${currency || 'NGN'} ${Number(total).toLocaleString()}` : '';
      const flags = [
        delivered ? '✅ Delivered' : '📦 Pending',
        verified === false ? '⚠️ Unverified' : null,
        gift ? '🎁 Gift' : null,
        email ? '📧 Opt-in' : null,
      ].filter(Boolean).join('  ');
      return {
        title: `${name || 'Customer'} — ${money}`.trim(),
        subtitle: [order, flags].filter(Boolean).join('   ·   '),
      };
    },
  },
};
