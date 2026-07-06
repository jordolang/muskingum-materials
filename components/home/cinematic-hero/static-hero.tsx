import Link from "next/link";
import Image from "next/image";

/**
 * Static, server-rendered hero shown on mobile and touch devices in place of the
 * scroll-scrubbed cinematic hero.
 *
 * This is the performance-critical path: PageSpeed's mobile audit emulates a
 * throttled phone, where decoding the cinematic hero's ~360 webp frames and
 * running its per-frame animation loops makes a fast LCP impossible. So mobile
 * gets this instead — a single `next/image` poster (the LCP element, preloaded
 * via `priority`) plus real DOM headline and CTAs. No canvas, no `motion`, no
 * `requestAnimationFrame`, no client JS at all.
 *
 * It mirrors Act 1 of the cinematic hero ("MOVE THE EARTH.") in copy and
 * typography so the two experiences read as the same brand. Desktop pointers
 * swap this out for the full cinematic hero (see `HeroSwitch`).
 */
export function StaticHero() {
  return (
    <section className="relative flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-coal">
      {/* LCP element — a single optimized poster frame from the hero footage.
          `priority` emits a preload so it starts fetching before hydration. */}
      <Image
        src="/frames/hero/0060.webp"
        alt="Excavators working the Muskingum Materials quarry pond"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        // The poster sits under heavy coal-toned gradients + a vignette, so a
        // lower quality is visually indistinguishable but meaningfully lighter —
        // shrinking the LCP resource's download time on throttled mobile.
        quality={55}
        className="object-cover"
      />

      {/* Cinematic grade: top-down darkening + vignette so the type reads.
          Pure CSS gradients — no per-frame compositing. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-coal/80 via-coal/30 to-coal"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, transparent 40%, rgba(11,10,9,0.85) 100%)",
        }}
      />

      {/* Headline — same Anton display treatment as Act 1 of the cinematic hero */}
      <div className="relative z-10 max-w-5xl px-6 text-center">
        <p className="mb-5 font-tech text-xs uppercase tracking-[0.5em] text-caution">
          01 — Dug · Crushed · Graded · Delivered
        </p>
        <h1 className="font-display text-[18vw] leading-[0.82] tracking-tight text-bone uppercase sm:text-[15vw]">
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
      </div>
    </section>
  );
}
