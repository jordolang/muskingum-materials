<div align="center">

  <img src="public/logo.svg" alt="Muskingum Materials Logo" width="400" />

  <br/><br/>

  <p><strong>Southeast Ohio's Resource for Sand, Soil, and Gravel</strong></p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![Sanity](https://img.shields.io/badge/Sanity-CMS-F03E2F?logo=sanity&logoColor=white)](https://www.sanity.io/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599?logo=postgresql&logoColor=white)](https://neon.tech/)
  [![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)
  [![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)
  [![License](https://img.shields.io/badge/license-Private-ef4444)]()

  <p>
    <a href="https://muskingummaterials.com">Live Site</a> ·
    <a href="https://www.facebook.com/profile.php?id=61566390498498">Facebook</a> ·
    <a href="#-getting-started">Getting Started</a> ·
    <a href="#-tech-stack">Tech Stack</a>
  </p>

</div>

---

## Overview

**Muskingum Materials** is a modern, full-featured business website for a family-owned sand, soil, and gravel operation in Zanesville, Ohio. It delivers a clean, easy-to-navigate storefront with a complete product catalog, real-time AI-powered customer chat, lead capture system, and an enterprise-grade content management backend powered by Sanity Studio.

Built on **Next.js 15** with the App Router, the site is designed to help customers quickly find products, get pricing, and connect with the business — while giving the owners full control over their content through Sanity Studio.

> **Location:** 1133 Ellis Dam Rd, Zanesville, OH 43701
> **Phone:** (740) 319-0183 · (740) 453-3063
> **Hours:** Monday – Friday, 7:30 AM – 4:00 PM

---

## Features

### Customer-Facing
- **Product Catalog** — 15+ sand, gravel, soil, and stone products with current pricing table
- **AI Chat Agent** — Live chat widget trained on all business data (pricing, products, hours, services, location) powered by Claude
- **Contact System** — Contact form, quote request builder, and newsletter signup — all with email notifications
- **Gallery** — 23 photos and 3 videos showcasing facility, equipment, and materials
- **FAQ Section** — Organized by category with accordion navigation
- **Google Maps** — Embedded location map on the contact page
- **Social Media** — Facebook integration and links throughout the site
- **Responsive Design** — Mobile-first, fully accessible UI

### Lead Generation & Marketing
- **Automatic Lead Capture** — All chat conversations stored in PostgreSQL regardless of opt-in
- **Contact Info Collection** — In-chat prompt for name, email, phone after 4+ messages
- **Form Submissions** — Contact form and quote requests saved to database with Postmark email notifications
- **Newsletter Subscriptions** — Email collection for future marketing campaigns

### Content Management (Sanity Studio)
- **7 Document Schemas** — Products, Services, Testimonials, FAQs, Gallery, Pages, Site Settings
- **Singleton Settings** — Single source of truth for business info, hours, contact, and social links
- **GROQ Queries** — Pre-built queries for all content types
- **Image Pipeline** — Sanity CDN with hotspot cropping and responsive transforms
- **Visual Editing** — Stega-enabled for live preview and click-to-edit

### Platform & Infrastructure
- **Authentication** — Clerk with Google, GitHub, Apple, and Facebook SSO
- **Payments** — Stripe integration ready for future e-commerce features
- **Email** — Postmark transactional email on all form submissions
- **Analytics** — Google Analytics integration
- **AI** — Vercel AI SDK with Anthropic Claude (Haiku) for cost-effective chat
- **Database** — Neon serverless PostgreSQL with Prisma ORM

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router + Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI (Radix UI) |
| **Animations** | Framer Motion |
| **CMS** | Sanity Studio v3 |
| **Database** | PostgreSQL (Neon) via Prisma ORM |
| **Auth** | Clerk (Google, GitHub, Apple, Facebook SSO) |
| **Payments** | Stripe |
| **AI Chat** | Vercel AI SDK + Anthropic Claude |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Email** | Postmark |
| **Analytics** | Google Analytics |
| **Maps** | Google Maps Embed API |
| **Deployment** | Vercel |

---

## Project Structure

```
muskingum-materials/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Homepage (hero, products, services, gallery, CTA)
│   ├── products/                # Product catalog with pricing table
│   ├── services/                # Service descriptions and features
│   ├── gallery/                 # Photo gallery + video showcase
│   ├── about/                   # Company info and values
│   ├── contact/                 # Contact form, map, business info
│   ├── faq/                     # FAQ accordion by category
│   ├── studio/[[...tool]]/      # Sanity Studio CMS
│   ├── sign-in/                 # Clerk authentication
│   ├── sign-up/                 # Clerk registration
│   └── api/                     # API routes
│       ├── chat/                # AI chat agent endpoint
│       ├── contact/             # Contact form handler
│       ├── leads/               # Lead capture from chat
│       ├── quote/               # Quote request handler
│       └── newsletter/          # Newsletter subscription
│
├── components/                   # React components
│   ├── ui/                      # Shadcn UI primitives
│   ├── layout/                  # Navbar, Footer
│   ├── chat/                    # AI chat widget
│   ├── contact/                 # Contact form
│   ├── analytics/               # Google Analytics
│   └── providers/               # Clerk wrapper
│
├── data/                         # Static business data
│   └── business.ts              # Products, pricing, services, company info
│
├── lib/                          # Utilities and clients
│   ├── prisma.ts                # Prisma client
│   ├── store.ts                 # Zustand stores
│   ├── utils.ts                 # Helper functions
│   └── sanity/                  # Sanity config, client, queries
│
├── sanity/                       # Sanity schema definitions
│   └── schema/                  # 7 document type schemas
│
├── prisma/                       # Database
│   └── schema.prisma            # 6 models (Lead, Contact, Chat, Quote, Newsletter)
│
└── public/                       # Static assets
    └── images/                  # 23 photos + 3 videos
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 20+ |
| Neon account | [neon.tech](https://neon.tech) |
| Sanity account | [sanity.io](https://sanity.io) |
| Clerk account | [clerk.com](https://clerk.com) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/jordolang/muskingum-materials.git
cd muskingum-materials

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Fill in the required values (see Environment Variables below)

# 4. Push database schema to Neon
npx prisma db push

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the site should be running.

> **Sanity Studio:** Access the CMS at [http://localhost:3000/studio](http://localhost:3000/studio)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset (default: `production`) |
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Yes | Neon direct connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `ANTHROPIC_API_KEY` | No | Enables AI chat (falls back to static responses) |
| `POSTMARK_API_TOKEN` | No | Enables email notifications |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Enables map on contact page |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | No | Enables Google Analytics |
| `STRIPE_SECRET_KEY` | No | Enables payment features |

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run start            # Serve production build
npm run lint             # Run ESLint

# Database
npm run db:push          # Push schema to Neon
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed initial data
```

---

## AI Chat Agent

The chat widget is trained on all Muskingum Materials business data and can answer questions about:

- **Product pricing** — All 15+ products with per-ton and per-load pricing
- **Business hours** — Monday–Friday, 7:30 AM – 4:00 PM
- **Location & directions** — 1133 Ellis Dam Rd, Zanesville, OH 43701
- **Services** — Material sales, delivery, large project pricing, on-site loading
- **Payment methods** — Visa, Mastercard, Discover, Apple Pay, cash, check
- **Tax & fees** — 7.25% tax, 4.5% credit card processing fee

### Architecture

```
Chat Widget (client)
  └─► POST /api/chat
        ├─► Vercel AI SDK → Anthropic Claude Haiku
        │     └─► System prompt with full business data
        └─► Prisma → PostgreSQL (conversation + messages stored)
```

When no `ANTHROPIC_API_KEY` is configured, the chat falls back to keyword-based static responses covering pricing, hours, delivery, location, and payment info.

---

## Content Management

Sanity Studio is embedded at `/studio` and provides full content management:

| Schema | Purpose |
|--------|---------|
| **Product** | Name, price, unit, category, description, image, specs |
| **Service** | Title, description, icon, features list |
| **Testimonial** | Customer reviews with approval workflow |
| **FAQ** | Questions organized by category |
| **Gallery Image** | Photos with category tags |
| **Page** | Rich text pages with Portable Text |
| **Site Settings** | Singleton for business info, hours, social links |

---

## Deployment

This project is configured for **Vercel** with automatic deployments on push to `main`.

| Service | Purpose |
|---------|---------|
| **Vercel** | Hosting + serverless functions |
| **Neon** | PostgreSQL database |
| **Sanity** | Content management + CDN |
| **Clerk** | Authentication |
| **Stripe** | Payment processing |
| **Postmark** | Transactional email |

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

Set all environment variables in the Vercel dashboard before deploying.

---

## Business Information

| | |
|---|---|
| **Company** | Muskingum Materials |
| **Address** | 1133 Ellis Dam Rd, Zanesville, OH 43701 |
| **Phone** | (740) 319-0183 · (740) 453-3063 |
| **Email** | sales@muskingummaterials.com |
| **Hours** | Monday – Friday, 7:30 AM – 4:00 PM |
| **Facebook** | [Muskingum Materials](https://www.facebook.com/profile.php?id=61566390498498) |

---

## License

Private — All rights reserved. &copy; 2025 Muskingum Materials.

---

<div align="center">

  <img src="public/logo.svg" alt="Muskingum Materials" width="200" />

  <p>
    <strong>Muskingum Materials</strong><br/>
    1133 Ellis Dam Rd · Zanesville, OH 43701<br/>
    <a href="tel:7403190183">(740) 319-0183</a> · <a href="mailto:sales@muskingummaterials.com">sales@muskingummaterials.com</a>
  </p>

  <sub>Built with Next.js, TypeScript, Sanity, and Tailwind CSS</sub>

</div>
