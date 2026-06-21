"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { useScrubFrames } from "./use-scrub-frames";

interface RockDumpSectionProps {
  /** Optional scroll container (see ScrollVideoHero). Omit for window scroll. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Act 2 — the rock dump.
 *
 * A 260vh container pins a 100vh stage. A full-bleed coal layer covers the dump
 * footage (firefly-2, a canvas image sequence) everywhere *except* the letters
 * of AGGREGATE, which are knocked out of it via an SVG mask — so scrolling pours
 * tumbling aggregate into the type. The word swells and lifts as it fills, and a
 * caption rises during the hold.
 */
export function RockDumpSection({ scrollContainerRef }: RockDumpSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef as React.RefObject<HTMLElement | null> | undefined,
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { canvasRef } = useScrubFrames(scrollYProgress, {
    base: "/frames/firefly-2",
    count: 192,
    completeAt: 0.55,
    ease: 0.12,
  });

  // The word swells + lifts as it fills — a pile settling. Applied to the text
  // only (transform-box: fill-box), so the full-bleed cover never shifts.
  const wordScale = useTransform(scrollYProgress, [0, 0.55], [0.92, 1.06]);
  const wordY = useTransform(scrollYProgress, [0, 0.55], [24, -8]);

  // Supporting copy rises during the hold.
  const capOpacity = useTransform(scrollYProgress, [0.5, 0.72], [0, 1]);
  const capY = useTransform(scrollYProgress, [0.5, 0.72], [28, 0]);
  const eyebrowOpacity = useTransform(scrollYProgress, [0.04, 0.18], [0, 1]);

  return (
    <section ref={containerRef} className="relative h-[260vh] bg-coal">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        {/* Hidden full-frame dump footage — only revealed through the letter mask */}
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

        {/* Eyebrow */}
        <motion.p
          style={{ opacity: eyebrowOpacity }}
          className="absolute top-[15vh] z-20 font-tech text-xs uppercase tracking-[0.5em] text-caution"
        >
          02 — Straight from the Pile
        </motion.p>

        {/*
          Full-bleed coal cover with the word knocked out. mask: white = painted
          (coal), black = hole — so the dump footage shows only inside AGGREGATE.
        */}
        <svg aria-label="Aggregate" className="absolute inset-0 z-10 h-full w-full">
          <defs>
            <mask id="rock-knockout">
              <rect width="100%" height="100%" fill="white" />
              <motion.text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                fill="black"
                style={{
                  fontFamily: "var(--font-anton), sans-serif",
                  fontSize: "clamp(3rem, 15.5vw, 17rem)",
                  letterSpacing: "-0.02em",
                  scale: wordScale,
                  y: wordY,
                  transformBox: "fill-box",
                  transformOrigin: "center",
                }}
              >
                AGGREGATE
              </motion.text>
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="#0b0a09" mask="url(#rock-knockout)" />
        </svg>

        {/* Vignette to seat the type in the dark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 50%, transparent 42%, rgba(11,10,9,0.92) 100%)",
          }}
        />

        {/* Caption rises during the hold */}
        <motion.div
          style={{ opacity: capOpacity, y: capY }}
          className="absolute bottom-[13vh] z-20 max-w-md px-6 text-center"
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
