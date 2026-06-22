import { ScrollVideoHero } from "./cinematic-hero/scroll-video-hero";
import { FeatureSection } from "./cinematic-hero/feature-section";
import { CtaSection } from "./cinematic-hero/cta-section";

interface CinematicHeroProps {
  /**
   * Scroll container that drives the scrubbed animation. Omit to track window
   * scroll (standalone /experience page); pass the intro overlay's scroll
   * element when rendered as an overlay over the site.
   */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Act 1 frame-decode progress (0..1), forwarded for the intro loader. */
  onActOneProgress?: (loaded: number) => void;
}

/**
 * The cinematic, scroll-driven hero in three acts:
 *   Act 1 — camera pull-back over the quarry ("MOVE THE EARTH.")
 *   Act 2 — slogan over the processing footage ("CRUSHED ON SITE.")
 *   Act 3 — the call to action over the golden-hour yard ("LOAD UP.")
 * All three scrub Higgsfield footage seeded from the company's real site. Film
 * grain is scoped to this block only.
 *
 * Rendered two ways: as the /experience page (window scroll) and inside the
 * homepage intro overlay (its own scroll container).
 */
export function CinematicHero({ scrollContainerRef, onActOneProgress }: CinematicHeroProps) {
  return (
    <div className="relative bg-coal">
      <ScrollVideoHero scrollContainerRef={scrollContainerRef} onProgress={onActOneProgress} />
      <FeatureSection scrollContainerRef={scrollContainerRef} />
      <CtaSection scrollContainerRef={scrollContainerRef} />
      {/* Hero-scoped grain wash (absolute, not fixed). Normal blend (no
          per-frame mix-blend recomposite) keeps scroll compositing cheap. */}
      <div
        aria-hidden
        className="grain pointer-events-none absolute inset-0 z-20 opacity-[0.06]"
      />
    </div>
  );
}
