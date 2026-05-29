"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

interface ScrubOptions {
  /** Scroll progress (0..1) at which the video reaches its final frame. */
  completeAt?: number;
  /** Easing factor per frame (0..1). Lower = heavier, more cinematic lag. */
  ease?: number;
}

/**
 * Drives an HTMLVideoElement's currentTime from a scroll-linked MotionValue.
 *
 * The video is never `play()`-ed; instead we seek it frame-by-frame, easing the
 * current time toward a scroll-derived target inside a rAF loop so the scrub
 * feels weighty rather than snapping. Pair with all-intra (every-frame-keyframe)
 * encoded MP4s for frame-accurate seeking.
 */
export function useScrubVideo(
  progress: MotionValue<number>,
  { completeAt = 1, ease = 0.12 }: ScrubOptions = {},
): React.RefObject<HTMLVideoElement | null> {
  const videoRef = useRef<HTMLVideoElement>(null);
  const target = useRef(0);
  const current = useRef(0);

  useMotionValueEvent(progress, "change", (value) => {
    const video = videoRef.current;
    if (!video) return;
    const duration = video.duration;
    if (!duration || Number.isNaN(duration)) return;

    const p = Math.min(Math.max(value / completeAt, 0), 1);
    target.current = p * duration;
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const video = videoRef.current;
      if (video && video.duration && !Number.isNaN(video.duration)) {
        current.current += (target.current - current.current) * ease;
        if (Math.abs(target.current - current.current) > 0.004) {
          try {
            video.currentTime = current.current;
          } catch {
            // Seeking can throw if metadata isn't ready yet; ignore and retry.
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ease]);

  return videoRef;
}
