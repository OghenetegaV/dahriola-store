export default {
  name: "print",
  title: "Prints / Materials",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Print Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "image",
      title: "Print Image",
      type: "image",
      options: { hotspot: true },
    },
    {
      name: "stockQuantity",
      title: "Available Outfit Quantity",
      type: "number",
      description:
        "How many outfits can still be made from this material/print.",
      initialValue: 0,
      validation: (Rule: any) => Rule.min(0),
    },
    {
      name: "lowStockThreshold",
      title: "Low Stock Alert Threshold",
      type: "number",
      description:
        "Send alert when stock reaches this number or below.",
      initialValue: 2,
      validation: (Rule: any) => Rule.min(0),
    },
    {
      name: "isActive",
      title: "Available on Website?",
      type: "boolean",
      initialValue: true,
      description:
        "Turn this off if you want to hide this print manually.",
    },
  ],
};