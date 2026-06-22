"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useScrubFrames } from "./use-scrub-frames";

interface FeatureSectionProps {
  /** Optional scroll container (see ScrollVideoHero). Omit for window scroll. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Act 2 — the processing beat.
 *
 * A 260vh container pins a 100vh stage over the "process" footage (a Higgsfield
 * clip seeded from the company's real screening plant cascading gravel onto a
 * stockpile). The footage plays full-bleed and scrubbed — same treatment as the
 * hero — while a big Anton slogan ("CRUSHED ON SITE.") grades in, then a short
 * caption rises during the hold. Mirrors the hero's typographic style.
 */
export function FeatureSection({ scrollContainerRef }: FeatureSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef as React.RefObject<HTMLElement | null> | undefined,
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { canvasRef } = useScrubFrames(scrollYProgress, {
    base: "/frames/process",
    count: 121,
    completeAt: 0.7,
    ease: 0.18,
  });

  // Slow camera settle on the footage; slogan grades in; caption rises on hold.
  const bgScale = useTransform(scrollYProgress, [0, 0.7], [1.18, 1]);
  const eyebrowOpacity = useTransform(scrollYProgress, [0.05, 0.22], [0, 1]);
  const headlineOpacity = useTransform(scrollYProgress, [0.07, 0.42], [0, 1]);
  const headlineY = useTransform(scrollYProgress, [0.07, 0.42], [48, 0]);
  const capOpacity = useTransform(scrollYProgress, [0.52, 0.82], [0, 1]);
  const capY = useTransform(scrollYProgress, [0.52, 0.82], [28, 0]);
  const gradeOpacity = useTransform(scrollYProgress, [0, 0.7], [0.5, 0.8]);

  return (
    <section ref={containerRef} className="relative h-[250vh] bg-coal">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        {/* Processing footage — scrubbed full-bleed backdrop */}
        <motion.div style={{ scale: bgScale }} className="absolute inset-0">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </motion.div>

        {/* Cinematic grade: top-down darkening + vignette so the type reads */}
        <motion.div
          aria-hidden
          style={{ opacity: gradeOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-coal/80 via-coal/30 to-coal"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 45%, transparent 40%, rgba(11,10,9,0.88) 100%)",
          }}
        />

        {/* Slogan — same Anton display treatment as the hero */}
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="relative z-10 max-w-5xl px-6 text-center will-change-transform"
        >
          <motion.p
            style={{ opacity: eyebrowOpacity }}
            className="mb-5 font-tech text-xs uppercase tracking-[0.5em] text-caution"
          >
            02 — Straight from the Pile
          </motion.p>
          <h2 className="font-display text-[18vw] leading-[0.82] tracking-tight text-bone uppercase sm:text-[15vw] lg:text-[11rem]">
            Crushed
            <br />
            <span className="text-caution">On Site.</span>
          </h2>
        </motion.div>

        {/* Caption rises during the hold */}
        <motion.div
          style={{ opacity: capOpacity, y: capY }}
          className="absolute bottom-[12vh] z-10 max-w-md px-6 text-center"
        >
          <div className="mx-auto mb-4 h-px w-24 bg-caution" />
          <p className="text-balance text-base text-dust/85 sm:text-lg">
            No middlemen, no markup. We dig it, crush it, and grade it on-site —
            then load it straight onto the truck.
          </p>
          <p className="mt-4 font-tech text-[0.7rem] uppercase tracking-[0.35em] text-grit">
            #57 · #8 · Sand · Riprap · Base
          </p>
        </motion.div>
      </div>
    </section>
  );
}
