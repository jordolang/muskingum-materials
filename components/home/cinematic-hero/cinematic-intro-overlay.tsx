"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const SEEN_KEY = "mm-intro-seen";
const INTRO_SRC = "/images/videos/firefly-1.mp4";
const POSTER = "/frames/firefly-1/0001.webp";
/** Slight speed-up keeps the firefly footage smooth but snappier (~6.5s). */
const PLAYBACK_RATE = 1.2;
/** Hard safety: dismiss even if the video never fires `ended` (e.g. blocked). */
const SAFETY_MS = 10_000;
/** Once the footage is clearly rolling, fade the wordmark so it stays in view. */
const WORDMARK_FADE_MS = 2_200;

/**
 * Full-screen intro that loads *over top* of the underlying homepage. Plays the
 * firefly loader footage once per session (sessionStorage) as a smooth,
 * self-advancing clip — no scroll required — then fades to reveal the site.
 *
 * Native `<video>` playback (rather than scroll-scrubbed frames) keeps the
 * motion buttery at the source 24fps, and the overlay stays light so the footage
 * is actually visible instead of being buried under a black grade. Mounted
 * globally in the root layout; it self-gates to the homepage, honours reduced
 * motion, and locks page scroll while up.
 */
export function CinematicIntroOverlay() {
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [wordmarkOut, setWordmarkOut] = useState(false);

  // Decide once on the client: homepage only, once per session, motion allowed.
  useEffect(() => {
    if (pathname !== "/") return;
    const seen = sessionStorage.getItem(SEEN_KEY);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) return;
    setMounted(true);
  }, [pathname]);

  // Fade in, lock the underlying page scroll, and arm a safety auto-dismiss.
  useEffect(() => {
    if (!mounted) return;
    const raf = requestAnimationFrame(() => setOpaque(true));
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const safety = window.setTimeout(dismiss, SAFETY_MS);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Kick off playback as soon as we're mounted (muted autoplay is allowed).
  useEffect(() => {
    if (!mounted) return;
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = PLAYBACK_RATE;
    v.play().catch(() => {
      // Autoplay blocked — the poster holds and the Skip button still works.
    });
  }, [mounted]);

  // Once the footage is clearly rolling, fade the wordmark out of the way.
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setWordmarkOut(true), WORDMARK_FADE_MS);
    return () => window.clearTimeout(t);
  }, [playing]);

  function dismiss() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // sessionStorage can throw in private mode; the intro simply replays.
    }
    setOpaque(false);
    window.setTimeout(() => setMounted(false), 650);
  }

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-label="Muskingum Materials intro"
      className={`fixed inset-0 z-[120] bg-coal transition-opacity duration-700 ${
        opaque ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Smooth, self-advancing loader footage — native 24fps, fully visible. */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={INTRO_SRC}
        poster={POSTER}
        muted
        playsInline
        autoPlay
        preload="auto"
        onPlaying={() => setPlaying(true)}
        onEnded={dismiss}
      />

      {/* Light vignette only — edges settle into the page, centre stays clear. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 95% at 50% 45%, transparent 58%, rgba(11,10,9,0.55) 100%)",
        }}
      />

      {/* Branded wordmark, lower third — fades back once the footage is rolling. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-[12%] flex flex-col items-center px-6 text-center transition-opacity duration-1000 ${
          wordmarkOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="mb-3 font-tech text-[0.65rem] uppercase tracking-[0.5em] text-caution">
          Crushed · Graded · Delivered
        </p>
        <h2 className="font-display text-4xl uppercase leading-[0.9] text-bone drop-shadow-[0_2px_18px_rgba(0,0,0,0.65)] sm:text-6xl">
          Muskingum
          <br />
          Materials
        </h2>
      </div>

      {/* Branded loader — only until the first frames are actually playing. */}
      {!playing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-coal/70 px-6 text-center">
          <div className="hazard mb-7 h-3 w-16" />
          <h2 className="font-display text-3xl uppercase leading-[0.9] text-bone sm:text-5xl">
            Muskingum
            <br />
            Materials
          </h2>
          <p className="mt-7 font-tech text-[0.65rem] uppercase tracking-[0.4em] text-grit">
            <span className="animate-pulse">Loading the yard…</span>
          </p>
        </div>
      )}

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
