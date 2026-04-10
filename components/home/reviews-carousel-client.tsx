"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const SILHOUETTE_MAP = {
  single: "/images/silhouettes/single-person.svg",
  couple: "/images/silhouettes/couple.svg",
  family: "/images/silhouettes/family.svg",
} as const;

type SilhouetteType = keyof typeof SILHOUETTE_MAP;

interface Testimonial {
  _id: string;
  name: string;
  company?: string;
  rating: number;
  text: string;
}

interface ReviewsCarouselClientProps {
  testimonials: Testimonial[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-stone-600 text-stone-600"
          }`}
        />
      ))}
    </div>
  );
}

function inferSilhouetteType(name: string): SilhouetteType {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("family")) return "family";
  if (lowerName.includes("&") || lowerName.includes(" and ")) return "couple";
  return "single";
}

export function ReviewsCarouselClient({ testimonials }: ReviewsCarouselClientProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    if (!isAutoPlaying || !testimonials.length) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, next, testimonials.length]);

  if (!testimonials.length) {
    return (
      <div className="text-center text-stone-400 py-8">
        No reviews available at this time.
      </div>
    );
  }

  const testimonial = testimonials[current];
  const silhouetteType = inferSilhouetteType(testimonial.name);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Main Card - Frosted Glass */}
      <div className="relative max-w-3xl mx-auto">
        <div className="relative rounded-2xl overflow-hidden">
          {/* Glass background */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl" />

          <div className="relative flex items-stretch min-h-[280px]">
            {/* Silhouette Side */}
            <div className="hidden sm:flex w-40 shrink-0 items-end justify-center px-4 pb-0">
              <div className="relative">
                {/* Ambient glow behind silhouette */}
                <div className="absolute -inset-4 bg-amber-500/10 blur-2xl rounded-full" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={SILHOUETTE_MAP[silhouetteType]}
                  alt=""
                  className="relative h-44 w-auto drop-shadow-[0_0_15px_rgba(245,158,11,0.2)] invert brightness-200 opacity-80"
                  aria-hidden
                />
              </div>
            </div>

            {/* Review Content */}
            <div className="flex-1 p-8 flex flex-col justify-center">
              <StarRating rating={testimonial.rating} />

              <blockquote className="mt-4 text-stone-100 text-sm sm:text-base leading-relaxed font-light italic">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <p className="text-sm font-semibold text-white">
                  {testimonial.name}
                </p>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Previous review"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-6 bg-amber-400"
                  : "w-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          aria-label="Next review"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
