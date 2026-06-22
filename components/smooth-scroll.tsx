"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide smooth scrolling.
 *
 * Drives window scroll through Lenis so wheel/keyboard scrolling eases with
 * momentum instead of jumping. Because Lenis updates the *real* scroll position
 * (no transform hack), `position: sticky` and Framer Motion's `useScroll` keep
 * working natively — which means the cinematic hero's frame-scrub now follows a
 * smoothed scroll value and feels buttery rather than steppy.
 *
 * Honors `prefers-reduced-motion`: when set, Lenis is skipped entirely and the
 * browser's native scrolling (with the CSS `scroll-behavior` fallback) is used.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      // Exponential ease-out — quick to respond, gentle to settle.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Leave touch scrolling native; synced touch tends to feel laggy on phones.
      syncTouch: false,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
