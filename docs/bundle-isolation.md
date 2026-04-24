# Sanity Studio Bundle Isolation

## TL;DR

Sanity Studio (`/studio`) and its heavy dependencies (`styled-components`, `sanity`,
`@sanity/vision`, `next-sanity`) do **not** leak into the main application bundles.
Next.js route-level code splitting already isolates them to the Studio route.
No code changes are required.

Use `npm run analyze:bundle` after any change to `sanity.config.ts`,
`app/studio/**`, or bundle-affecting config (`next.config.ts`, shared utilities
that import from `sanity/*` or `@sanity/*`) to confirm isolation is still intact.

## Verified Findings (production build)

| Surface | First Load JS | Studio chunks loaded |
| --- | --- | --- |
| `/` (home) | ~131 kB | 0 |
| `/products` | ~103 kB | 0 |
| `/order` | ~148 kB | 0 |
| `/contact` | ~135 kB | 0 |
| `/studio/[[...tool]]` | ~1.86 MB | all Studio chunks |

- `styled-components` is present in **exactly one chunk** that is referenced
  **only** by the Studio route entry in `app-build-manifest.json`.
- Sanity packages (`sanity`, `@sanity/vision`, `next-sanity`,
  `sanity/structure`) appear only in Studio-specific chunks.
- Shared chunks loaded by every route (~103 kB total) contain **no**
  `styled-components` or Sanity runtime code.

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

## When to re-verify

Re-run `npm run analyze:bundle` whenever you:

- Change `sanity.config.ts` (especially the `plugins` array).
- Add a new `import` from `sanity`, `@sanity/*`, or `next-sanity` outside of
  `app/studio/**` or `sanity.config.ts`.
- Introduce shared UI primitives that transitively reach Sanity Studio code
  (for example, a `components/sanity/*` module used on both Studio and public
  pages).
- Upgrade `next`, `sanity`, `next-sanity`, or `styled-components`.

If the script reports leakage, prefer one of these fixes before touching
`next.config.ts`:

1. Move the offending import behind a dynamic `import()` inside a Studio-only
   module (usually `sanity.config.ts` or an `app/studio/**` component).
2. Split shared utilities so the non-Studio callers do not import the Sanity
   module at all. Route-level splitting can only help if the dependency graph
   cleanly separates Studio from public routes.

## Dependency placement

`styled-components` and the `sanity` / `@sanity/*` / `next-sanity` packages
must stay in `dependencies` (not `devDependencies`). They are required at
runtime to render the `/studio` route in production. The bundle isolation
described above happens in the client chunks regardless of where they live in
`package.json`.

## Verification script

`scripts/verify-bundle-isolation.mjs` reads `.next/app-build-manifest.json`
after a production build and fails with a non-zero exit code if:

- Any non-Studio route references a chunk containing `styled-components`.
- Any non-Studio route references a chunk containing Sanity Studio runtime
  code (`sanity/structure`, `@sanity/vision`, `@sanity/ui`, or the `sanity`
  package entry).

Run it via:

```bash
npm run build
npm run analyze:bundle
```

The script is intended for local diagnostics and CI; it does not modify any
files.
