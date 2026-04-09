import { groq } from "next-sanity";

export const productsQuery = groq`
  *[_type == "product"] | order(sortOrder asc) {
    _id,
    name,
    slug,
    description,
    pricePerTon,
    unit,
    category,
    image,
    featured,
    available,
    sortOrder
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    description,
    pricePerTon,
    unit,
    category,
    image,
    featured,
    available,
    specifications
  }
`;

export const servicesQuery = groq`
  *[_type == "service"] | order(sortOrder asc) {
    _id,
    title,
    slug,
    description,
    icon,
    image,
    features,
    sortOrder
  }
`;

export const testimonialsQuery = groq`
  *[_type == "testimonial" && approved == true] | order(_createdAt desc) {
    _id,
    name,
    company,
    rating,
    text,
    image
  }
`;

export const faqQuery = groq`
  *[_type == "faq"] | order(sortOrder asc) {
    _id,
    question,
    answer,
    category,
    sortOrder
  }
`;

export const galleryQuery = groq`
  *[_type == "galleryImage"] | order(sortOrder asc) {
    _id,
    title,
    image,
    category,
    description,
    sortOrder
  }
`;

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    title,
    description,
    logo,
    phone,
    altPhone,
    email,
    address,
    city,
    state,
    zip,
    hours,
    googleMapsUrl,
    facebook,
    instagram,
    twitter,
    tagline,
    heroImage,
    heroVideo
  }
`;

export const pageQuery = groq`
  *[_type == "page" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    content,
    seoTitle,
    seoDescription
  }
`;
