"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";

interface ScrubFramesOptions {
  /** Folder of zero-padded frames, e.g. "/frames/firefly-1". */
  base: string;
  /** Number of frames (e.g. 96 → 0001.webp … 0096.webp). */
  count: number;
  /** Zero-pad width of the filename index. */
  pad?: number;
  /** Scroll progress (0..1) at which the sequence reaches its last frame. */
  completeAt?: number;
  /** Per-frame easing for a weighty, cinematic scrub. */
  ease?: number;
}

interface ScrubFramesResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Fraction of frames decoded and ready (0..1). */
  loaded: number;
}

/**
 * Buttery scroll-scrubbing by drawing a decoded image sequence to a <canvas>,
 * instead of seeking a <video>'s currentTime (which forces a costly decode-seek
 * per step and stutters). Frames are preloaded + decoded up front; on scroll we
 * lerp toward the target frame and draw with `object-cover` math. If the exact
 * frame isn't ready yet we draw the nearest decoded one, so it never blanks.
 */
export function useScrubFrames(
  progress: MotionValue<number>,
  { base, count, pad = 4, completeAt = 1, ease = 0.12 }: ScrubFramesOptions,
): ScrubFramesResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frames = useRef<HTMLImageElement[]>([]);
  const ready = useRef<boolean[]>([]);
  const target = useRef(0);
  const current = useRef(0);
  const lastDrawn = useRef(-1);
  const [loaded, setLoaded] = useState(0);

  const nearestReady = useCallback(
    (idx: number): number => {
      const flags = ready.current;
      if (flags[idx]) return idx;
      for (let d = 1; d < count; d++) {
        if (idx - d >= 0 && flags[idx - d]) return idx - d;
        if (idx + d < count && flags[idx + d]) return idx + d;
      }
      return -1;
    },
    [count],
  );

  const draw = useCallback(
    (rawIdx: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const idx = nearestReady(rawIdx);
      if (idx < 0) return;
      const img = frames.current[idx];
      const ctx = canvas.getContext("2d");
      if (!img || !ctx) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!cw || !ch || !iw || !ih) return;
      // object-cover
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      lastDrawn.current = rawIdx;
    },
    [nearestReady],
  );

  // Preload + decode every frame.
  useEffect(() => {
    let cancelled = false;
    let done = 0;
    const imgs: HTMLImageElement[] = new Array(count);
    const flags: boolean[] = new Array(count).fill(false);
    frames.current = imgs;
    ready.current = flags;

    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = "async";
      // Fetch the opening frames first so the very first frame paints fast and
      // the host can lift its loader; later frames stream in at low priority.
      img.setAttribute("fetchpriority", i < 24 ? "high" : "low");
      const mark = () => {
        if (cancelled) return;
        flags[i] = true;
        done += 1;
        setLoaded(done / count);
        if (i === 0 || lastDrawn.current < 0) draw(Math.round(current.current));
      };
      img.onload = () => {
        // Warm the decode cache so the first draw of this frame can't hitch.
        if (img.decode) img.decode().then(mark).catch(mark);
        else mark();
      };
      img.onerror = mark;
      img.src = `${base}/${String(i + 1).padStart(pad, "0")}.webp`;
      imgs[i] = img;
    }
    return () => {
      cancelled = true;
      frames.current = [];
      ready.current = [];
    };
  }, [base, count, pad, draw]);

  // Map scroll → target frame index.
  useMotionValueEvent(progress, "change", (v) => {
    const p = Math.min(Math.max(v / completeAt, 0), 1);
    target.current = p * (count - 1);
  });

  // Size the canvas backing store to its displayed size (DPR-capped), redraw.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        lastDrawn.current = -1;
        draw(Math.round(current.current));
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // rAF: ease toward the scroll target, redraw only when the frame changes.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      current.current += (target.current - current.current) * ease;
      const idx = Math.round(current.current);
      if (idx !== lastDrawn.current) draw(idx);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ease, draw]);

  return { canvasRef, loaded };
}
