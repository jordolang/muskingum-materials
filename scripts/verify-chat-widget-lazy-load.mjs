#!/usr/bin/env node
/**
 * Verifies that ChatWidget is properly lazy-loaded using next/dynamic.
 *
 * This script analyzes the source code to confirm:
 * 1. ChatWidgetLoader uses next/dynamic for importing ChatWidget
 * 2. The dynamic import has ssr: false configured
 * 3. layout.tsx imports ChatWidgetLoader, not ChatWidget directly
 *
 * Run this instead of bundle analysis when full build is not available.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();

async function readSourceFile(filePath) {
  try {
    return await readFile(path.join(repoRoot, filePath), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not read ${filePath}: ${message}`);
  }
}

async function verifyChatWidgetLoader() {
  console.log("=".repeat(60));
  console.log("ChatWidget Lazy Loading Verification (Source Code Analysis)");
  console.log("=".repeat(60));
  console.log();

  const checks = [];

  // Check 1: ChatWidgetLoader uses next/dynamic
  console.log("✓ Checking ChatWidgetLoader implementation...");
  const loaderContent = await readSourceFile(
    "components/chat/chat-widget-loader.tsx"
  );

  const hasNextDynamic = loaderContent.includes('from "next/dynamic"');
  const hasDynamicImport = loaderContent.includes("dynamic(");
  const hasSsrFalse = loaderContent.includes("ssr: false");
  const hasInteractionLoading =
    loaderContent.includes("isLoaded") && loaderContent.includes("handleClick");

  checks.push({
    name: "Uses next/dynamic import",
    passed: hasNextDynamic && hasDynamicImport,
    details: hasNextDynamic && hasDynamicImport
      ? "✓ next/dynamic import detected"
      : "✗ next/dynamic import not found",
  });

  checks.push({
    name: "Disables SSR (ssr: false)",
    passed: hasSsrFalse,
    details: hasSsrFalse
      ? "✓ ssr: false configuration found"
      : "✗ ssr: false not configured",
  });

  checks.push({
    name: "Implements interaction-triggered loading",
    passed: hasInteractionLoading,
    details: hasInteractionLoading
      ? "✓ Interaction-based loading detected (isLoaded state + handleClick)"
      : "✗ Interaction-based loading not found",
  });

  // Check 2: layout.tsx imports ChatWidgetLoader, not ChatWidget
  console.log("✓ Checking layout.tsx imports...");
  const layoutContent = await readSourceFile("app/layout.tsx");

  const hasChatWidgetLoaderImport = layoutContent.includes(
    'from "@/components/chat/chat-widget-loader"'
  );
  const hasChatWidgetLoaderUsage = layoutContent.includes("<ChatWidgetLoader");
  const hasDirectChatWidgetImport = layoutContent.includes(
    'from "@/components/chat/chat-widget"'
  );
  const hasDirectChatWidgetUsage =
    layoutContent.includes("<ChatWidget") &&
    !layoutContent.includes("<ChatWidgetLoader");

  checks.push({
    name: "layout.tsx imports ChatWidgetLoader",
    passed: hasChatWidgetLoaderImport,
    details: hasChatWidgetLoaderImport
      ? "✓ ChatWidgetLoader import found in layout.tsx"
      : "✗ ChatWidgetLoader import not found in layout.tsx",
  });

  checks.push({
    name: "layout.tsx uses <ChatWidgetLoader />",
    passed: hasChatWidgetLoaderUsage,
    details: hasChatWidgetLoaderUsage
      ? "✓ <ChatWidgetLoader /> usage found"
      : "✗ <ChatWidgetLoader /> not used",
  });

  checks.push({
    name: "layout.tsx does NOT import ChatWidget directly",
    passed: !hasDirectChatWidgetImport,
    details: !hasDirectChatWidgetImport
      ? "✓ No direct ChatWidget import found"
      : "✗ Direct ChatWidget import detected (should use ChatWidgetLoader)",
  });

  checks.push({
    name: "layout.tsx does NOT use <ChatWidget /> directly",
    passed: !hasDirectChatWidgetUsage,
    details: !hasDirectChatWidgetUsage
      ? "✓ No direct <ChatWidget /> usage found"
      : "✗ Direct <ChatWidget /> usage detected (should use <ChatWidgetLoader />)",
  });

  // Print results
  console.log();
  console.log("Verification Results:");
  console.log("-".repeat(60));

  let allPassed = true;
  for (const check of checks) {
    const status = check.passed ? "✓ PASS" : "✗ FAIL";
    console.log(`${status} - ${check.name}`);
    console.log(`         ${check.details}`);
    if (!check.passed) {
      allPassed = false;
    }
  }

  console.log("-".repeat(60));
  console.log();

  if (allPassed) {
    console.log("✓ ALL CHECKS PASSED");
    console.log();
    console.log("Conclusion:");
    console.log("  ChatWidget is properly configured for lazy loading.");
    console.log("  The component will be code-split into a separate chunk");
    console.log("  and only loaded when the user interacts with the chat button.");
    console.log();
    console.log("Expected Bundle Behavior:");
    console.log("  - Initial page load: ChatWidget NOT in main bundle");
    console.log("  - User clicks chat button: ChatWidget chunk downloads");
    console.log("  - Bundle size: Reduced by ~225 lines + dependencies");
    console.log();
    console.log("Note: This is a source code verification. For actual bundle");
    console.log("      analysis, run: npm run build && npm run analyze:bundle");
    console.log("      (requires network access for font downloads)");
    return 0;
  } else {
    console.log("✗ SOME CHECKS FAILED");
    console.log();
    console.log("Issues detected. Please review the implementation.");
    return 1;
  }
}

verifyChatWidgetLoader().then(
  (code) => process.exit(code),
  (error) => {
    console.error("Error during verification:");
    console.error(error);
    process.exit(2);
  }
);
