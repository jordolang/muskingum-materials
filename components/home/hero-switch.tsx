"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Lazy, client-only import of the cinematic hero. Because this dynamic() is only
// *rendered* on desktop pointers (see below), its chunk — which pulls in
// `motion` and the frame-scrub machinery — is never downloaded on mobile. This
// is the whole point: the heavy hero stays entirely off the mobile critical path.
const CinematicHero = dynamic(
  () => import("./cinematic-hero").then((m) => m.CinematicHero),
  { ssr: false },
);

interface HeroSwitchProps {
  /**
   * The server-rendered static hero. Passed as a node (not imported here) so it
   * ships in the initial HTML and paints immediately — giving mobile a fast LCP
   * and acting as the no-JS / pre-hydration fallback everywhere.
   */
  staticHero: React.ReactNode;
}

/**
 * Chooses which hero to render at runtime:
 *   - Mobile / touch / small screens → the static hero (fast, no JS).
 *   - Desktop with a fine pointer     → the full cinematic scroll experience.
 *
 * The static hero is the SSR default, so the server HTML and first client paint
 * are always the lightweight version. Only after mount, and only on a desktop
 * pointer, do we swap in the cinematic hero (and trigger its code-split load).
 */
export function HeroSwitch({ staticHero }: HeroSwitchProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Require both a wide viewport and a fine (mouse) pointer. This keeps the
    // cinematic hero off large touch tablets, where the scrub still janks.
    const mq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isDesktop ? <CinematicHero /> : <>{staticHero}</>;
}
