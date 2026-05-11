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
          { title: 'Dresses', value: 'dresses' },
          { title: 'Co-ords', value: 'co-ords' },
          { title: 'Jackets', value: 'jackets' },
          { title: 'Skirts', value: 'skirts' },
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

    {
      name: 'compositionCare',
      title: 'Composition & Care',
      type: 'array',
      of: [{ type: 'block' }],
    },

    {
      name: 'sizeFit',
      title: 'Size & Fit',
      type: 'array',
      of: [{ type: 'block' }],
    },
  ],
}