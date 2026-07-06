"use client";

import { useEffect } from "react";

/**
 * Desktop-only smooth scrolling.
 *
 * Drives window scroll through Lenis so wheel/keyboard scrolling eases with
 * momentum instead of jumping. Because Lenis updates the *real* scroll position
 * (no transform hack), `position: sticky` and Framer Motion's `useScroll` keep
 * working natively — which means the cinematic hero's frame-scrub follows a
 * smoothed scroll value and feels buttery rather than steppy.
 *
 * Performance: Lenis is only relevant to mouse-wheel scrolling, and its runtime
 * (a per-frame `requestAnimationFrame` loop plus the library itself) is pure
 * overhead on phones — which scroll natively via touch. So we:
 *   1. Bail out entirely unless the device is a desktop with a fine pointer.
 *   2. `import("lenis")` *inside* the effect, so the library is code-split into
 *      a chunk that mobile never downloads.
 *   3. Honor `prefers-reduced-motion` by skipping Lenis altogether.
 */
export function SmoothScroll() {
  useEffect(() => {
    const isDesktopPointer = window.matchMedia(
      "(min-width: 1024px) and (pointer: fine)",
    ).matches;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!isDesktopPointer || prefersReducedMotion) return;

    let rafId = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    // Lazily pull in Lenis so it stays out of the mobile bundle entirely.
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;

      const lenis = new Lenis({
        duration: 1.1,
        // Exponential ease-out — quick to respond, gentle to settle.
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        // Leave touch scrolling native; synced touch tends to feel laggy.
        syncTouch: false,
      });

      const raf = (time: number) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);

      destroy = () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
      };
    });

    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  return null;
}
