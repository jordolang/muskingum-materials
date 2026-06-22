import { ScrollVideoHero } from "./cinematic-hero/scroll-video-hero";
import { RockDumpSection } from "./cinematic-hero/rock-dump-section";

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
 * The cinematic, scroll-driven hero: Act 1 (loader pull-back) into Act 2 (rock
 * dump filling the word AGGREGATE). Film grain is scoped to this block only.
 *
 * Rendered two ways: as the /experience page (window scroll) and inside the
 * homepage intro overlay (its own scroll container).
 */
export function CinematicHero({ scrollContainerRef, onActOneProgress }: CinematicHeroProps) {
  return (
    <div className="relative bg-coal">
      <ScrollVideoHero scrollContainerRef={scrollContainerRef} onProgress={onActOneProgress} />
      <RockDumpSection scrollContainerRef={scrollContainerRef} />
      {/* Hero-scoped grain wash (absolute, not fixed). Normal blend (no
          per-frame mix-blend recomposite) keeps scroll compositing cheap. */}
      <div
        aria-hidden
        className="grain pointer-events-none absolute inset-0 z-20 opacity-[0.06]"
      />
    </div>
  );
}
