import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Site Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Site Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "heroVideo",
      title: "Hero Video URL",
      type: "url",
    }),
    defineField({
      name: "phone",
      title: "Primary Phone",
      type: "string",
    }),
    defineField({
      name: "altPhone",
      title: "Alternate Phone",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Street Address",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
    }),
    defineField({
      name: "state",
      title: "State",
      type: "string",
    }),
    defineField({
      name: "zip",
      title: "ZIP Code",
      type: "string",
    }),
    defineField({
      name: "hours",
      title: "Business Hours",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "googleMapsUrl",
      title: "Google Maps Embed URL",
      type: "url",
    }),
    defineField({
      name: "facebook",
      title: "Facebook URL",
      type: "url",
    }),
    defineField({
      name: "instagram",
      title: "Instagram URL",
      type: "url",
    }),
    defineField({
      name: "twitter",
      title: "Twitter/X URL",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});
