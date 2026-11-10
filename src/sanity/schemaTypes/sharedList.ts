// A wishlist or cart a customer has shared by link so someone else can buy
// the items for them. The delivery address is private: it is only read on the
// server when a gift order is placed, and never sent to the person paying.

const sharedList = {
  name: 'sharedList',
  title: 'Shared Lists (Gifting)',
  type: 'document',

  groups: [
    { name: 'list', title: 'List', default: true },
    { name: 'owner', title: 'Owner' },
    { name: 'delivery', title: 'Private Delivery Address' },
  ],

  fields: [
    { name: 'kind', title: 'Type', type: 'string', group: 'list', readOnly: true,
      options: { list: [{ title: 'Wishlist', value: 'wishlist' }, { title: 'Cart', value: 'cart' }] } },
    { name: 'publicId', title: 'Public Link ID', type: 'string', group: 'list', readOnly: true,
      description: 'The list is shared at dahriola.com/list/<this id>.' },
    { name: 'message', title: 'Message To Gifters', type: 'text', rows: 2, group: 'list' },
    { name: 'keepSurprise', title: 'Keep It A Surprise', type: 'boolean', group: 'list', initialValue: true,
      description: "Gift emails to the owner don't say which items were bought." },
    { name: 'active', title: 'Active', type: 'boolean', group: 'list', initialValue: true,
      description: 'Untick to switch the share link off.' },
    {
      name: 'items',
      title: 'Items',
      type: 'array',
      group: 'list',
      of: [
        {
          type: 'object',
          name: 'sharedListItem',
          fields: [
            { name: 'product', title: 'Product', type: 'reference', to: [{ type: 'product' }] },
            { name: 'productName', title: 'Product Name', type: 'string' },
            { name: 'size', title: 'Size', type: 'string' },
            { name: 'selectedPrintId', title: 'Print ID', type: 'string', hidden: true },
            { name: 'selectedPrintName', title: 'Print / Material', type: 'string' },
            { name: 'heightLength', title: 'Height / Length', type: 'string' },
            { name: 'gender', title: 'Fit', type: 'string' },
            { name: 'notes', title: 'Notes', type: 'text', rows: 2 },
            { name: 'quantity', title: 'Quantity', type: 'number', initialValue: 1 },
            { name: 'purchased', title: 'Bought As A Gift', type: 'boolean', initialValue: false },
            { name: 'purchasedAt', title: 'Bought At', type: 'datetime' },
            { name: 'purchasedBy', title: 'Bought By', type: 'string' },
            { name: 'orderReference', title: 'Order Reference', type: 'string' },
          ],
          preview: {
            select: { title: 'productName', size: 'size', print: 'selectedPrintName', bought: 'purchased' },
            prepare({ title, size, print, bought }: { title?: string; size?: string; print?: string; bought?: boolean }) {
              return {
                title: `${bought ? '🎁 ' : ''}${title || 'Item'}`,
                subtitle: [size && `Size ${size}`, print].filter(Boolean).join(' · '),
              };
            },
          },
        },
      ],
    },

    { name: 'ownerName', title: 'Owner Name', type: 'string', group: 'owner' },
    { name: 'ownerEmail', title: 'Owner Email', type: 'string', group: 'owner',
      description: 'Used for the "manage your list" link and gift notifications.' },
    { name: 'editTokenHash', title: 'Edit Token (hashed)', type: 'string', group: 'owner', readOnly: true, hidden: true },

    {
      name: 'deliveryAddress',
      title: 'Delivery Address',
      type: 'object',
      group: 'delivery',
      description: 'Never shown to the person paying.',
      fields: [
        { name: 'name', title: 'Recipient Name', type: 'string' },
        { name: 'phone', title: 'Phone', type: 'string' },
        { name: 'line1', title: 'Address', type: 'string' },
        { name: 'apartment', title: 'Apartment / Suite', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'state', title: 'State / Region', type: 'string' },
        { name: 'stateCode', title: 'State Code', type: 'string', hidden: true },
        { name: 'country', title: 'Country Code', type: 'string' },
        { name: 'postalCode', title: 'Postal Code', type: 'string' },
      ],
    },

    { name: 'createdAt', title: 'Created', type: 'datetime', readOnly: true, group: 'list' },
    { name: 'updatedAt', title: 'Updated', type: 'datetime', readOnly: true, group: 'list' },
  ],

  orderings: [{ title: 'Newest first', name: 'createdDesc', by: [{ field: 'createdAt', direction: 'desc' }] }],

  preview: {
    select: { owner: 'ownerName', kind: 'kind', items: 'items', active: 'active' },
    prepare({ owner, kind, items, active }: { owner?: string; kind?: string; items?: { purchased?: boolean }[]; active?: boolean }) {
      const count = Array.isArray(items) ? items.length : 0;
      const bought = Array.isArray(items) ? items.filter((i) => i.purchased).length : 0;
      return {
        title: `${owner || 'Someone'}'s ${kind === 'cart' ? 'cart' : 'wishlist'}`,
        subtitle: `${count} item${count === 1 ? '' : 's'} · ${bought} gifted${active === false ? ' · link off' : ''}`,
      };
    },
  },
};

export default sharedList;
