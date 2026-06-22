"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useScrubFrames } from "./use-scrub-frames";
import { BUSINESS_INFO } from "@/data/business";

interface CtaSectionProps {
  /** Optional scroll container (see ScrollVideoHero). Omit for window scroll. */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * Act 3 — the call to action.
 *
 * A 220vh container pins a 100vh stage over the "deliver" footage (a Higgsfield
 * clip seeded from the company's real yard at golden hour — wheel loader,
 * screening plant, stockpiles). Scroll drives a slow settle: the headline rises
 * and grades in, then the two CTAs (request a load / call the yard) follow. As
 * the final act, scrolling past it is what hands the homepage intro overlay off
 * to the live site.
 */
export function CtaSection({ scrollContainerRef }: CtaSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    container: scrollContainerRef as React.RefObject<HTMLElement | null> | undefined,
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const { canvasRef } = useScrubFrames(scrollYProgress, {
    base: "/frames/deliver",
    count: 121,
    completeAt: 0.7,
    ease: 0.18,
  });

  // Headline rises + grades in; CTAs follow a beat later; grade deepens on settle.
  const eyebrowOpacity = useTransform(scrollYProgress, [0.05, 0.22], [0, 1]);
  const headlineOpacity = useTransform(scrollYProgress, [0.07, 0.42], [0, 1]);
  const headlineY = useTransform(scrollYProgress, [0.07, 0.42], [40, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.42, 0.62], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.42, 0.62], [24, 0]);
  const gradeOpacity = useTransform(scrollYProgress, [0, 0.7], [0.55, 0.82]);

  const phone = BUSINESS_INFO.phone;

  return (
    <section ref={containerRef} className="relative h-[250vh] bg-coal">
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden">
        {/* Golden-hour yard footage drawn to canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />

        {/* Cinematic grade: top-down darkening + vignette */}
        <motion.div
          aria-hidden
          style={{ opacity: gradeOpacity }}
          className="absolute inset-0 bg-gradient-to-b from-coal/85 via-coal/40 to-coal"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 45%, transparent 38%, rgba(11,10,9,0.9) 100%)",
          }}
        />

        {/* Headline */}
        <motion.div
          style={{ opacity: headlineOpacity, y: headlineY }}
          className="relative z-10 max-w-5xl px-6 text-center will-change-transform"
        >
          <motion.p
            style={{ opacity: eyebrowOpacity }}
            className="mb-5 font-tech text-xs uppercase tracking-[0.5em] text-caution"
          >
            03 — Ready When You Are
          </motion.p>
          <h2 className="font-display text-[20vw] leading-[0.82] tracking-tight text-bone uppercase sm:text-[16vw] lg:text-[12rem]">
            Load <span className="text-caution">Up.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-dust/85 sm:text-lg">
            Sand, gravel, limestone and stone — weighed on certified scales and on
            your jobsite by the ton. Call the yard or request a load online.
          </p>
        </motion.div>

        {/* CTAs follow a beat later */}
        <motion.div
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="relative z-10 mt-9 flex flex-col items-center justify-center gap-4 will-change-transform sm:flex-row"
        >
          <Link
            href="/order"
            className="group relative overflow-hidden bg-caution px-8 py-4 font-tech text-xs font-bold uppercase tracking-[0.25em] text-coal transition-transform hover:scale-[1.02]"
          >
            <span className="relative z-10">Request a Load</span>
            <span className="absolute inset-0 -translate-x-full bg-ember transition-transform duration-300 group-hover:translate-x-0" />
          </Link>
          <a
            href={`tel:${phone.replace(/\D/g, "")}`}
            className="border border-iron px-8 py-4 font-tech text-xs font-bold uppercase tracking-[0.25em] text-dust transition-colors hover:border-caution hover:text-caution"
          >
            Call {phone}
          </a>
        </motion.div>
      </div>
    </section>
  );
}
