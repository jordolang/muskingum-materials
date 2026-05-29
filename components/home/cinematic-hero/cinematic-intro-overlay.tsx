"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CinematicHero } from "../cinematic-hero";

const SEEN_KEY = "mm-intro-seen";

/**
 * Full-screen intro that loads *over top* of the underlying homepage. Plays the
 * cinematic hero once per session (sessionStorage), then dismisses to reveal the
 * real site beneath. Mounted globally in the root layout; it self-gates to the
 * homepage, skips when reduced motion is requested, and locks page scroll while
 * up so its own scroll context drives the scrub.
 */
export function CinematicIntroOverlay() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [opaque, setOpaque] = useState(false);

  // Decide once on the client: homepage only, once per session, motion allowed.
  useEffect(() => {
    if (pathname !== "/") return;
    const seen = sessionStorage.getItem(SEEN_KEY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) return;
    setMounted(true);
  }, [pathname]);

  // Fade in once mounted; lock the underlying page scroll while up.
  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => setOpaque(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  function dismiss() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // sessionStorage can throw in private mode; the intro simply replays.
    }
    setOpaque(false);
    window.setTimeout(() => setMounted(false), 550);
  }

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-label="Muskingum Materials intro"
      className={`fixed inset-0 z-[120] bg-coal transition-opacity duration-500 ${
        opaque ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Own scroll context — this is what drives the scrubbed animation. */}
      <div
        ref={scrollRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden overscroll-contain"
      >
        <CinematicHero scrollContainerRef={scrollRef} />

        {/* Closing panel after the experience */}
        <div className="relative z-10 flex h-[70vh] flex-col items-center justify-center bg-coal px-6 text-center">
          <p className="font-tech text-xs uppercase tracking-[0.5em] text-caution">
            Welcome to the yard
          </p>
          <h2 className="mt-4 font-display text-5xl uppercase leading-[0.9] text-bone sm:text-7xl">
            Muskingum
            <br />
            Materials
          </h2>
          <button
            onClick={dismiss}
            className="mt-9 bg-caution px-10 py-4 font-tech text-xs font-bold uppercase tracking-[0.25em] text-coal transition-transform hover:scale-[1.03]"
          >
            Enter Site →
          </button>
        </div>
      </div>

      {/* Always-available skip */}
      <button
        onClick={dismiss}
        className="fixed right-5 top-5 z-[130] border border-iron/70 bg-coal/70 px-4 py-2 font-tech text-[0.65rem] uppercase tracking-[0.3em] text-dust backdrop-blur-sm transition-colors hover:border-caution hover:text-caution"
      >
        Skip Intro →
      </button>
    </div>
  );
}
