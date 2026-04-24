import { defineField, defineType } from "sanity";

export const deliverySettings = defineType({
  name: "deliverySettings",
  title: "Delivery Settings",
  type: "document",
  fields: [
    defineField({
      name: "zoneRadiusMiles",
      title: "Delivery Zone Radius (miles)",
      type: "number",
      description: "The radius in miles from the business location for delivery service",
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: "baseFee",
      title: "Base Delivery Fee ($)",
      type: "number",
      description: "The base delivery fee in dollars",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "perMileRate",
      title: "Per-Mile Rate ($)",
      type: "number",
      description: "Additional cost per mile beyond the base fee",
      validation: (Rule) => Rule.required().min(0),
    }),
  ],
  preview: {
    select: {
      radius: "zoneRadiusMiles",
      baseFee: "baseFee",
      perMileRate: "perMileRate",
    },
    prepare({ radius, baseFee, perMileRate }) {
      return {
        title: "Delivery Settings",
        subtitle: `Zone: ${radius} mi | Base: $${baseFee} | Per-mile: $${perMileRate}`,
      };
    },
  },
});
