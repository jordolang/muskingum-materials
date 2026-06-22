"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CinematicHero } from "../cinematic-hero";

const SEEN_KEY = "mm-intro-seen";
/** Reveal once this fraction of Act 1's frames have decoded (not the whole set). */
const READY_AT = 0.12;
/** Reveal anyway if decoding stalls, so the intro never hangs on black. */
const SAFETY_MS = 4500;

/**
 * Full-screen intro that loads *over top* of the underlying homepage. The
 * scroll-driven cinematic hero plays once per session (sessionStorage); scrolling
 * all the way through it transitions straight into the real site beneath — no
 * click required. Mounted globally in the root layout; it self-gates to the
 * homepage, skips when reduced motion is requested, and locks page scroll while
 * up so its own scroll context drives the scrub.
 *
 * The experience is mounted immediately and is the *single* loader: a branded
 * cover sits on top and lifts the moment the opening frames are decoded, so the
 * first frame is on screen fast and the scrub never streams in from black.
 */
export function CinematicIntroOverlay() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const dismissedRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [leaving, setLeaving] = useState(false);

  const ready = loaded >= READY_AT;

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

  // Safety: lift the loader even if decoding stalls (canvas draws nearest-ready).
  useEffect(() => {
    if (!mounted) return;
    const t = window.setTimeout(
      () => setLoaded((l) => (l < READY_AT ? READY_AT : l)),
      SAFETY_MS,
    );
    return () => window.clearTimeout(t);
  }, [mounted]);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // sessionStorage can throw in private mode; the intro simply replays.
    }
    setLeaving(true); // fade + push forward into the site
    window.setTimeout(() => setMounted(false), 650);
  }

  // Scrolling through to the very end hands off to the real hero automatically.
  function handleScroll() {
    const el = scrollRef.current;
    if (!el || !ready) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) dismiss();
  }

  if (!mounted) return null;

  const loaderPct = Math.min(loaded / READY_AT, 1);

  return (
    <div
      role="dialog"
      aria-label="Muskingum Materials intro"
      className={`fixed inset-0 z-[120] bg-coal transition-[opacity,transform] duration-[650ms] ease-in-out ${
        opaque && !leaving ? "opacity-100" : "opacity-0"
      } ${leaving ? "scale-[1.06]" : "scale-100"}`}
    >
      {/* The experience is always mounted — it doubles as the loader source. */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={`h-full w-full overflow-x-hidden overscroll-contain ${
          ready ? "overflow-y-auto" : "overflow-y-hidden"
        }`}
      >
        <CinematicHero scrollContainerRef={scrollRef} onActOneProgress={setLoaded} />

        {/* Slim closing beat after the CTA act — gives scroll room so reaching the
            bottom hands off to the live site automatically. */}
        <div className="relative z-10 flex h-[55vh] flex-col items-center justify-center bg-coal px-6 text-center">
          <p className="font-tech text-[0.7rem] uppercase tracking-[0.45em] text-grit">
            Muskingum Materials · Southeast Ohio
          </p>
          <p className="mt-6 flex items-center gap-3 font-tech text-[0.65rem] uppercase tracking-[0.4em] text-dust/70">
            <span className="h-px w-8 bg-grit/60" />
            Keep scrolling to enter the site
            <span className="h-px w-8 bg-grit/60" />
          </p>
          <span className="mt-4 animate-bounce text-caution">↓</span>
        </div>
      </div>

      {/* Branded cover — lifts the moment the opening frames are ready */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center bg-coal px-6 text-center transition-opacity duration-700 ${
          ready ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <div className="hazard mb-8 h-3 w-16" />
        <h2 className="font-display text-4xl uppercase leading-[0.9] text-bone sm:text-6xl">
          Muskingum
          <br />
          Materials
        </h2>
        <div className="mt-10 h-px w-56 max-w-[70vw] overflow-hidden bg-iron/60">
          <div
            className="h-full bg-caution transition-[width] duration-200 ease-out"
            style={{ width: `${Math.round(loaderPct * 100)}%` }}
          />
        </div>
        <p className="mt-4 font-tech text-[0.65rem] uppercase tracking-[0.4em] text-grit">
          Loading the yard
        </p>
      </div>

      {/* Always-available skip */}
      <button
        onClick={dismiss}
        className="fixed right-5 top-5 z-[130] border border-iron/70 bg-coal/80 px-4 py-2 font-tech text-[0.65rem] uppercase tracking-[0.3em] text-dust transition-colors hover:border-caution hover:text-caution"
      >
        Skip Intro →
      </button>
    </div>
  );
}
