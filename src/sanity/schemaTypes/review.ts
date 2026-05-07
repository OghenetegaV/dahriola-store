export default {
  name: "review",
  title: "Reviews",
  type: "document",
  fields: [
    {
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "name",
      title: "Customer Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "rating",
      title: "Rating",
      type: "number",
      validation: (Rule: any) => Rule.required().min(1).max(5),
    },
    {
      name: "title",
      title: "Review Title",
      type: "string",
    },
    {
      name: "comment",
      title: "Comment",
      type: "text",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "approved",
      title: "Approved?",
      type: "boolean",
      initialValue: false,
      description: "Only approved reviews will show on the website.",
    },
  ],
};