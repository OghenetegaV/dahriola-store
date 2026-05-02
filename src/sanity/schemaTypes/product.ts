export default {
  name: 'product',
  title: 'Products',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'briefDescription',
      title: 'Brief Description',
      type: 'text',
      rows: 3,
      description: 'Short product summary shown near the product title or on product cards.',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name' },
    },
    {
      name: 'productType',
      title: 'Product Type',
      type: 'string',
      options: {
        list: [
          { title: 'Ready-to-Wear', value: 'ready-to-wear' },
          { title: 'Bespoke / Custom', value: 'bespoke' },
        ],
        layout: 'radio',
      },
      initialValue: 'ready-to-wear',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    },
    {
      name: 'images',
      title: 'Editorial Imagery',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    },
    {
      name: 'prints',
      title: 'Available Prints',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'print' }],
        },
      ],
      description: 'Select the prints available for this product.',
    },
    {
      name: 'priceNGN',
      title: 'Price (NGN)',
      type: 'number',
      hidden: ({ document }: any) => document?.productType === 'bespoke',
    },
    {
      name: 'allowCustomization',
      title: 'Allow RTW Customization?',
      type: 'boolean',
      description: 'Enable to let customers request adjustments on this RTW piece.',
      hidden: ({ document }: any) => document?.productType === 'bespoke',
      initialValue: false,
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
  ],
};