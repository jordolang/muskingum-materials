# Developer Setup Guide

## TL;DR

**Minimum required:** Neon Postgres database (`DATABASE_URL` + `DIRECT_URL`).
Everything else is optional and degrades gracefully.

For full-feature local development, add Clerk (auth) and Sanity (CMS).
For minimal testing, just set up the database and start coding.

Copy `.env.local.example` to `.env.local`, fill in required database credentials,
then run `npm install && npm run db:push && npm run db:seed && npm run dev`.

## Required Services

| Service | Environment Variables | Why Required |
| --- | --- | --- |
| **Neon PostgreSQL** | `DATABASE_URL`, `DIRECT_URL` | Prisma ORM requires database connection. All transactional data (orders, users, products) lives here. |

### Neon Database Setup

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Navigate to **Dashboard → Connection Details**
4. Copy the **Pooled connection** string to `DATABASE_URL`
5. Copy the **Direct connection** string to `DIRECT_URL`

**Common errors:**

- `Connection refused` → Check that connection strings include `?sslmode=require`
- `Password authentication failed` → Regenerate password in Neon dashboard and update `.env.local`
- `prisma generate` fails → Run `npm install` to trigger the `postinstall` hook
- `PrismaClientInitializationError` → Missing `DATABASE_URL` or malformed connection string

## Optional Services

All optional services degrade gracefully when env vars are absent. The table
below describes what stops working when each service is missing.

| Service | Degraded Behavior | How to Obtain Keys |
| --- | --- | --- |
| **Sanity CMS** | Studio at `/studio` returns 400. Marketing content (testimonials, FAQs, gallery, blog) will not load. | [sanity.io/manage](https://www.sanity.io/manage) |
| **Clerk Auth** | Guest checkout only. No user accounts, no `/account` dashboard, no loyalty program. | [dashboard.clerk.com](https://dashboard.clerk.com) |
| **Stripe Payments** | Checkout redirects to quote request form instead of payment flow. | [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys) |
| **Anthropic AI** | AI chat falls back to keyword-matched static responses (see `getStaticResponse` in `app/api/chat/route.ts`). | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |
| **Postmark Email** | Transactional emails (order confirmations, contact form, newsletters) not sent. Orders/quotes still save to DB. | [account.postmarkapp.com/servers](https://account.postmarkapp.com/servers) |
| **Twilio SMS** | SMS notifications disabled. Falls back to email if Postmark is configured, otherwise silent. | [console.twilio.com](https://console.twilio.com) |
| **Upstash Redis** | Rate limiting uses in-memory fallback (per-instance, not shared across serverless invocations). | [console.upstash.com/redis](https://console.upstash.com/redis) |
| **Google Maps API** | Satellite area estimator and `/contact` embed map disabled. | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) |
| **Google Analytics** | No analytics tracking. App functions normally. | [analytics.google.com/analytics/web](https://analytics.google.com/analytics/web) |
| **Sentry** | Errors logged to console only, no remote tracking. | [sentry.io/settings/projects](https://sentry.io/settings/projects) |

## Minimal Developer Setup (What You Can Skip)

To run the app locally with core functionality (product catalog, order form,
contact form, admin dashboard), you **only need**:

1. **Neon Postgres** (`DATABASE_URL`, `DIRECT_URL`)

**Skip these** unless you're actively working on related features:

- Clerk → unless testing user auth, SSO, or account dashboard
- Sanity → unless editing marketing content in `/studio`
- Stripe → unless testing checkout payment flow (quote requests still work)
- Anthropic → unless testing AI chat (static keyword responses are sufficient for most dev)
- Postmark / Twilio → unless testing email/SMS notifications
- Upstash → in-memory fallback works fine for local dev
- Google Maps / Analytics / Sentry → skip unless testing those specific integrations

## Service-Specific Setup Instructions

### Sanity CMS

**Required env vars:**
```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_write_token
```

**Steps:**

1. Create account at [sanity.io/manage](https://www.sanity.io/manage)
2. Create new project
3. Copy **Project ID** to `NEXT_PUBLIC_SANITY_PROJECT_ID`
4. Set dataset name to `production` (or create a new dataset in dashboard)
5. Navigate to **API → Tokens** and create a token with **Editor** role
6. Copy token to `SANITY_API_TOKEN`
7. Start dev server and visit [localhost:3000/studio](http://localhost:3000/studio)

**Common errors:**

- `ProjectId not provided` → Missing `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `Unauthorized` at `/studio` → Missing or invalid `SANITY_API_TOKEN`
- Schema not loading → Run `npm install` to ensure `sanity` package is installed

### Clerk Authentication

**Required env vars:**
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

**Steps:**

1. Create account at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create new application
3. Copy **Publishable Key** to `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Copy **Secret Key** to `CLERK_SECRET_KEY`
5. In Clerk dashboard, configure OAuth providers (Google, GitHub, Apple, Facebook) if needed
6. Set redirect URLs to `http://localhost:3000/sign-in` and `http://localhost:3000/sign-up`

**Graceful degradation logic:**

`middleware.ts` and `app/layout.tsx` check if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
is set **and not equal to the placeholder value `"your_clerk_publishable_key"`**.
If missing or placeholder, Clerk is skipped entirely — no auth checks, no
`ClerkProvider` behavior. Guest checkout works without Clerk.

**Common errors:**

- `Missing publishableKey` → Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or remove placeholder
- Redirect loop on sign-in → Check `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` (not `/api/sign-in`)
- OAuth providers not showing → Configure them in Clerk dashboard under **User & Authentication → Social Connections**

### Stripe Payments

**Required env vars:**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Steps:**

1. Create account at [stripe.com](https://stripe.com)
2. Navigate to **Developers → API Keys** (use **Test mode**)
3. Copy **Publishable key** to `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
4. Copy **Secret key** to `STRIPE_SECRET_KEY`
5. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (macOS)
6. Run `stripe login` to authenticate
7. Forward webhooks to local dev server:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/orders/webhook
   ```
8. Copy the webhook signing secret (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET`

**Webhook endpoint:** `/api/orders/webhook` handles `checkout.session.completed`
events to mark orders paid, award loyalty points, and send SMS confirmations.

**Common errors:**

- `No such checkout session` → Webhook secret mismatch; restart `stripe listen`
- `Invalid API key` → Check that `STRIPE_SECRET_KEY` starts with `sk_test_` (not `sk_live_`)
- Orders not marked paid → Webhook not reaching server; verify `stripe listen` is running
- `validateCheckoutPrices` fails → Client-side price tampering detected (expected behavior)

### Anthropic AI Chat

**Required env var:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Steps:**

1. Create account at [console.anthropic.com](https://console.anthropic.com)
2. Navigate to **Settings → API Keys**
3. Create new key
4. Copy to `ANTHROPIC_API_KEY`

**Graceful degradation:**

When `ANTHROPIC_API_KEY` is missing, `app/api/chat/route.ts` falls back to
`getStaticResponse()`, which uses keyword matching to return canned responses
about business hours, location, pricing, and services (see `data/business.ts`
for the source data).

**Common errors:**

- `401 Unauthorized` → Invalid API key; regenerate in Anthropic console
- `429 Too Many Requests` → Rate limit exceeded; upgrade plan or wait
- Chat returns gibberish → Check that model is `claude-haiku-4-5-20251001` (see `app/api/chat/route.ts`)

### Postmark Email

**Required env vars:**
```bash
POSTMARK_API_TOKEN=...
POSTMARK_FROM_EMAIL=sales@muskingummaterials.com
POSTMARK_TO_EMAIL=sales@muskingummaterials.com
```

**Steps:**

1. Create account at [postmarkapp.com](https://postmarkapp.com)
2. Create a **Server**
3. Copy **Server API Token** to `POSTMARK_API_TOKEN`
4. Verify sender email domain in Postmark dashboard
5. Set `POSTMARK_FROM_EMAIL` to verified sender address
6. Set `POSTMARK_TO_EMAIL` to recipient for contact/quote notifications

**Common errors:**

- `406 Inactive recipient` → Recipient email not verified; check Postmark dashboard
- `422 Invalid sender signature` → `POSTMARK_FROM_EMAIL` domain not verified
- Emails not sending → Check server logs for `postmark` errors; verify token is active

### Twilio SMS

**Required env vars:**
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890
```

**Steps:**

1. Create account at [twilio.com/console](https://www.twilio.com/console)
2. Copy **Account SID** to `TWILIO_ACCOUNT_SID`
3. Copy **Auth Token** to `TWILIO_AUTH_TOKEN`
4. Purchase a phone number or use trial number
5. Copy phone number to `TWILIO_PHONE_NUMBER` (include `+1` country code)
6. Configure webhook for incoming SMS:
   - Navigate to **Phone Numbers → Manage → Active Numbers → [Your Number]**
   - Set **A Message Comes In** webhook to `https://yourdomain.com/api/sms/webhook`

**Graceful degradation:**

If Twilio vars are missing, SMS notifications are skipped. If `POSTMARK_API_TOKEN`
is set, order confirmations fall back to email. Otherwise, notifications are
silently skipped (order still saves to DB).

**Common errors:**

- `21608: Unable to create record` → `TWILIO_PHONE_NUMBER` not verified or trial restrictions
- `20003: Authentication failed` → Invalid `TWILIO_AUTH_TOKEN`
- STOP opt-out not working → Webhook URL not configured in Twilio dashboard

### Upstash Redis (Rate Limiting)

**Required env vars:**
```bash
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

**Steps:**

1. Create account at [console.upstash.com](https://console.upstash.com)
2. Create new Redis database
3. Navigate to **REST API** section
4. Copy **REST URL** to `UPSTASH_REDIS_REST_URL`
5. Copy **REST Token** to `UPSTASH_REDIS_REST_TOKEN`

**Graceful degradation:**

When Upstash vars are missing, `lib/rate-limit.ts` uses an in-memory `Map` as
a fallback. This works fine for local dev but **does not persist across serverless
invocations** in production. Each rate limit tier (chat: 5/min, checkout: 10/hr,
leads: 20/hr) is enforced per-instance, not globally.

**Common errors:**

- `ECONNREFUSED` → `UPSTASH_REDIS_REST_URL` incorrect; check trailing slash
- Rate limits not working → Verify env vars are set; check middleware logs for fallback warnings

### Google Maps API

**Required env var:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

**Steps:**

1. Navigate to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Create new project or select existing
3. Click **Create Credentials → API Key**
4. Restrict key to **Maps JavaScript API** and **Places API**
5. Copy key to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
6. Enable **Maps JavaScript API** in **APIs & Services → Library**

**Used in:**

- `/order` form: Satellite map polygon area estimator (Step 1)
- `/contact` page: Embedded map showing business location

**Common errors:**

- Map not loading → Check browser console for `InvalidKeyMapError`; verify API key restrictions
- `RefererNotAllowedMapError` → Add `http://localhost:3000` to allowed referrers in Google Cloud Console

## Common Setup Errors and Fixes

### Database Connection Issues

**Symptom:** `PrismaClientInitializationError: Can't reach database server`

**Fixes:**

1. Check `DATABASE_URL` includes `?sslmode=require`
2. Verify Neon database is active (not hibernated)
3. Regenerate password in Neon dashboard if auth fails
4. Use `DIRECT_URL` for migrations, `DATABASE_URL` for runtime queries

### Prisma Client Not Generated

**Symptom:** `@prisma/client did not initialize yet`

**Fix:** Run `npm install` (triggers `postinstall` script that runs `prisma generate`)

### Middleware Errors on Missing Clerk

**Symptom:** `Missing publishableKey` during dev server startup

**Fix:** Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to any non-placeholder value,
or leave it unset entirely. The middleware checks for the placeholder value
`"your_clerk_publishable_key"` and skips Clerk if present.

### Stripe Webhook Signature Verification Fails

**Symptom:** `Webhook Error: No signatures found matching the expected signature`

**Fix:**

1. Restart `stripe listen --forward-to http://localhost:3000/api/orders/webhook`
2. Copy the new webhook signing secret (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET` in `.env.local`
3. Restart dev server

### Rate Limiting Not Working Locally

**Symptom:** Can spam API endpoints without 429 responses

**Explanation:** In-memory fallback is working as expected. Each dev server restart
resets the rate limit counters. To test real rate limiting, set up Upstash Redis.

### Sanity Studio 400 on `/studio`

**Symptom:** `Bad Request` when visiting `http://localhost:3000/studio`

**Fix:**

1. Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set
2. Check `sanity.config.ts` `projectId` matches your Sanity project
3. Run `npm install` to ensure `sanity` package is installed

## Graceful Degradation Explained

The app is designed to run with **only a database connection** in minimal mode.
Here's how each optional service degrades:

### Authentication (Clerk)

- **Middleware** (`middleware.ts` lines 8-11): Checks if `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  is set and not the placeholder `"your_clerk_publishable_key"`. If missing,
  skips Clerk entirely.
- **Layout** (`app/layout.tsx` lines 17-21): Same check before wrapping app in `ClerkProvider`.
- **Result:** Guest checkout works, but no user accounts, no `/account` dashboard,
  no loyalty program.

### AI Chat (Anthropic)

- **Route** (`app/api/chat/route.ts`): Tries `generateText` with Anthropic SDK.
  If `ANTHROPIC_API_KEY` is missing, the SDK throws an error caught by the
  fallback logic, which returns `getStaticResponse()` (keyword-matched canned answers).
- **Result:** Chat widget works, but responses are static and less helpful.

### Rate Limiting (Upstash Redis)

- **Library** (`lib/rate-limit.ts` lines 57-63): Checks if `UPSTASH_REDIS_REST_URL`
  and `UPSTASH_REDIS_REST_TOKEN` are set. If missing, uses `InMemoryStore` class.
- **Result:** Rate limiting works per-instance. In serverless environments
  (Vercel, AWS Lambda), each invocation gets its own instance, so limits are
  not shared. In local dev, limits reset on server restart.

### Email (Postmark)

- **Used in:** `lib/email.ts` (or wherever Postmark client is instantiated)
- **Result:** Transactional emails silently fail. Orders and quotes still save
  to the database. Check server logs for `POSTMARK_API_TOKEN not set` warnings.

### SMS (Twilio)

- **Used in:** `lib/sms.ts` or order webhook (`app/api/orders/webhook/route.ts`)
- **Result:** SMS notifications skipped. Falls back to email if Postmark is configured.
  Otherwise, silent failure. Orders still complete.

### Payments (Stripe)

- **Route** (`app/api/orders/checkout/route.ts`): Checks if `STRIPE_SECRET_KEY`
  is set before calling `stripe.checkout.sessions.create()`. If missing, redirects
  to quote request form instead of payment flow.
- **Result:** Customers can still submit quote requests. Payment processing disabled.

### CMS (Sanity)

- **Route** (`app/studio/[[...tool]]/page.tsx`): Sanity Studio component requires
  `NEXT_PUBLIC_SANITY_PROJECT_ID`. If missing, returns 400.
- **Content queries** (`lib/sanity/queries.ts`): GROQ queries fail gracefully,
  returning empty arrays for testimonials, FAQs, gallery images, blog posts.
- **Result:** Marketing content sections render as empty. Product catalog (Prisma)
  still works.

## Development Workflow

### First-Time Setup

```bash
# 1. Clone and install
git clone https://github.com/jordolang/muskingum-materials.git
cd muskingum-materials
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local and add DATABASE_URL + DIRECT_URL (minimum)

# 3. Initialize database
npm run db:push   # Push schema to Neon
npm run db:seed   # Seed products, services, cost guides

# 4. Start dev server
npm run dev       # http://localhost:3000
```

### Adding a New Service

When integrating a new third-party service:

1. **Add env vars** to `.env.local.example` with documentation
2. **Check for env vars** in your integration code (never assume they're set)
3. **Degrade gracefully** when missing (log a warning, skip functionality, use fallback)
4. **Update this guide** with setup instructions and common errors
5. **Update CSP** in `next.config.ts` if service injects scripts/iframes/connects to external hosts
6. **Register in middleware** (`middleware.ts`) if service provides a public API endpoint that needs rate limiting

### Running Verification Scripts

See `README.md` for ad-hoc verification scripts:

```bash
# Order number generation
node test-order-number.js

# Auth route protection (requires Clerk setup)
bash test-protected-routes.sh

# Rate limiting (tests 429 responses, per-IP isolation)
bash test-rate-limits.sh
```

## Production Deployment Checklist

Before deploying to production (Vercel), verify:

- [ ] All **required** env vars set in Vercel dashboard (`DATABASE_URL`, `DIRECT_URL`)
- [ ] **Optional** env vars set for features you want enabled (Clerk, Stripe, Postmark, etc.)
- [ ] `STRIPE_WEBHOOK_SECRET` set to **production** webhook signing secret (not test mode)
- [ ] `NEXT_PUBLIC_SITE_URL` set to production domain (e.g., `https://muskingummaterials.com`)
- [ ] Sanity dataset set to `production` (not `development`)
- [ ] Clerk redirect URLs updated to production domain
- [ ] Stripe webhook endpoint configured in Stripe dashboard: `https://yourdomain.com/api/orders/webhook`
- [ ] Twilio webhook endpoint configured: `https://yourdomain.com/api/sms/webhook`
- [ ] Google Maps API key restrictions updated to allow production domain
- [ ] Postmark sender domain verified and production sender signature active
- [ ] Upstash Redis configured for production rate limiting (do not rely on in-memory fallback)
- [ ] Sentry DSN set for error tracking

## Troubleshooting Checklist

If something isn't working:

1. **Check env vars** are set and not placeholder values
2. **Restart dev server** after changing `.env.local`
3. **Check browser console** for client-side errors (missing API keys, CSP violations)
4. **Check server logs** for backend errors (database connection, API failures)
5. **Verify external service status** (Neon, Clerk, Stripe, Sanity, Upstash)
6. **Test with minimal config** (only `DATABASE_URL`) to isolate the issue
7. **Read relevant sections above** for service-specific common errors

## Where to Find Help

- **Neon Database:** [neon.tech/docs](https://neon.tech/docs)
- **Sanity CMS:** [sanity.io/docs](https://www.sanity.io/docs)
- **Clerk Auth:** [clerk.com/docs](https://clerk.com/docs)
- **Stripe Payments:** [stripe.com/docs](https://stripe.com/docs)
- **Anthropic AI:** [docs.anthropic.com](https://docs.anthropic.com)
- **Postmark Email:** [postmarkapp.com/developer](https://postmarkapp.com/developer)
- **Twilio SMS:** [twilio.com/docs](https://www.twilio.com/docs)
- **Upstash Redis:** [upstash.com/docs](https://upstash.com/docs)

## Quick Reference: Env Vars by Feature

| Feature | Required Env Vars |
| --- | --- |
| **Database** | `DATABASE_URL`, `DIRECT_URL` |
| **Auth** | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| **Payments** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| **AI Chat** | `ANTHROPIC_API_KEY` |
| **Email** | `POSTMARK_API_TOKEN`, `POSTMARK_FROM_EMAIL`, `POSTMARK_TO_EMAIL` |
| **SMS** | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| **Rate Limiting** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **CMS** | `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN` |
| **Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| **Analytics** | `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` |
| **Error Tracking** | `NEXT_PUBLIC_SENTRY_DSN` |
