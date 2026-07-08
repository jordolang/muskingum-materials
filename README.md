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
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)
  [![License](https://img.shields.io/badge/license-Private-ef4444)]()

  <p>
    <a href="https://muskingummaterials.com">Live Site</a> ·
    <a href="https://www.facebook.com/61584706747584/">Facebook</a> ·
    <a href="#-getting-started">Getting Started</a> ·
    <a href="#-tech-stack">Tech Stack</a>
  </p>

</div>

---

## Overview

**Muskingum Materials** is the marketing and lead-generation site for a family-owned sand, soil, and gravel business in Zanesville, Ohio. Customers browse the material catalog, estimate how much material a job needs (including a satellite-map area estimator on `/calculators`), and order by phone. The site includes a staff-only admin back office (leads, quotes, chats, subscribers), AI-powered chat with conversation persistence, Postmark transactional email, Upstash-backed rate limiting, Sentry error tracking, and a Sanity Studio CMS embedded at `/studio`. There is no online checkout or customer account system.

Built on **Next.js 15** (App Router + Turbopack) with Prisma models backed by Neon Postgres.

> **Location:** 1133 Ellis Dam Rd, Zanesville, OH 43701  
> **Phone:** (740) 319-0183 · (740) 453-3063  
> **Hours:** Monday – Friday, 7:30 AM – 4:00 PM

---

## Features

### Material Calculators (`/calculators`)
- **Map Area Estimator** — Outline your project on a Google Maps satellite view; polygon area feeds a tonnage/cost estimate with confidence ranges
- **Gravel Calculator** — Length × width × depth (rectangle, circle, triangle) to cubic yards and tons
- **Tons ↔ Yards Converter** — Material-density-aware unit conversion
- **Coverage Chart** — One area compared across 2" / 3" / 4" / 6" depths

### Admin Back Office (staff-only, Clerk email-allowlist auth)
- **`/admin`** — Leads, quotes, chat conversations, subscriber management, dashboard KPIs; Clerk client JS loads only on `/admin` and `/sign-in`, never on the public site

### Communication
- **AI chat agent** — Vercel AI SDK + Anthropic Claude Haiku; full business context from `data/business.ts`; Postgres-backed conversation history; keyword-match fallback when API key absent
- **Postmark transactional email** — Quote notifications, contact form, chat escalation, newsletter

### Content Management (Sanity Studio at `/studio`)
- **7 schemas** — Service, Testimonial, FAQ, Gallery Image, Site Settings (singleton), Page, Post
- Products and services are Prisma-authoritative at runtime; Sanity handles marketing content only
- GROQ queries in `lib/sanity/queries.ts`; Sanity CDN with hotspot cropping; stega-enabled visual editing

### Infrastructure
- **Rate limiting** — Upstash Redis (in-memory fallback); tiers: chat 5/min, contact/quote 10/hr, leads/newsletter 20/hr
- **Strict CSP** — `next.config.ts` allowlists Clerk, Stripe, Sanity, Google, GTM, Unsplash. **Any new third-party host requires a CSP update.**
- **Error tracking** — Sentry integration via `lib/monitoring.ts`
- **Structured logging** — `lib/logger.ts` (JSON output + Sentry breadcrumbs)
- **Middleware** — Rate limiting + optional Clerk auth on every non-static request

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router + Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Shadcn UI (Radix UI) |
| **Animations** | Framer Motion |
| **CMS** | Sanity Studio v3 (embedded at `/studio`) |
| **Database** | PostgreSQL (Neon) via Prisma ORM — 23 models |
| **Auth** | Clerk (Google, GitHub, Apple, Facebook SSO) |
| **Payments** | By phone / in person (Stripe retained for admin refunds of past online orders) |
| **AI Chat** | Vercel AI SDK + Anthropic Claude Haiku |
| **Email** | Postmark |
| **SMS** | Twilio (email fallback) |
| **Rate limiting** | Upstash Redis (in-memory fallback) |
| **Error tracking** | Sentry |
| **State** | Zustand |
| **Forms** | React Hook Form + Zod |
| **Analytics** | Google Analytics 4 |
| **Maps** | Google Maps (satellite estimator + embed) |
| **Deployment** | Vercel |

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

# 2. Install dependencies (also runs prisma generate via postinstall)
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Fill in the required values (see Environment Variables below)
# For detailed setup instructions and troubleshooting, see docs/DEVELOPER_SETUP.md

# 4. Push database schema to Neon
npm run db:push

# 5. Seed initial product and service data
npm run db:seed

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sanity Studio is at [http://localhost:3000/studio](http://localhost:3000/studio).

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DIRECT_URL` | Yes | Neon direct connection string (for migrations) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset (default: `production`) |
| `SANITY_API_TOKEN` | Yes | Sanity write token (for mutations) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full origin, e.g. `https://muskingummaterials.com` |
| `STRIPE_SECRET_KEY` | No | Enables admin refunds against historical online orders |
| `POSTMARK_API_TOKEN` | No | Enables transactional email |
| `POSTMARK_FROM_EMAIL` | No | Sender address, e.g. `orders@muskingummaterials.com` |
| `ANTHROPIC_API_KEY` | No | Enables AI chat (falls back to keyword responses) |
| `UPSTASH_REDIS_REST_URL` | No | Enables distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash auth token |
| `TWILIO_ACCOUNT_SID` | No | Enables SMS notifications |
| `TWILIO_AUTH_TOKEN` | No | Twilio auth |
| `TWILIO_PHONE_NUMBER` | No | Twilio sending number |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | No | Enables satellite map estimator + contact embed |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | No | GA4 Measurement ID (e.g. `G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_GSC_VERIFICATION` | No | Google Search Console verification meta tag value |
| `SENTRY_DSN` | No | Enables Sentry error tracking |

All optional integrations degrade gracefully when their env vars are absent.

**For detailed setup instructions, troubleshooting, and service-specific configuration, see [docs/DEVELOPER_SETUP.md](docs/DEVELOPER_SETUP.md).**

---

## Available Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint (next/core-web-vitals + next/typescript)

# Database
npm run db:push          # Push schema changes to Neon
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed products, cost guides, services, email templates

# Content Sync
npm run sync             # Sync Prisma products/services to Sanity (one-way, preserves marketing fields)

# Ad-hoc verification (run directly, not via npm)
node test-order-number.js          # Order number generation
bash test-protected-routes.sh      # Auth route protection
bash test-rate-limits.sh           # Rate limiting (429 headers, per-IP isolation)
```

---

## Architecture Notes

### Two data stores — know which is authoritative

| Store | Authoritative for |
|-------|------------------|
| **Prisma / Neon Postgres** | Catalog/pricing for Products & Services; all transactional models (Order, Lead, etc.); CostGuides |
| **Sanity Studio** | Marketing content for Products & Services; testimonials, FAQs, gallery images, pages, posts, site settings |

Products and services exist in **both** stores with field-level ownership: Prisma owns catalog/pricing fields, Sanity owns marketing/SEO content. A one-way sync system (Prisma → Sanity) keeps catalog fields synchronized while preserving marketing content. See the "Prisma ↔ Sanity Sync" section below.

### Prisma ↔ Sanity Sync

Products and services exist in **both** stores with **field-level ownership** determining sync direction:

**Sync Architecture:**
- **Direction**: One-way Prisma → Sanity (catalog fields only)
- **Trigger**: Manual via `npm run sync`
- **Mechanism**: Upsert by `slug` — Prisma-owned fields overwrite; Sanity-owned fields are preserved
- **Idempotent**: Re-running sync is safe and produces the same result

**Field Ownership:**

| Owner | Fields |
|-------|--------|
| **Prisma** (synced to Sanity) | Catalog: `name`, `category`, `price`, `unit`, `stockStatus`, `active`, `featured`<br/>Market pricing: `marketPriceLowPerTon`, `marketPriceHighPerTon`, etc.<br/>Physical: `sizeDescription`, `colorDescription`, `densityLow`, `densityHigh`<br/>Structured: `bestFor`, `notFor`, `commonUses`, `pros`, `cons`, `altNames`, `features` (services) |
| **Sanity** (never overwritten) | Marketing: `description`, `shortDescription`<br/>Media: `image`, `gallery`, `imageAlt`<br/>SEO: `metaTitle`, `metaDescription`, `seo.ogImage`<br/>Relations: `relatedProducts`, `icon` (services) |

**Workflow:**

1. **Catalog/pricing changes**: Edit in Prisma Studio (`npm run db:studio`) or seed scripts, then run `npm run sync`
2. **Marketing/SEO changes**: Edit directly in Sanity Studio at `/studio`
3. **Reconciliation**: Sync reports mismatches (records in one store but not the other) but does NOT auto-delete orphaned records

**Important**: Orphaned Sanity records require manual cleanup to preserve marketing work. See [`docs/sync-field-ownership.md`](docs/sync-field-ownership.md) for complete field-by-field ownership map, edge cases, and verification checklist.

### Ordering

Orders happen by phone — there is no online checkout. The website's job is to
get the caller ready: the `/calculators` tools (including the satellite map
estimator) produce tonnage estimates, and the contact/quote forms capture
lead details for follow-up.

### Middleware

`middleware.ts` runs on every non-static request in this order:
1. **Rate limiting** — Upstash Redis (or in-memory fallback). Tiers: `chat` 5/min, `contact-quote` 10/hr, `leads-newsletter` 20/hr.
2. **Clerk auth** — scoped to `/admin`, `/api/admin`, and `/sign-in` only; the public site never loads Clerk.

When adding a new public API route that accepts user input, register it in `rateLimitedEndpoints` in `middleware.ts`.

### CSP

`next.config.ts` defines a strict Content-Security-Policy. **Adding any new third-party script, iframe, image host, or WebSocket connection requires updating this CSP** or it will be silently blocked in production.

### Path aliases

- `@/*` → repo root (`tsconfig.json`)
- `tsconfig.json` **excludes** `skills/`, `.auto-claude/`, and `src/` — don't import from them

---

## Content Management (Sanity Studio)

Sanity Studio is embedded at `/studio`. Current schemas:

| Schema | Purpose |
|--------|---------|
| **Service** | Delivery, loading, large-project pricing descriptions |
| **Testimonial** | Customer reviews with approval workflow |
| **FAQ** | Questions organized by category |
| **Gallery Image** | Photos with category tags |
| **Site Settings** | Singleton — business info, hours, social links |
| **Page** | Rich text pages with Portable Text |
| **Post** | Blog/news posts |

---

## Deployment

Deployed on **Vercel** with automatic deployments on push to `main`.

```bash
vercel --prod
```

Set all environment variables in the Vercel dashboard.

---

## License

Private — All rights reserved. &copy; 2026 Muskingum Materials.

---

<div align="center">

  <img src="public/logo.svg" alt="Muskingum Materials" width="200" />

  <p>
    <strong>Muskingum Materials</strong><br/>
    1133 Ellis Dam Rd · Zanesville, OH 43701<br/>
    <a href="tel:7403190183">(740) 319-0183</a> · <a href="mailto:sales@muskingummaterials.com">sales@muskingummaterials.com</a>
  </p>

  <sub>Built with Next.js 15, TypeScript, Prisma, Sanity, and Tailwind CSS</sub>

</div>
