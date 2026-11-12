import { Tag } from 'lucide-react'

export default {
  name: 'coupon',
  title: 'Coupons & Discounts',
  type: 'document',
  icon: Tag,
  fields: [
    {
      name: 'code',
      title: 'Coupon Code',
      type: 'string',
      description: 'The exact code customers enter (e.g., DAHRIOLA20)',
      validation: (Rule: any) => Rule.required().uppercase(),
    },
    {
      name: 'discountType',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage (%)', value: 'percentage' },
          { title: 'Fixed Amount (₦)', value: 'fixed' },
        ],
        layout: 'radio',
      },
      initialValue: 'percentage',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'discountValue',
      title: 'Discount Value',
      type: 'number',
      description: 'Enter 10 for 10% or 5000 for ₦5,000 off',
      validation: (Rule: any) => Rule.required().min(0),
    },
    {
      name: 'isActive',
      title: 'Is Active?',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'firstOrderOnly',
      title: 'First Order Only?',
      type: 'boolean',
      description: 'Only works for customers who have never placed an order (checked by email)',
      initialValue: false,
    },
    {
      name: 'expiryDate',
      title: 'Expiry Date',
      type: 'datetime',
      description: 'Optional: When should this code stop working?',
    },
    {
      name: 'assignedEmail',
      title: 'Only For This Email',
      type: 'string',
      description: 'Optional: makes this a personal code that only works for this customer (birthday and anniversary codes are created this way automatically).',
    },
    {
      name: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      description: 'Optional: how many paid orders can use this code in total. Leave empty for unlimited.',
      validation: (Rule: any) => Rule.min(1).integer(),
    },
    {
      name: 'timesUsed',
      title: 'Times Used',
      type: 'number',
      readOnly: true,
      initialValue: 0,
      description: 'Counted automatically after each paid order.',
    },
    {
      name: 'purpose',
      title: 'Created For',
      type: 'string',
      readOnly: true,
      description: 'Set on codes the website creates automatically (e.g. birthday, anniversary).',
    },
  ],
}