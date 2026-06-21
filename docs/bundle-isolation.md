# Sanity Studio Bundle Isolation

## TL;DR

Sanity Studio (`/studio`) and its heavy dependencies (`styled-components`, `sanity`,
`@sanity/vision`, `next-sanity`) do **not** leak into the main application bundles.
Next.js route-level code splitting already isolates them to the Studio route.
Multiple safeguards are now in place to prevent future leaks.

**Safeguards:**
- ✓ ESLint rules block Studio imports outside `/studio` directory
- ✓ CI workflow verifies bundle isolation on every build
- ✓ Enhanced verification script with detailed chunk-by-chunk analysis

Use `npm run analyze:bundle` after any change to `sanity.config.ts`,
`app/studio/**`, or bundle-affecting config (`next.config.ts`, shared utilities
that import from `sanity/*` or `@sanity/*`) to confirm isolation is still intact.

## Verified Findings (latest verification: 2026-06-21)

**Bundle Analysis Summary:**
- **Routes analyzed:** 129 non-Studio routes, 2 Studio routes
- **Chunks scanned:** 159 unique chunks
- **Total bundle analyzed:** 1.18 MB
- **Contaminated chunks:** 0 (✓ **ISOLATION VERIFIED**)

| Surface | First Load JS | Studio chunks loaded |
| --- | --- | --- |
| `/` (home) | ~131 kB | 0 |
| `/products` | ~103 kB | 0 |
| `/order` | ~148 kB | 0 |
| `/contact` | ~135 kB | 0 |
| `/studio/[[...tool]]` | ~1.86 MB | all Studio chunks |

**Key Isolation Points:**
- `styled-components` is present in **exactly one chunk** that is referenced
  **only** by the Studio route entry in `app-build-manifest.json`.
- Sanity packages (`sanity`, `@sanity/vision`, `next-sanity`,
  `sanity/structure`) appear only in Studio-specific chunks.
- Shared chunks loaded by every route (~103 kB total) contain **no**
  `styled-components` or Sanity runtime code.

Run `npm run analyze:bundle --verbose` for detailed chunk-by-chunk analysis.

## Why isolation works without extra config

1. `sanity.config.ts` is imported transitively from one place:
   `app/studio/[[...tool]]/page.tsx`. Because that page is the only consumer,
   Next.js's production build keeps the Studio dependency graph in
   Studio-scoped chunks.
2. `lib/sanity/client.ts` uses `@sanity/client` only for read queries. That is
   a lightweight HTTP client and does not pull in `styled-components` or
   `@sanity/vision`.
3. The `/studio/[[...tool]]` catch-all is dynamic, so its chunks are loaded
   on demand and are not part of the initial page graph for any other route.

## Safeguards

### 1. ESLint Rules

The project includes `no-restricted-imports` rules in `.eslintrc.json` that
prevent Studio-specific imports outside of allowed directories:

**Blocked imports** (in main app code):
- `sanity` (core Studio package)
- `sanity/*` (structure, cli, presentation, etc.)
- `@sanity/vision` (Studio Vision plugin)
- `@sanity/ui` (Studio UI components)
- `styled-components` (Studio CSS-in-JS dependency)
- `next-sanity/studio` (Studio integration)

**Allowed imports** (safe for public pages):
- `@sanity/client` (API client for content fetching)
- `@sanity/image-url` (image URL builder utility)

**Exempted directories** (can import Studio code):
- `app/studio/**`
- `sanity/**`
- `sanity.config.ts`
- `sanity.cli.ts`

Attempting to import Studio code in public pages will produce a clear ESLint
error with guidance on using lightweight alternatives.

Run `npm run lint` to check for violations.

### 2. CI Workflow

`.github/workflows/bundle-isolation-check.yml` automatically verifies bundle
isolation on:
- All pull requests (opened, reopened, synchronize events)
- Pushes to main branch

The workflow:
1. Runs a production build
2. Executes the verification script
3. Fails the CI check if Studio code leaks are detected
4. Uploads build manifests as artifacts for debugging failures

This prevents accidental Studio code leaks from being merged.

### 3. Enhanced Verification Script

`scripts/verify-bundle-isolation.mjs` provides comprehensive bundle analysis
with the following features:

**Enhanced capabilities:**
- Chunk size tracking with human-readable output (KB/MB)
- Total bundle size reporting
- Clean vs. contaminated chunk statistics
- `--verbose` mode for detailed route-by-route breakdown
- Improved leak reporting grouped by chunk with affected routes

**Run it via:**
```bash
npm run build
npm run analyze:bundle          # Standard summary output
npm run analyze:bundle --verbose # Detailed chunk-by-chunk analysis
```

The script is used for local diagnostics and automated CI verification.

## Developer Guidelines

### Safe Sanity Imports (public pages)

✅ **Allowed** - Lightweight libraries for content fetching:
```typescript
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import { groq } from 'next-sanity'
```

❌ **Forbidden** - Studio-specific code:
```typescript
import { defineConfig } from 'sanity'                    // ESLint error
import { visionTool } from '@sanity/vision'               // ESLint error
import { structureTool } from 'sanity/structure'          // ESLint error
import { Studio } from 'next-sanity/studio'               // ESLint error
import styled from 'styled-components'                    // ESLint error
```

### Import Patterns to Avoid

**❌ Don't import `sanity.config.ts` in public pages:**
```typescript
// BAD - pulls in all Studio plugins
import { config } from '@/sanity.config'
```

**✅ Extract shared config to a separate file:**
```typescript
// sanity.config.public.ts
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!
export const apiVersion = '2024-01-01'
```

## When to Re-Verify

Re-run `npm run analyze:bundle` whenever you:

- Change `sanity.config.ts` (especially the `plugins` array).
- Add a new `import` from `sanity`, `@sanity/*`, or `next-sanity` outside of
  `app/studio/**` or `sanity.config.ts`.
- Introduce shared UI primitives that transitively reach Sanity Studio code
  (for example, a `components/sanity/*` module used on both Studio and public
  pages).
- Upgrade `next`, `sanity`, `next-sanity`, or `styled-components`.
- Add new dependencies that might pull in `styled-components`.

**Note:** CI will automatically verify isolation on every pull request, but
local verification helps catch issues before pushing.

### If Leakage is Detected

If the script reports leakage, prefer one of these fixes before touching
`next.config.ts`:

1. **Remove the import** - Check if you actually need the Studio-specific code
   in your public page. Often the import can simply be removed.

2. **Use dynamic import** - Move the offending import behind a dynamic
   `import()` inside a Studio-only module (usually `sanity.config.ts` or an
   `app/studio/**` component).

3. **Split shared utilities** - Separate public-safe utilities from
   Studio-specific code so non-Studio callers do not import the Sanity module
   at all.

Route-level splitting can only help if the dependency graph cleanly separates
Studio from public routes. The ESLint rules will help prevent accidental
violations.

## Dependency placement

`styled-components` and the `sanity` / `@sanity/*` / `next-sanity` packages
must stay in `dependencies` (not `devDependencies`). They are required at
runtime to render the `/studio` route in production. The bundle isolation
described above happens in the client chunks regardless of where they live in
`package.json`.

## Verification Details

The verification script reads `.next/app-build-manifest.json` after a
production build and fails with a non-zero exit code if:

- Any non-Studio route references a chunk containing `styled-components`.
- Any non-Studio route references a chunk containing Sanity Studio runtime
  code (`sanity/structure`, `@sanity/vision`, `@sanity/ui`, or the `sanity`
  package entry).

The script does not modify any files; it only analyzes and reports.
