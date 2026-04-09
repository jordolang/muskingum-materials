# Muskingum Materials

**Southeast Ohio's Resource for Sand, Soil, and Gravel**

A modern web application for Muskingum Materials, a family-owned sand, soil, and gravel company located in Zanesville, OH. Built with Next.js 15, Sanity CMS, and deployed on Vercel.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | Shadcn UI + Tailwind CSS |
| CMS | Sanity Studio |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Authentication | Clerk (Google, GitHub, Apple, Facebook SSO) |
| Payments | Stripe |
| State Management | Zustand |
| Form Handling | React Hook Form + Zod |
| Email | Postmark |
| AI Chat | Vercel AI SDK + Anthropic Claude |
| Analytics | Google Analytics |
| Maps | Google Maps Embed API |
| Deployment | Vercel |

## Features

- **Product Catalog** - Complete listing of 15+ sand, gravel, soil, and stone products with current pricing
- **AI Chat Agent** - Live chat widget trained on all business data (pricing, products, services, hours, location). Conversations stored in database for lead generation
- **Contact System** - Contact form with email notifications via Postmark, quote request system, and newsletter signups
- **Sanity Studio CMS** - Full content management at `/studio` with schemas for products, services, testimonials, FAQs, gallery, pages, and site settings
- **Gallery** - 23 photos and 3 videos showcasing facility, equipment, and materials
- **Lead Capture** - All chat conversations and form submissions stored in PostgreSQL
- **Responsive Design** - Mobile-first, accessible UI with Shadcn components
- **Social Media** - Facebook integration with links throughout the site

## Pages

| Route | Description |
|-------|------------|
| `/` | Homepage with hero, featured products, services, gallery preview |
| `/products` | Full pricing table and product cards by category |
| `/services` | Material sales, delivery, large projects, on-site loading |
| `/gallery` | Photo gallery and video showcase |
| `/about` | Company info, values, location details |
| `/contact` | Contact form, business hours, Google Maps embed |
| `/faq` | Frequently asked questions |
| `/studio` | Sanity Studio CMS |

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon account (database)
- A Sanity account (CMS)
- A Clerk account (authentication)

### Installation

```bash
git clone https://github.com/jordolang/muskingum-materials.git
cd muskingum-materials
npm install
```

### Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```env
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token

# Neon Database
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_key

# AI Chat
ANTHROPIC_API_KEY=your_key

# Email
POSTMARK_API_TOKEN=your_token

# Google
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_id
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
```

### Database Setup

```bash
npx prisma db push
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Sanity Studio

Access the CMS at [http://localhost:3000/studio](http://localhost:3000/studio).

## Business Information

- **Address:** 1133 Ellis Dam Rd, Zanesville, OH 43701
- **Phone:** (740) 319-0183 | (740) 453-3063
- **Email:** sales@muskingummaterials.com
- **Hours:** Monday - Friday, 7:30 AM - 4:00 PM
- **Website:** [muskingummaterials.com](https://muskingummaterials.com)

## Deployment

This project is configured for deployment on Vercel. Push to the `main` branch to trigger automatic deployments.

```bash
vercel
```

## License

Private - All rights reserved.
