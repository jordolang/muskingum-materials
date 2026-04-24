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
    <a href="https://www.facebook.com/61584706747584/">Facebook</a> ·
    <a href="#-getting-started">Getting Started</a> ·
    <a href="#-tech-stack">Tech Stack</a>
  </p>

</div>

---

## Overview

**Muskingum Materials** is a full-stack e-commerce and operations platform for a family-owned sand, soil, and gravel business in Zanesville, Ohio. It is substantially more than a marketing site: it includes live Stripe Checkout, a complete admin back office, AI-powered chat with conversation persistence, customer accounts with a loyalty program, Postmark transactional email, Twilio SMS notifications, Upstash-backed rate limiting, Sentry error tracking, and a Sanity Studio CMS embedded at `/studio`.

Built on **Next.js 15** (App Router + Turbopack) with **23 Prisma models** backed by Neon Postgres.

> **Location:** 1133 Ellis Dam Rd, Zanesville, OH 43701  
> **Phone:** (740) 319-0183 · (740) 453-3063  
> **Hours:** Monday – Friday, 7:30 AM – 4:00 PM

---

## Features

### E-Commerce & Ordering
- **Online ordering** — Shopping cart with material calculator, volume-discount badges, and per-product pricing tiers
- **Stripe Checkout** — Full session creation with server-side price validation (`lib/validate-checkout-prices.ts` — never trust client prices)
- **Stripe webhook fulfillment** — `checkout.session.completed` marks orders paid, awards loyalty points, sends SMS confirmation
- **Google Maps satellite estimator** — Step 1 of the order form lets customers outline their project site; polygon, area, depth, and tonnage estimate are persisted on the `Order` row
- **Terms acceptance** — Required checkbox at checkout writes `Order.termsAcceptedAt`
- **Recurring orders** — Full schema, API, and UI (`/account/recurring-orders`)
- **Saved orders / reorder** — Full schema, API, and UI (`/account/saved-orders`)
- **Guest and authenticated checkout** both supported

### Customer Accounts
- Clerk authentication (Google, GitHub, Apple, Facebook SSO)
- Account dashboard at `/account`: orders, saved orders, recurring orders, rewards, profile, addresses
- **Loyalty program** — Bronze/silver/gold tiers, points per dollar, $5/100-point redemption, tier benefits
- Contractor pricing flag and per-customer discount rate
- Multiple shipping addresses per user

### Admin Back Office
- **`/admin`** — Orders (status, history, detail), leads, quotes, chat conversations, dashboard KPIs, email campaigns, subscriber management

### Communication
- **AI chat agent** — Vercel AI SDK + Anthropic Claude Haiku; full business context from `data/business.ts`; Postgres-backed conversation history; keyword-match fallback when API key absent
- **Postmark transactional email** — Order confirmations, quote notifications, contact form, newsletter
- **Twilio SMS** — Order confirmations and status updates; opt-in tracked on `Order.smsOptIn`; STOP webhook at `/api/sms/webhook`
- **Restock notifications** — Email customers when an out-of-stock product returns

### Content Management (Sanity Studio at `/studio`)
- **7 schemas** — Service, Testimonial, FAQ, Gallery Image, Site Settings (singleton), Page, Post
- Products and services are Prisma-authoritative at runtime; Sanity handles marketing content only
- GROQ queries in `lib/sanity/queries.ts`; Sanity CDN with hotspot cropping; stega-enabled visual editing

### Infrastructure
- **Rate limiting** — Upstash Redis (in-memory fallback); tiers: chat 5/min, checkout 10/hr, leads/newsletter 20/hr
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
| **Payments** | Stripe Checkout + webhooks |
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
| `STRIPE_SECRET_KEY` | No | Enables Stripe Checkout |
| `STRIPE_WEBHOOK_SECRET` | No | Required for webhook signature verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe public key |
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
| **Prisma / Neon Postgres** | Products, Services, CostGuides, and all transactional models (Order, Lead, etc.) |
| **Sanity Studio** | Marketing content — testimonials, FAQs, gallery images, pages, posts, site settings |

Products and services exist **only in Prisma** at runtime. Sanity's `product` schema was removed; Prisma is the sole catalog authority.

### Order flow

```
Order Form (client)
  └─► POST /api/orders/checkout
        ├─► Zod validation (lib/schemas.ts checkoutSchema)
        ├─► lib/validate-checkout-prices.ts  ← trust boundary, never use client prices
        ├─► prisma.order.create()
        └─► stripeClient.checkout.sessions.create()
              └─► /order/success (redirect)
                    └─► Stripe webhook → /api/orders/webhook
                          ├─► Mark order paid
                          ├─► Award loyalty points
                          └─► Send SMS confirmation
```

### Middleware

`middleware.ts` runs on every non-static request in this order:
1. **Rate limiting** — Upstash Redis (or in-memory fallback). Tiers: `chat` 5/min, `contact-quote` 10/hr, `leads-newsletter` 20/hr.
2. **Clerk auth** — Only if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set and not a placeholder.

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

Set all environment variables in the Vercel dashboard before deploying. The `STRIPE_WEBHOOK_SECRET` must be set to the signing secret from the Stripe Dashboard → Webhooks → your endpoint.

---

## Analytics

The site uses **Google Analytics 4 (GA4)** for tracking user behavior, conversions, and engagement.

### Setup

Set the `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` environment variable to your GA4 Measurement ID (e.g., `G-XXXXXXXXXX`). When not set, analytics is disabled and no scripts are loaded.

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Tracked Events

| GA4 Event Name | Description | Location |
|----------------|-------------|----------|
| `page_view` | Automatic page view on navigation | `components/analytics/google-analytics.tsx` |
| `view_item` | Product detail page viewed | `components/analytics/product-view-tracker.tsx` |
| `add_to_cart` | Product added to order form | `components/order/order-form.tsx` |
| `begin_checkout` | Checkout process started | `components/order/order-form.tsx` |
| `purchase` | Order completed | `components/analytics/purchase-tracker.tsx` |
| `contact_form_submit` | Contact form submitted | `components/contact/contact-form.tsx` |
| `chat_opened` | AI chat widget opened | `components/chat/chat-widget.tsx` |
| `generate_lead` | Quote request or lead captured | `lib/analytics.ts` |

### Conversion Goals

Configure these as conversion events in your GA4 property for funnel tracking:

1. **`purchase`** — Completed orders (primary conversion)
2. **`generate_lead`** — Quote requests and lead captures
3. **`contact_form_submit`** — Contact form submissions
4. **`begin_checkout`** — Checkout initiation (micro-conversion)

### Verifying Analytics

1. **Real-time report** — Open [GA4 Real-Time](https://analytics.google.com/) and browse the site to see events appear live
2. **Browser DevTools** — Open the Network tab and filter for `google-analytics.com` or `gtag` to confirm requests are firing
3. **GA4 DebugView** — Install the [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/) Chrome extension and enable DebugView in GA4 to inspect each event and its parameters
4. **Development** — Analytics only loads when `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` is set, so omit it in development to avoid polluting production data

### Architecture

```
Google Analytics (components/analytics/google-analytics.tsx)
  ├─► gtag.js loaded via next/script (afterInteractive)
  ├─► Automatic page views on route changes
  └─► Event helpers in lib/analytics.ts
        ├─► trackProductView()   → view_item
        ├─► trackAddToCart()     → add_to_cart
        ├─► trackBeginCheckout() → begin_checkout
        ├─► trackPurchase()      → purchase
        ├─► trackLead()          → generate_lead
        ├─► trackContact()       → contact_form_submit
        └─► trackChatOpened()    → chat_opened
```

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

Private — All rights reserved. &copy; 2026 Muskingum Materials.

---

<div align="center">

  <img src="public/logo.svg" alt="Muskingum Materials" width="200" />

  <p>
    <strong>Muskingum Materials</strong><br/>
    1133 Ellis Dam Rd · Zanesville, OH 43701<br/>
    <a href="tel:7403190183">(740) 319-0183</a> · <a href="mailto:sales@muskingummaterials.com">sales@muskingummaterials.com</a>
  </p>

  <sub>Built with Next.js 15, TypeScript, Prisma, Sanity, Stripe, Clerk, and Tailwind CSS</sub>

</div>
