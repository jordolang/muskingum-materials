import type { Metadata } from "next";
import { CinematicHero } from "@/components/home/cinematic-hero";

export const metadata: Metadata = {
  title: "The Yard — A Scroll Experience",
  description:
    "Scroll through the Muskingum Materials yard: heavy equipment moving earth and aggregate dumped by the ton.",
};

/**
 * Standalone cinematic experience at /experience. Renders the same hero used by
 * the homepage intro overlay, here tracking window scroll.
 */
export default function ExperiencePage() {
  return <CinematicHero />;
}
