"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * Hero background images, rotated in order. The first one is the LCP element —
 * it ships in the server HTML with `priority`; the rest are only mounted after
 * hydration so they don't compete with it for bandwidth on the first paint.
 */
const HERO_IMAGES = [
  {
    src: "/images/hero/muskingum-materials-hero-1.png",
    alt: "Aerial view of the Muskingum Materials yard in Zanesville, Ohio",
  },
  {
    src: "/images/hero/muskingum-materials-hero-2.png",
    alt: "Aggregate stockpiles staged on the Muskingum Materials yard",
  },
  {
    src: "/images/hero/muskingum-materials-hero-3.png",
    alt: "Loader working a stockpile at Muskingum Materials",
  },
  {
    src: "/images/hero/muskingum-materials-hero-4.png",
    alt: "Crushed limestone and gravel processing at Muskingum Materials",
  },
  {
    src: "/images/hero/muskingum-materials-hero-5.png",
    alt: "Dump truck loading aggregate at the Muskingum Materials scale",
  },
];

/** Full loop is 30s across all five images. */
const CYCLE_MS = 30_000;
const SLIDE_MS = CYCLE_MS / HERO_IMAGES.length;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  // Gates the non-LCP images: they stay out of the DOM until after hydration.
  const [mountRest, setMountRest] = useState(false);

  useEffect(() => {
    // Contractors on a phone in the truck get the poster instantly; the other
    // four slides load once the browser is idle. Safari lacks
    // requestIdleCallback, so fall back to a timer there.
    const reveal = () => setMountRest(true);

    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(reveal);
      return () => window.cancelIdleCallback(handle);
    }

    const handle = window.setTimeout(reveal, 1200);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!mountRest) return;
    // Respect reduced-motion: hold on the first frame instead of cross-fading.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setIndex((i) => (i + 1) % HERO_IMAGES.length),
      SLIDE_MS,
    );
    return () => window.clearInterval(timer);
  }, [mountRest]);

  return (
    <div className="absolute inset-0">
      {HERO_IMAGES.map((image, i) => {
        // Slide 0 is server-rendered; the rest wait for the idle callback.
        if (i > 0 && !mountRest) return null;
        return (
          <Image
            key={image.src}
            // Only the first slide is described. The rotating ones are
            // decorative — announcing a new yard photo every six seconds would
            // just interrupt a screen reader mid-sentence.
            alt={i === 0 ? image.alt : ""}
            src={image.src}
            fill
            sizes="100vw"
            quality={62}
            priority={i === 0}
            fetchPriority={i === 0 ? "high" : "auto"}
            className={`object-cover transition-opacity duration-[1500ms] ease-in-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        );
      })}
    </div>
  );
}
