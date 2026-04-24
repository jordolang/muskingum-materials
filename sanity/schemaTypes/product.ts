import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "pricePerTon",
      title: "Price Per Ton ($)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "pricingTiers",
      title: "Volume Pricing Tiers",
      type: "array",
      description: "Optional volume-based pricing tiers for bulk orders",
      of: [
        {
          type: "object",
          fields: [
            {
              name: "minQuantity",
              type: "number",
              title: "Minimum Quantity (tons)",
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: "maxQuantity",
              type: "number",
              title: "Maximum Quantity (tons)",
              description: "Leave empty for unlimited",
            },
            {
              name: "pricePerTon",
              type: "number",
              title: "Price Per Ton ($)",
              validation: (Rule) => Rule.required().min(0),
            },
          ],
          preview: {
            select: {
              min: "minQuantity",
              max: "maxQuantity",
              price: "pricePerTon",
            },
            prepare({ min, max, price }) {
              return {
                title: `${min}${max ? `-${max}` : "+"} tons: $${price}/ton`,
              };
            },
          },
        },
      ],
    }),
    defineField({
      name: "unit",
      title: "Unit",
      type: "string",
      options: {
        list: [
          { title: "Per Ton", value: "ton" },
          { title: "Per Load", value: "load" },
          { title: "Call for Pricing", value: "call" },
        ],
      },
      initialValue: "ton",
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        list: [
          { title: "Sand", value: "sand" },
          { title: "Gravel", value: "gravel" },
          { title: "Soil", value: "soil" },
          { title: "Stone", value: "stone" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "featured",
      title: "Featured",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "available",
      title: "Available",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "specifications",
      title: "Specifications",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "label", type: "string", title: "Label" },
            { name: "value", type: "string", title: "Value" },
          ],
        },
      ],
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "category", media: "image" },
  },
});
