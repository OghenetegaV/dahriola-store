export default {
  name: 'order',
  title: 'Orders',
  type: 'document',
  fields: [
    {
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
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
        },
      ],
    },
    {
      name: 'createdAt',
      title: 'Order Date',
      type: 'datetime',
    },
  ],
};