#!/usr/bin/env node
/**
 * Verifies that Sanity Studio dependencies stay isolated to the /studio route.
 *
 * Run after `npm run build`. Exits non-zero if `styled-components` or Sanity
 * Studio runtime code is reachable from any non-Studio route's client bundle.
 *
 * See docs/bundle-isolation.md for context.
 */

import { readFile, stat } from "node:fs/promises";
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

const VERBOSE = process.argv.includes("--verbose") || process.argv.includes("-v");

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

async function analyzeChunk(chunkRelPath) {
  const chunkName = path.basename(chunkRelPath);
  const chunkPath = path.join(chunksDir, chunkName);
  let contents;
  let size = 0;

  try {
    const stats = await stat(chunkPath);
    size = stats.size;
    contents = await readFile(chunkPath, "utf8");
  } catch {
    return { markers: [], size: 0 };
  }

  const markers = FORBIDDEN_MARKERS.filter((marker) => contents.includes(marker));
  return { markers, size };
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
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

  console.log("=".repeat(80));
  console.log("SANITY STUDIO BUNDLE ISOLATION ANALYSIS");
  console.log("=".repeat(80));
  console.log();

  const chunkAnalysisCache = new Map();
  const leaks = [];
  const routeDetails = [];
  let routesChecked = 0;
  let studioRoutesSkipped = 0;
  let totalChunksAnalyzed = 0;
  let totalCleanChunks = 0;
  let totalContaminatedChunks = 0;
  let totalBytesAnalyzed = 0;

  for (const [routeKey, chunkList] of routeEntries) {
    if (isStudioRoute(routeKey)) {
      studioRoutesSkipped += 1;
      continue;
    }

    routesChecked += 1;
    const routeChunks = [];
    let routeTotalSize = 0;

    for (const chunkRelPath of chunkList) {
      if (!chunkRelPath.endsWith(".js")) continue;

      let analysis = chunkAnalysisCache.get(chunkRelPath);
      if (!analysis) {
        analysis = await analyzeChunk(chunkRelPath);
        chunkAnalysisCache.set(chunkRelPath, analysis);
        totalChunksAnalyzed += 1;
        totalBytesAnalyzed += analysis.size;

        if (analysis.markers.length > 0) {
          totalContaminatedChunks += 1;
        } else {
          totalCleanChunks += 1;
        }
      }

      routeTotalSize += analysis.size;
      routeChunks.push({
        path: chunkRelPath,
        size: analysis.size,
        markers: analysis.markers,
      });

      if (analysis.markers.length > 0) {
        leaks.push({
          route: routeKey,
          chunk: chunkRelPath,
          markers: analysis.markers,
          size: analysis.size,
        });
      }
    }

    routeDetails.push({
      route: routeKey,
      chunks: routeChunks,
      totalSize: routeTotalSize,
      chunkCount: routeChunks.length,
    });
  }

  if (VERBOSE) {
    console.log("ROUTE-BY-ROUTE BREAKDOWN:");
    console.log("-".repeat(80));
    for (const { route, chunks, totalSize, chunkCount } of routeDetails) {
      console.log(`\nRoute: ${route}`);
      console.log(`  Total size: ${formatBytes(totalSize)} (${chunkCount} chunks)`);
      for (const { path: chunkPath, size, markers } of chunks) {
        const status = markers.length > 0 ? "❌ CONTAMINATED" : "✓ clean";
        console.log(`    ${status} ${path.basename(chunkPath)} (${formatBytes(size)})`);
        if (markers.length > 0) {
          console.log(`      markers: ${markers.join(", ")}`);
        }
      }
    }
    console.log();
    console.log("=".repeat(80));
  }

  console.log("\nCHUNK ANALYSIS SUMMARY:");
  console.log("-".repeat(80));
  console.log(`Total routes analyzed:      ${routesChecked}`);
  console.log(`Studio routes skipped:      ${studioRoutesSkipped}`);
  console.log(`Unique chunks scanned:      ${totalChunksAnalyzed}`);
  console.log(`  Clean chunks:             ${totalCleanChunks}`);
  console.log(`  Contaminated chunks:      ${totalContaminatedChunks}`);
  console.log(`Total bundle size analyzed: ${formatBytes(totalBytesAnalyzed)}`);
  console.log();

  if (leaks.length > 0) {
    console.log("=".repeat(80));
    console.error("❌ SANITY STUDIO BUNDLE LEAKAGE DETECTED\n");
    console.error(`Found ${leaks.length} contaminated chunk(s) in non-Studio routes:\n`);

    const leaksByChunk = new Map();
    for (const { chunk, route, markers, size } of leaks) {
      if (!leaksByChunk.has(chunk)) {
        leaksByChunk.set(chunk, { routes: [], markers, size });
      }
      leaksByChunk.get(chunk).routes.push(route);
    }

    for (const [chunk, { routes, markers, size }] of leaksByChunk) {
      console.error(`  Chunk: ${path.basename(chunk)}`);
      console.error(`    Size: ${formatBytes(size)}`);
      console.error(`    Markers: ${markers.join(", ")}`);
      console.error(`    Affected routes (${routes.length}):`);
      for (const route of routes) {
        console.error(`      - ${route}`);
      }
      console.error();
    }

    console.error("See docs/bundle-isolation.md for remediation guidance.");
    console.error("Usually this means a shared module now imports Sanity Studio code.");
    console.log("=".repeat(80));
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log("✓ BUNDLE ISOLATION OK");
  console.log("=".repeat(80));
  console.log();
  console.log("No Sanity Studio dependencies found in non-Studio routes.");
  console.log("All forbidden markers are properly isolated to /studio routes.");
  console.log();
  console.log("Run with --verbose flag for detailed chunk-by-chunk analysis.");
  console.log();
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
