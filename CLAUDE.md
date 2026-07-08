# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # next lint (ESLint with next/core-web-vitals + next/typescript)

npm run db:push      # Push prisma/schema.prisma to Neon (uses .env.local via dotenv-cli)
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Run prisma/seed.ts via tsx
npm run sync         # Sync Prisma products/services to Sanity (one-way, preserves marketing fields)
```

`postinstall` runs `prisma generate`, so a fresh `npm install` produces a usable client.

There is no test runner wired into `package.json`. Ad-hoc verification scripts at the repo root are manual probes — run them directly with `node` / `bash`, not via npm:

- `test-order-number.js` — Order number generation verification
- `test-protected-routes.sh` — Auth route protection verification
- `test-rate-limits.sh` — Rate limiting verification (tests all public API endpoints, 429 response headers, and per-IP isolation)

Sanity Studio is embedded at `/studio` (App Router catch-all at `app/studio/[[...tool]]`), not a separate process. There is also `sanity.cli.ts` for `npx sanity` commands.

## Architecture

### Two parallel content stores

This is the most important thing to understand before editing content-related code:

- **Prisma + Neon Postgres** is the source of truth for `Product`, `Service`, `CostGuide`, plus all transactional models (`Order`, `Lead`, `ContactSubmission`, `QuoteRequest`, `ChatConversation`/`ChatMessage`, `NewsletterSubscriber`, `UserProfile`/`Address`, `ProductComparison`). See `prisma/schema.prisma` and `lib/products.ts` (`getProducts`, `getServices`, `getCostGuides`).
- **Sanity Studio** holds marketing content: `product`, `service`, `testimonial`, `faq`, `galleryImage`, `page`, `post`, and the singleton `siteSettings`. Schemas live in `sanity/schemaTypes/`, GROQ queries in `lib/sanity/queries.ts`, client in `lib/sanity/client.ts`.

Note that `product` and `service` exist in **both** systems. Prisma is the source of truth for catalog/pricing/inventory fields; Sanity owns marketing/SEO/media fields. A **one-way sync system** (Prisma → Sanity) keeps catalog fields in sync while preserving marketing content. See the "Prisma ↔ Sanity Sync System" section below for details.

`siteSettings` is a Sanity singleton enforced in `sanity.config.ts` (filters out templates and limits actions to publish/discardChanges/restore).

### Prisma ↔ Sanity Sync System

Products and services exist in both Prisma and Sanity, with **field-level ownership** determining sync direction:

**Sync Architecture:**
- **Direction**: One-way Prisma → Sanity (catalog fields only)
- **Trigger**: Manual via `npm run sync` (runs `scripts/sync-to-sanity.ts`)
- **Mechanism**: Upsert by `slug` — Prisma-owned fields overwrite; Sanity-owned fields are preserved
- **Idempotent**: Re-running sync is safe and produces the same result

**Field Ownership Rules:**

**Prisma-Owned (synced to Sanity):**
- Catalog: `name`, `category`, `price`, `unit`, `stockStatus`, `seasonalMessage`, `active`, `sortOrder`, `featured`
- Market pricing: `marketPriceLowPerTon`, `marketPriceHighPerTon`, etc.
- Physical properties: `sizeDescription`, `colorDescription`, `densityLow`, `densityHigh`
- Structured data: `bestFor`, `notFor`, `commonUses`, `pros`, `cons`, `altNames`, `features` (services)
- Identifiers: `slug` (canonical URL identifier), `id` (maps to `_id` in Sanity)

**Sanity-Owned (never overwritten by sync):**
- Marketing: `description` (rich text), `shortDescription`
- Media: `image`, `gallery`, `imageAlt`
- SEO: `metaTitle`, `metaDescription`, `seo.ogImage`
- Relations: `relatedProducts`, `icon` (services)

**Workflow:**
1. **Catalog/pricing changes**: Edit in Prisma Studio (`npm run db:studio`) or seed scripts, then run `npm run sync`
2. **Marketing/SEO changes**: Edit directly in Sanity Studio (`/studio`)
3. **Schema changes**: Update both `prisma/schema.prisma` AND `sanity/schemaTypes/`, then decide field ownership and sync behavior

**Reconciliation**: `npm run sync` reports mismatches (records in one store but not the other) but does NOT auto-delete. Orphaned Sanity records require manual cleanup to preserve marketing work.

**Detailed Reference**: See `docs/sync-field-ownership.md` for complete field-by-field ownership map, edge cases, and verification checklist.

### ISR caching for Sanity content

Sanity-powered pages use **Incremental Static Regeneration (ISR)** to balance performance and freshness:

- **Time-based revalidation**: Pages auto-revalidate after 3600 seconds (1 hour) via Next.js `revalidate` export. This ensures stale content eventually updates even if webhooks fail.
- **On-demand revalidation**: `app/api/revalidate/route.ts` receives Sanity webhooks on publish/unpublish events. The endpoint verifies the webhook signature (`SANITY_REVALIDATE_SECRET`), extracts the document type and slug from the payload, and calls `revalidatePath()` or `revalidateTag()` to instantly purge the cache for affected routes.
- **Graceful degradation**: If `SANITY_REVALIDATE_SECRET` is missing, the webhook endpoint returns 501; pages still revalidate hourly via the time-based fallback.

**Webhook setup** (in Sanity Studio dashboard):
1. Create a webhook pointing to `https://your-domain.com/api/revalidate`
2. Set the secret to match `SANITY_REVALIDATE_SECRET` in `.env.local`
3. Configure triggers for `publish` and `unpublish` events on the content types the route supports: `product`, `service`, `testimonial`, `faq`, `gallery`, and `siteSettings`. (`page`/`post` are intentionally unsupported — their only reader lives under the build-excluded `src/` tree, so revalidating them would purge nothing.)

The webhook payload includes `_type` (sent as `tag`) and an optional `slug`, which the API route maps **only to routes that actually render that content in `app/`**. `product` revalidates the catalog detail page (`/catalog/<slug>`) plus the `/catalog` and `/products` listings; `service` revalidates the `/services` listing (there is no service detail route). List-only types (`testimonials`, `faq`, `gallery`, `site-settings`) are handled via `revalidateTag()` against the tags those pages fetch with.

**Debugging**: Check webhook delivery logs in Sanity Studio. If revalidation isn't working, verify the secret matches and the API route is accessible (not blocked by middleware or rate limiting).

### Middleware does two things

`middleware.ts` runs in this order on every non-static request (matcher excludes `_next`, `images`, `videos`, `favicon.ico`, `studio`):

1. **Rate limiting** for public API endpoints. Tiers in `lib/rate-limit.ts`:
   - `chat`: 5 / minute (`/api/chat`)
   - `contact-quote`: 10 / hour (`/api/contact`, `/api/quote`)
   - `leads-newsletter`: 20 / hour (`/api/leads`, `/api/newsletter`)
   Uses Upstash Redis when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set, otherwise an in-memory `Map` fallback (per-instance, not shared across serverless invocations). Rate-limited responses return 429 with `Retry-After` and `X-RateLimit-*` headers.
   > **Source of truth**: See `rateLimitedEndpoints` in `middleware.ts` for the canonical endpoint→tier mapping.
2. **Clerk auth** — only loaded if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set and not the placeholder. Imported dynamically so the build doesn't fail without Clerk creds.

When adding a new public API route that accepts user input, register it in `rateLimitedEndpoints` in `middleware.ts`.

### Graceful degradation for optional services

Several integrations are optional and fall back to no-op or static behavior when env vars are missing. Preserve this pattern when adding similar features:

- `ANTHROPIC_API_KEY` → `app/api/chat/route.ts` falls back to keyword-matched static responses (`getStaticResponse`).
- `UPSTASH_REDIS_REST_*` → in-memory rate limiting.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` → middleware skips Clerk; `ClerkProvider` in `app/layout.tsx` still wraps but is harmless.
- `POSTMARK_API_TOKEN`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` are similarly optional per `README.md`.

### AI chat flow

`app/api/chat/route.ts` uses `generateText` from the Vercel AI SDK with `@ai-sdk/anthropic` (model `claude-haiku-4-5-20251001`). The system prompt is built at request time from `data/business.ts` (`BUSINESS_INFO`, `PRODUCTS`, `SERVICES`) — that file is the canonical source for hardcoded business info baked into prompts, not the Prisma `Product` table. Conversations and messages are persisted to Prisma best-effort (DB failures don't fail the request).

### Orders / Stripe

Online checkout was removed — orders happen by phone. Stripe remains only for the admin refund path (`app/api/admin/orders/[id]/refund`) against historical orders; there is no customer-facing payment flow or Stripe webhook.

### CSP

`next.config.ts` defines a strict Content-Security-Policy that explicitly allowlists Clerk, Stripe, Sanity (including websocket and CDN), Google Tag Manager / Analytics, and Unsplash. **Adding any new third-party script, iframe, image host, or websocket connection requires updating this CSP** or it will be blocked silently in production. `frame-ancestors` allows Sanity hosts so the Studio can be embedded for visual editing.

### Path aliases & excluded directories

- `@/*` → repo root (configured in `tsconfig.json`).
- `tsconfig.json` **excludes** `skills`, `.auto-claude`, and `src`. Those directories are scaffolding/tooling artifacts, not part of the app — don't import from them and don't put new app code there. Recent commits (`fix(build): exclude orphaned src/ scaffolding from tsconfig`) confirm this is intentional.

### Routing surface

App Router pages live under `app/` and follow the README's product map (`products`, `services`, `gallery`, `about`, `contact`, `faq`, `account`, `order`, `calculators`, `catalog`, `costs`, `planner`). Auth pages are `sign-in` and `sign-up` (Clerk). Sanity Studio is at `/studio`. API routes are namespaced under `app/api/{chat,contact,leads,newsletter,quote,orders,account,revalidate}`.

## Conventions

- **Validation**: Zod at the boundary of every API route (see `app/api/chat/route.ts` for the pattern). `lib/schemas.ts` holds shared schemas.
- **DB access**: Always go through `lib/prisma.ts` (singleton client). Don't instantiate `PrismaClient` in route handlers.
- **Logging**: `lib/logger.ts` exists — prefer it over `console.*` in new code.
- **State** (client-side): Zustand stores in `lib/store.ts`.
- **UI**: Shadcn UI primitives in `components/ui/`, feature components grouped by domain (`components/{chat,contact,gallery,home,layout,order,planner,calculators,account,analytics}`). Tailwind config in `tailwind.config.ts`.
- **Env loading for scripts**: Prisma scripts run via `dotenv -e .env.local --` because Prisma CLI doesn't auto-load `.env.local`. Follow that pattern for any new `tsx`-based script that needs runtime env vars.
- **Sanity imports**: **CRITICAL** — only import Sanity runtime libraries in app code, never Studio dependencies. The Studio lives exclusively at `/studio` and must not leak into the main app bundle.
  - **✅ SAFE** (runtime libraries for querying content):
    - `@sanity/client` — lightweight client for fetching content
    - `@sanity/image-url` — image URL builder
    - `next-sanity` — Next.js integration helpers
    - GROQ query strings, schemas from `sanity/schemaTypes/` (types only)
  - **❌ UNSAFE** (Studio code that bloats the bundle):
    - `sanity` — the full Studio package (~1MB+)
    - `sanity/desk`, `sanity/structure` — Studio UI components
    - Any `@sanity/vision`, `@sanity/form-builder`, plugin imports
    - `sanity.config.ts` or `sanity.cli.ts` — Studio configuration
  - **Where Studio code belongs**:
    - `app/studio/[[...tool]]/page.tsx` — the only **route-split** Studio entry point. Because it lives under the `/studio` route segment, Next.js code-splits it away from the main app bundle; Studio code reached *only* through this file is never shipped to other routes.
    - `sanity.config.ts` (and `sanity.cli.ts`) — root-level Studio **config**, NOT route-split. They are not protected by route boundaries, so they require careful import management: import them only from `app/studio/**` (or other Studio-only files). If a non-Studio module imports `sanity.config.ts`, the full Studio package leaks into the main bundle. Treat these config files as Studio-only and never reference them from shared/app code.
  - **Verification**: `npm run build` includes a bundle analysis step that fails if Studio dependencies appear in non-Studio routes. If you see a build error about "sanity in client bundle", audit your imports — you've likely imported Studio code outside `/studio`.
