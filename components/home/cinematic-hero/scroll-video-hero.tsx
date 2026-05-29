"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useScrubFrames } from "./use-scrub-frames";

interface ScrollVideoHeroProps {
  /**
   * Optional scroll container. Omit to track window scroll (the /experience
   * page); pass the overlay's scroll element to drive the scrub from inside it.
   */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Act 1 — a 300vh scroll container pinning a 100vh stage.
 *
 * Scroll drives the loader footage (firefly-1, a decoded image sequence drawn to
 * a canvas) while the camera "pulls back" (background zooms out 1.25 → 1), the
 * headline recedes (scales to 0.9, fades to 0.4) and a spec plate slides in from
 * off-screen left. All motion completes by ~45% of the scroll, leaving a hold
 * phase before the page un-sticks into Act 2.
 */
export function ScrollVideoHero({ scrollContainerRef }: ScrollVideoHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef as React.RefObject<HTMLElement | null> | undefined,
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { canvasRef } = useScrubFrames(scrollYProgress, {
    base: "/frames/firefly-1",
    count: 96,
    completeAt: 0.45,
    ease: 0.1,
  });

  // Camera pull-back + receding headline. Clamped, so they "hold" past 0.45.
  // Only GPU-cheap transforms (scale/opacity) — no animated filters.
  const bgScale = useTransform(scrollYProgress, [0, 0.45], [1.25, 1]);
  const textScale = useTransform(scrollYProgress, [0, 0.45], [1, 0.9]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0.4]);

  // Foreground spec plate slides in from the left.
  const plateX = useTransform(scrollYProgress, [0.05, 0.45], ["-115%", "0%"]);
  const plateOpacity = useTransform(scrollYProgress, [0.05, 0.18], [0, 1]);

  // Grade deepens as we settle; scroll cue fades immediately.
  const gradeOpacity = useTransform(scrollYProgress, [0, 0.45], [0.5, 0.82]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-coal">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Equipment backdrop — scrubbed loader footage drawn to canvas */}
        <motion.div style={{ scale: bgScale }} className="absolute inset-0">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </motion.div>

        {/* Cinematic grade: top-down darkening + vignette */}
        <motion.div
          aria-hidden
          style={{ opacity: gradeOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-coal/80 via-coal/20 to-coal"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 38%, transparent 40%, rgba(11,10,9,0.85) 100%)",
          }}
        />

        {/* Receding headline */}
        <motion.div
          style={{ scale: textScale, opacity: textOpacity }}
          className="relative z-10 max-w-5xl px-6 text-center will-change-transform"
        >
          <p className="mb-5 font-tech text-xs uppercase tracking-[0.5em] text-caution">
            Crushed · Graded · Delivered
          </p>
          <h1 className="font-display text-[18vw] leading-[0.82] tracking-tight text-bone uppercase sm:text-[15vw] lg:text-[11rem]">
            Move the
            <br />
            <span className="text-caution">Earth.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-dust/85 sm:text-lg">
            Limestone, gravel, sand and stone — staged on the yard, weighed on the
            scale, and on your jobsite by the ton.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/order"
              className="group relative overflow-hidden bg-caution px-8 py-4 font-tech text-xs font-bold uppercase tracking-[0.25em] text-coal transition-transform hover:scale-[1.02]"
            >
              <span className="relative z-10">Request a Load</span>
              <span className="absolute inset-0 -translate-x-full bg-ember transition-transform duration-300 group-hover:translate-x-0" />
            </Link>
            <Link
              href="/products"
              className="border border-iron px-8 py-4 font-tech text-xs font-bold uppercase tracking-[0.25em] text-dust transition-colors hover:border-caution hover:text-caution"
            >
              Browse Aggregate
            </Link>
          </div>
        </motion.div>

        {/* Foreground spec plate — slides in from off-screen left */}
        <motion.div
          style={{ x: plateX, opacity: plateOpacity }}
          className="absolute bottom-8 left-0 z-10 will-change-transform sm:bottom-12"
        >
          <div className="flex items-stretch border-y border-r border-iron/70 bg-coal/90">
            <div className="hazard w-2" />
            <div className="grid grid-cols-3 divide-x divide-iron/60">
              {[
                { k: "Payload", v: "40T", s: "per haul" },
                { k: "Fleet", v: "12", s: "trucks" },
                { k: "Radius", v: "75mi", s: "delivery" },
              ].map((stat) => (
                <div key={stat.k} className="px-6 py-4 sm:px-8 sm:py-5">
                  <p className="font-tech text-[0.6rem] uppercase tracking-[0.3em] text-grit">
                    {stat.k}
                  </p>
                  <p className="font-display text-3xl leading-none text-bone sm:text-4xl">
                    {stat.v}
                  </p>
                  <p className="mt-1 font-tech text-[0.6rem] uppercase tracking-[0.25em] text-caution/80">
                    {stat.s}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          style={{ opacity: cueOpacity }}
          className="absolute bottom-7 right-6 z-10 flex flex-col items-center gap-2 sm:right-10"
        >
          <span className="font-tech text-[0.6rem] uppercase tracking-[0.4em] text-dust/70 [writing-mode:vertical-rl]">
            Scroll
          </span>
          <div className="h-12 w-px bg-gradient-to-b from-caution to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
