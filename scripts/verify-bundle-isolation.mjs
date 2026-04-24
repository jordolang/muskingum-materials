#!/usr/bin/env node
/**
 * Verifies that Sanity Studio dependencies stay isolated to the /studio route.
 *
 * Run after `npm run build`. Exits non-zero if `styled-components` or Sanity
 * Studio runtime code is reachable from any non-Studio route's client bundle.
 *
 * See docs/bundle-isolation.md for context.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, ".next", "app-build-manifest.json");
const chunksDir = path.join(repoRoot, ".next", "static", "chunks");

const STUDIO_ROUTE_PREFIX = "/studio";

const FORBIDDEN_MARKERS = [
  "styled-components",
  "@sanity/vision",
  "@sanity/ui",
  "sanity/structure",
  "next-sanity/studio",
];

async function loadManifest() {
  try {
    const raw = await readFile(manifestPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `Could not read ${path.relative(repoRoot, manifestPath)}.\n` +
        `Run \`npm run build\` before \`npm run analyze:bundle\`.\n` +
        `Underlying error: ${message}`
    );
    process.exit(2);
  }
}

async function chunkContainsAnyMarker(chunkRelPath) {
  const chunkName = path.basename(chunkRelPath);
  const chunkPath = path.join(chunksDir, chunkName);
  let contents;
  try {
    contents = await readFile(chunkPath, "utf8");
  } catch {
    return [];
  }
  return FORBIDDEN_MARKERS.filter((marker) => contents.includes(marker));
}

function isStudioRoute(routeKey) {
  return routeKey.startsWith(STUDIO_ROUTE_PREFIX);
}

async function main() {
  const manifest = await loadManifest();
  const pages = manifest.pages ?? {};

  const routeEntries = Object.entries(pages).filter(([key]) =>
    key.startsWith("/")
  );

  if (routeEntries.length === 0) {
    console.error(
      "No app routes found in app-build-manifest.json. Is this a Next.js App Router build?"
    );
    process.exit(2);
  }

  const chunkMarkerCache = new Map();
  const leaks = [];
  let routesChecked = 0;
  let studioRoutesSkipped = 0;

  for (const [routeKey, chunkList] of routeEntries) {
    if (isStudioRoute(routeKey)) {
      studioRoutesSkipped += 1;
      continue;
    }
    routesChecked += 1;
    for (const chunkRelPath of chunkList) {
      if (!chunkRelPath.endsWith(".js")) continue;
      let markers = chunkMarkerCache.get(chunkRelPath);
      if (!markers) {
        markers = await chunkContainsAnyMarker(chunkRelPath);
        chunkMarkerCache.set(chunkRelPath, markers);
      }
      if (markers.length > 0) {
        leaks.push({ route: routeKey, chunk: chunkRelPath, markers });
      }
    }
  }

  if (leaks.length > 0) {
    console.error("Sanity Studio bundle leakage detected:\n");
    for (const { route, chunk, markers } of leaks) {
      console.error(`  route=${route}`);
      console.error(`    chunk=${chunk}`);
      console.error(`    markers=${markers.join(", ")}\n`);
    }
    console.error(
      "See docs/bundle-isolation.md for remediation guidance. " +
        "Usually this means a shared module now imports Sanity Studio code."
    );
    process.exit(1);
  }

  console.log(
    `Bundle isolation OK. Checked ${routesChecked} non-Studio routes; ` +
      `skipped ${studioRoutesSkipped} Studio route(s); scanned ${chunkMarkerCache.size} unique chunks.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
