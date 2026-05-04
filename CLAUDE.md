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

Note that `product` and `service` exist in **both** systems. Prisma is what the app reads at runtime for catalog pages; Sanity is editable via the Studio. When changing product/service shape, decide which store is authoritative for that field and update accordingly — they are not currently synced.

`siteSettings` is a Sanity singleton enforced in `sanity.config.ts` (filters out templates and limits actions to publish/discardChanges/restore).

### Middleware does two things

`middleware.ts` runs in this order on every non-static request (matcher excludes `_next`, `images`, `videos`, `favicon.ico`, `studio`):

1. **Rate limiting** for public API endpoints. Tiers in `lib/rate-limit.ts`:
   - `chat`: 5 / minute (`/api/chat`)
   - `contact-quote`: 10 / hour (`/api/contact`, `/api/quote`, `/api/orders/checkout`)
   - `leads-newsletter`: 20 / hour (`/api/leads`, `/api/newsletter`)
   Uses Upstash Redis when `UPSTASH_REDIS_REST_URL`/`_TOKEN` are set, otherwise an in-memory `Map` fallback (per-instance, not shared across serverless invocations). Rate-limited responses return 429 with `Retry-After` and `X-RateLimit-*` headers.
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

`app/api/orders/checkout/route.ts` and `app/api/orders/webhook/route.ts` handle Stripe Checkout creation and webhook fulfillment, writing to the `Order` model. `lib/validate-checkout-prices.ts` is the trust boundary — never trust client-supplied prices, always re-validate against Prisma.

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
