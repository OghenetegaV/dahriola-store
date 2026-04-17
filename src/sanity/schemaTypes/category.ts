export default {
  name: 'category',
  title: 'Collection Category',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      options: {
        list: [
          { title: 'Pants', value: 'pants' },
          { title: 'Shorts', value: 'shorts' },
          { title: 'Bubu', value: 'bubu' },
          { title: 'Skirts', value: 'skirts' },
          { title: 'Dresses', value: 'dresses' },
          { title: 'Set', value: 'set' },
          { title: 'Bespoke / Custom', value: 'bespoke' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
  ],
}