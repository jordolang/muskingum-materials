# Sanity CMS Integration

## TL;DR

Sanity Studio is embedded at `/studio` and serves as the content management layer for **marketing content only** (testimonials, FAQs, gallery images, pages, posts, and the site settings singleton). Products and services exist in **both** Sanity and Prisma, but **Prisma is the runtime source of truth** for catalog pages. The two systems are not synced — when adding fields to products/services, decide which store owns that field and update accordingly.

The Studio client is fully isolated to the `/studio` route via Next.js route-level code splitting — it does not leak into public page bundles (see `docs/bundle-isolation.md` for verification).

Key files:
- **Studio config**: `sanity.config.ts`
- **Schemas**: `sanity/schemaTypes/`
- **GROQ queries**: `lib/sanity/queries.ts`
- **Client**: `lib/sanity/client.ts`
- **Embedded Studio**: `app/studio/[[...tool]]/page.tsx`

## Architecture Overview

The following diagram illustrates the complete data flow for Sanity CMS integration, including content reads, updates, and cache invalidation:

```mermaid
flowchart TB
    subgraph "Content Read Path"
        App[Next.js App<br/>Server Components] --> GROQ[GROQ Queries<br/>lib/sanity/queries.ts]
        GROQ --> Client[sanityClient<br/>lib/sanity/client.ts]
        Client --> CDN[Sanity CDN<br/>cdn.sanity.io]
        CDN --> Cache[ISR Cache<br/>1 hour TTL]
        Cache --> Response[Rendered Page]
    end

    subgraph "Content Update Path"
        Studio[Sanity Studio<br/>/studio route] --> Publish[Publish Event]
        Publish --> Webhook[Webhook Trigger]
        Webhook --> API[Revalidate API<br/>app/api/revalidate/route.ts]
        API --> Verify{Verify Secret}
        Verify -->|Valid| Revalidate[revalidateTag<br/>revalidatePath]
        Verify -->|Invalid| Reject[401 Unauthorized]
        Revalidate --> Purge[ISR Cache Purge]
        Purge --> Regen[Next Request<br/>Regenerates Page]
    end

    subgraph "Bundle Isolation"
        StudioBundle[Studio Bundle<br/>styled-components, @sanity/*]
        StudioRoute[/studio route ONLY]
        PublicRoutes[Public Routes<br/>NO Studio deps]
        
        StudioBundle -.->|isolated to| StudioRoute
        StudioBundle -.->|NOT included in| PublicRoutes
    end

    style App fill:#e1f5ff
    style Studio fill:#ffe1f5
    style StudioBundle fill:#fff4e1
    style Purge fill:#d4edda
    style Reject fill:#f8d7da
```

**Key Flows:**

1. **Read Path (blue)**: Next.js server components fetch content via GROQ queries through the lightweight `@sanity/client`, which reads from Sanity's CDN. Responses are cached by Next.js ISR with a 1-hour TTL.

2. **Update Path (pink)**: When content is published in Sanity Studio, a webhook triggers the `/api/revalidate` endpoint, which verifies the secret, then calls `revalidateTag()`/`revalidatePath()` to purge affected ISR cache entries. The next request regenerates the page with fresh content.

3. **Bundle Isolation (yellow)**: The full Sanity Studio runtime (including `styled-components` and `@sanity/*` packages) is isolated to the `/studio` route via Next.js code splitting. Public routes use only the lightweight `@sanity/client` (~50KB), not the full Studio bundle (~2MB+). See `docs/bundle-isolation.md` for verification.

## Parallel Content Stores

This is the **most important architectural concept** to understand:

### Prisma + Neon Postgres (Runtime Source of Truth)

**Owns**: All transactional data and runtime catalog data

| Model | Purpose |
| --- | --- |
| `Product` | Product catalog (runtime catalog pages read this) |
| `Service` | Service catalog (runtime catalog pages read this) |
| `CostGuide` | Cost estimation guides |
| `Order` | Customer orders |
| `Lead` | Sales leads |
| `ContactSubmission` | Contact form submissions |
| `QuoteRequest` | Quote requests |
| `ChatConversation`, `ChatMessage` | AI chat history |
| `NewsletterSubscriber` | Newsletter subscriptions |
| `UserProfile`, `Address` | User account data |
| `ProductComparison` | Product comparison matrix |

**Accessed via**: `lib/products.ts` (`getProducts()`, `getServices()`, `getCostGuides()`)

### Sanity Studio (Marketing Content)

**Owns**: Marketing and editorial content editable via the Studio UI

| Schema | Purpose |
| --- | --- |
| `product` | Product content (NOT used at runtime — see note below) |
| `service` | Service content (NOT used at runtime — see note below) |
| `testimonial` | Customer testimonials |
| `faq` | Frequently asked questions |
| `galleryImage` | Project gallery images |
| `page` | Custom pages |
| `post` | Blog posts |
| `siteSettings` | Site-wide settings (singleton) |

**Accessed via**: `lib/sanity/client.ts` (GROQ queries in `lib/sanity/queries.ts`)

### The `product` and `service` Overlap

`product` and `service` exist in **both** systems:

- **Prisma models** are what the app reads at runtime for `/products`, `/services`, and catalog pages
- **Sanity schemas** are editable via the Studio but are **not currently consumed by the app**

This duplication exists for historical/migration reasons. When changing the shape of products or services:

1. Decide which store is authoritative for the new field
2. Update the appropriate schema (Prisma schema or Sanity schema type)
3. If adding to Prisma, run `npm run db:push` to sync to Neon
4. If adding to Sanity, publish via the Studio

**Important**: The two stores are **not synced automatically**. Changing a product in Sanity will not update the Prisma database, and vice versa.

## Sanity Studio Embedding

### Route Integration

The Studio is embedded as a Next.js App Router catch-all route at `app/studio/[[...tool]]/page.tsx`:

```tsx
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
```

This renders Sanity's entire admin UI inside the Next.js app at `https://yoursite.com/studio`.

### Configuration

`sanity.config.ts` defines the Studio's structure, plugins, and behavior:

```typescript
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemaTypes";
import { sanityConfig } from "./lib/sanity/config";

export default defineConfig({
  name: "muskingum-materials",
  title: "Muskingum Materials",
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  basePath: "/studio",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.listItem()
              .title("Site Settings")
              .id("siteSettings")
              .child(
                S.document()
                  .schemaType("siteSettings")
                  .documentId("siteSettings")
              ),
            S.divider(),
            S.documentTypeListItem("product").title("Products"),
            S.documentTypeListItem("service").title("Services"),
            S.documentTypeListItem("testimonial").title("Testimonials"),
            // ...
          ]),
    }),
    visionTool({ defaultApiVersion: sanityConfig.apiVersion }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({ action }) => action && singletonActions.has(action))
        : input,
  },
});
```

**Key config points**:

- `basePath: "/studio"` mounts the Studio at `/studio`
- `structureTool` defines the Studio's sidebar structure
- `visionTool` enables the GROQ query playground
- Singleton enforcement for `siteSettings` (see below)

### Singleton Pattern (siteSettings)

`siteSettings` is a **singleton** — only one instance exists, and the Studio UI prevents creating duplicates:

```typescript
const singletonTypes = new Set(["siteSettings"]);
const singletonActions = new Set(["publish", "discardChanges", "restore"]);

// In defineConfig:
schema: {
  templates: (templates) =>
    templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
},
document: {
  actions: (input, context) =>
    singletonTypes.has(context.schemaType)
      ? input.filter(({ action }) => action && singletonActions.has(action))
      : input,
},
```

This:
- Removes the "Create" template for `siteSettings` (can't create new instances)
- Limits actions to `publish`, `discardChanges`, and `restore` (no duplicate/delete)

The singleton is hardcoded to document ID `siteSettings` in the structure config.

## Schema Types

Schema types live in `sanity/schemaTypes/` and are registered in `sanity/schemaTypes/index.ts`:

```typescript
import { service } from "./service";
import { testimonial } from "./testimonial";
import { faq } from "./faq";
import { galleryImage } from "./gallery";
import { siteSettings } from "./siteSettings";
import { page } from "./page";
import { postType } from "./postType";

export const schemaTypes = [
  service,
  testimonial,
  faq,
  galleryImage,
  siteSettings,
  page,
  postType,
];
```

### Example Schema (siteSettings)

```typescript
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
    // ... more fields
  ],
  preview: {
    select: { title: "title" },
  },
});
```

**Pattern**:
- Use `defineType` for top-level schema types
- Use `defineField` for each field with validation and UI options
- Add `preview` config for how documents appear in the Studio list view

## GROQ Queries

GROQ (Graph-Relational Object Queries) is Sanity's query language. Queries are defined in `lib/sanity/queries.ts`:

```typescript
import { groq } from "next-sanity";

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
```

**GROQ syntax primer**:
- `*[_type == "testimonial"]` — filter all documents by type
- `&& approved == true` — additional filter
- `| order(_createdAt desc)` — sort by creation date descending
- `[0]` — return first result (for singletons)
- `{ _id, name, ... }` — projection (which fields to return)

### Executing Queries

Queries are executed via `sanityClient.fetch()`:

```typescript
import { sanityClient } from "@/lib/sanity/client";
import { testimonialsQuery } from "@/lib/sanity/queries";

export default async function ReviewsPage() {
  const testimonials = await sanityClient.fetch(testimonialsQuery);
  // ...
}
```

## Client Configuration

### Graceful Degradation

`lib/sanity/config.ts` validates env vars at load time and falls back to safe placeholders:

```typescript
const rawProjectId = (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "").trim();
const isValidProjectId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(rawProjectId);

const rawDataset = (process.env.NEXT_PUBLIC_SANITY_DATASET ?? "").trim();
const isValidDataset =
  /^(~[a-z0-9][-_a-z0-9]{0,63}|[a-z0-9][-_a-z0-9]{0,63})$/.test(rawDataset);

export const sanityConfig = {
  projectId: isValidProjectId ? rawProjectId : "placeholder",
  dataset: isValidDataset ? rawDataset : "production",
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
};
```

This allows `next build` to succeed even when Sanity env vars are missing (e.g., preview deployments without credentials).

### Stub Client for Missing Credentials

`lib/sanity/client.ts` returns a **no-op stub client** when `projectId === "placeholder"`:

```typescript
const usingPlaceholderConfig = sanityConfig.projectId === "placeholder";

function createStubClient(): SanityClient {
  const stub: Record<string, unknown> = {
    config: () => sanityConfig,
    fetch: () => Promise.resolve(undefined),
  };
  return new Proxy(stub, {
    get(target, prop) {
      if (prop in target) return target[prop as string];
      return () => Promise.resolve(undefined);
    },
  }) as unknown as SanityClient;
}

export const sanityClient = usingPlaceholderConfig
  ? createStubClient()
  : createClient({
      ...sanityConfig,
      stega: { studioUrl: "/studio" },
    });
```

**Why this matters**:
- Vercel preview builds run `next build` without `DATABASE_URL` or Sanity creds
- Without the stub, Sanity HTTP calls would throw "Dataset not found" errors and crash the build worker
- The stub client returns `undefined` for all queries, which calling code treats as "no data, fall back to static defaults"

### Preview Client

A separate preview client bypasses the CDN and uses an API token for draft content:

```typescript
export const previewClient = safeCreateClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});
```

This is for preview/draft modes (not currently used in this app, but available for future use).

## Bundle Isolation

Sanity Studio and its dependencies (`styled-components`, `sanity`, `@sanity/vision`, `next-sanity`) are **fully isolated** to the `/studio` route. They do **not** leak into public page bundles.

**Why it works**:
- `sanity.config.ts` is imported only from `app/studio/[[...tool]]/page.tsx`
- Next.js route-level code splitting keeps Studio chunks separate
- `lib/sanity/client.ts` uses `@sanity/client` (lightweight HTTP client), not the full Studio runtime

**Verification**:

```bash
npm run build
npm run analyze:bundle
```

This runs `scripts/verify-bundle-isolation.mjs`, which parses `.next/app-build-manifest.json` and fails if any non-Studio route references a chunk containing `styled-components` or Sanity Studio runtime code.

See `docs/bundle-isolation.md` for detailed findings.

### When to Re-Verify

Re-run bundle analysis whenever you:
- Change `sanity.config.ts` (especially the `plugins` array)
- Add a new import from `sanity`, `@sanity/*`, or `next-sanity` outside of `app/studio/**`
- Introduce shared UI primitives that transitively reach Sanity Studio code
- Upgrade `next`, `sanity`, `next-sanity`, or `styled-components`

## Content Security Policy (CSP)

`next.config.ts` defines a strict CSP that explicitly allowlists Sanity domains:

```typescript
"connect-src 'self' ... https://cdn.sanity.io https://*.sanity.io wss://*.api.sanity.io https://*.apicdn.sanity.io https://sanity-cdn.com https://*.sanity-cdn.com",
"frame-src 'self' ... https://*.sanity.io https://*.sanity-cdn.com https://*.sanity.work",
"frame-ancestors 'self' https://*.sanity.io https://*.sanity.work https://*.sanity.build",
"img-src 'self' ... https://cdn.sanity.io",
"script-src 'self' ... https://core.sanity-cdn.com",
```

**Key points**:
- `cdn.sanity.io` for image assets
- `wss://*.api.sanity.io` for Studio websocket (real-time updates)
- `frame-ancestors` allows Sanity hosts to embed the Studio (for visual editing features)

**If you add a new Sanity service or domain** (e.g., a new Sanity plugin that loads assets from a different CDN), you **must** update the CSP or those resources will be silently blocked in production.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes* | Sanity project ID (from sanity.io dashboard) |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes* | Dataset name (usually `production`) |
| `SANITY_API_TOKEN` | No | API token for preview/draft mode (not currently used) |

*Required for Studio to work, but builds succeed without them (stub client fallback)

## Typical Data Flow

### Fetching Content (Server Component)

```typescript
import { sanityClient } from "@/lib/sanity/client";
import { testimonialsQuery } from "@/lib/sanity/queries";

export default async function ReviewsPage() {
  const testimonials = await sanityClient.fetch(testimonialsQuery);
  
  if (!testimonials || testimonials.length === 0) {
    return <p>No reviews yet.</p>;
  }

  return (
    <div>
      {testimonials.map((testimonial) => (
        <TestimonialCard key={testimonial._id} {...testimonial} />
      ))}
    </div>
  );
}
```

### Editing Content

1. Navigate to `/studio` (requires authentication if Sanity auth is configured)
2. Select a document type from the sidebar (e.g., "Testimonials")
3. Create/edit/publish a document via the Studio UI
4. Changes are live immediately if using CDN (may have ~60s cache delay)
5. Revalidate the affected Next.js pages via the revalidate API if needed

## Common Patterns

### Adding a New Schema Type

1. Create `sanity/schemaTypes/myNewType.ts`:

```typescript
import { defineField, defineType } from "sanity";

export const myNewType = defineType({
  name: "myNewType",
  title: "My New Type",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    // ... more fields
  ],
});
```

1. Register in `sanity/schemaTypes/index.ts`:

```typescript
import { myNewType } from "./myNewType";

export const schemaTypes = [
  // ... existing types
  myNewType,
];
```

1. Add to Studio structure in `sanity.config.ts`:

```typescript
S.documentTypeListItem("myNewType").title("My New Type"),
```

1. Define a GROQ query in `lib/sanity/queries.ts`:

```typescript
export const myNewTypeQuery = groq`
  *[_type == "myNewType"] | order(_createdAt desc) {
    _id,
    title,
    // ... fields
  }
`;
```

1. Deploy the schema:

```bash
npx sanity deploy
```

(This updates the Studio's GraphQL API and schema introspection, though this app uses GROQ, not GraphQL)

### Adding an Image Field

Sanity has built-in image handling with hotspot/crop support:

```typescript
defineField({
  name: "featuredImage",
  title: "Featured Image",
  type: "image",
  options: {
    hotspot: true, // Enable focal point selection
  },
  fields: [
    {
      name: "alt",
      title: "Alt Text",
      type: "string",
      validation: (Rule) => Rule.required(),
    },
  ],
}),
```

Images are served via Sanity's CDN (`cdn.sanity.io`) with automatic resizing/optimization.

## Troubleshooting

### Studio shows "Dataset not found"

- Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set correctly
- Check that the dataset exists in your Sanity project dashboard
- Confirm env vars are prefixed with `NEXT_PUBLIC_` (required for client-side access)

### Studio loads but shows empty content

- Check that documents exist in the dataset (use the Vision plugin to run a test query: `*[_type == "siteSettings"]`)
- Verify the dataset name matches (dev vs production)
- Confirm the Studio structure config in `sanity.config.ts` includes the document type

### Build fails with "Cannot read property 'fetch' of undefined"

- The stub client fallback may not be working correctly
- Verify `lib/sanity/config.ts` validation regexes match Sanity's actual format
- Check that `lib/sanity/client.ts` is exporting `sanityClient` correctly

### Changes in Studio don't appear on the site

- **CDN caching**: Sanity's CDN has a ~60s cache. Wait or use `useCdn: false` for instant updates (slower)
- **Next.js caching**: Server components are cached. Trigger a revalidation via `/api/revalidate` or use `revalidatePath()` in a server action
- **Wrong dataset**: Confirm the Studio and runtime client are using the same dataset

### Bundle size regression (Studio leaking into public pages)

- Run `npm run analyze:bundle` to identify which route imported Studio code
- Check recent changes for imports from `sanity.config.ts`, `sanity/*`, or `@sanity/*` outside of `app/studio/**`
- Move the offending import behind a dynamic `import()` or refactor to split the dependency graph

## Related Documentation

- `docs/bundle-isolation.md` — Sanity Studio bundle isolation verification
- `prisma/schema.prisma` — Prisma models (parallel content store)
- `lib/products.ts` — Prisma-based product/service access (runtime catalog)
- `README.md` — Environment variables and setup instructions
