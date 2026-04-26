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
      name: 'expiryDate',
      title: 'Expiry Date',
      type: 'datetime',
      description: 'Optional: When should this code stop working?',
    },
  ],
}