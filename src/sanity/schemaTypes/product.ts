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
          { title: 'Ready-to-Wear', value: 'rtw' },
          { title: 'Bespoke / Custom', value: 'bespoke' },
        ],
        layout: 'radio',
      },
      initialValue: 'rtw',
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
      name: 'priceNGN',
      title: 'Price (NGN)',
      type: 'number',
      hidden: ({ document }: any) => document?.productType === 'bespoke',
    },
    {
      name: 'priceUSD',
      title: 'Price (USD)',
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
      of: [{ type: 'block' }] // This enables paragraphs, bold, and lists
    }
  ],
}